import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
// URL 正規化（末尾の /rest/v1 除去）と未設定時のフォールバックを持つ共通クライアントを使う
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ilikeEndsWith } from "@/lib/postgrestFilter";
import { CourseSkillVector } from "@/types/database";

export interface DetectedGradeItem {
  id: string; // 一時ユニークID
  rawCourseName: string;
  credits: number;
  grade: string;
  gp: string;
  year: number;
  term: string;
  numbering?: string;
  courseCode?: string;
  instructor?: string;
  isPassed: boolean;
  matchStatus: "exact" | "numbering" | "name" | "unmatched";
  matchedCourse: CourseSkillVector | null;
}

// グレード評価文字列の正規化（全角英数→半角英数、大文字化、trim）
function normalizeGrade(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .toUpperCase();
}

// 科目名文字列の整形（分野名・系列名の重複除去、全角カタカナ間の空白結合等）
function cleanCourseName(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^[0-9.]+\s*/, "").trim();

  // "課題協学科目 課題協学科目 課題協学科目" のように3回繰り返される場合の重複除去
  const tokens = s.split(/\s+/);
  if (tokens.length >= 2 && tokens.every((t) => t === tokens[0])) {
    return tokens[0];
  }

  // 典型的な分野・系列プレフィックスの除去
  s = s.replace(/^(?:基幹教育セミナー|課題協学科目|言語文化科目|文系ディシプリン科目|理系ディシプリン科目|高年次基幹教育科目|教養教育科目)\s+/g, "");
  s = s.replace(/^(?:言語文化基礎科目|人文科学系列|社会科学系列|自然科学系列)\s+/g, "");

  // PDF抽出時のセル内カタカナ分断（例: "アカ デミック" -> "アカデミック"）の結合
  s = s.replace(/([ァ-ヴー])\s+([ァ-ヴー])/g, "$1$2");

  return s.trim();
}

// 合格判定（修得済み判定）
function checkIsPassed(grade: string): boolean {
  const g = normalizeGrade(grade);
  if (!g || g === "*" || g === "F" || g === "D" || g === "否" || g === "不可") {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  // Supabase が未設定だと科目照合ができないため、PDF を解析する前に 503 を返す
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        error: "データベース（Supabase）が設定されていないため、科目を照合できません。",
        code: "db_not_configured",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDFファイルがアップロードされていません", code: "no_file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // PDFテキスト抽出 (unpdf)
    const { text: pagesText } = await extractText(uint8);
    const rawText = Array.isArray(pagesText) ? pagesText.join("\n") : (pagesText || "");

    // 1. 全角英数・記号のNFKC正規化（全角英数・全角スペース・記号を半角に統一）
    let text = rawText
      .normalize("NFKC")
      .replace(/[\u00A0\u3000\u2000-\u200B]/g, " ");

    if (!text.trim()) {
      return NextResponse.json({ error: "PDFからテキストを抽出できませんでした", code: "no_text" }, { status: 400 });
    }

    // 2. 後ろに "GP" と "年度(20XX)" が控えている位置にある "単位数+評価" を安全に分離
    // 例: "1R * 2023" -> "1 R * 2023", "2.5S 4.0 2023" -> "2.5 S 4.0 2023"
    text = text.replace(
      /(^|[\sァ-ヶー一-龠])([0-9]+(?:\.[0-9]+)?)\s*([SABCDFNRW合否\*])\s+([0-9*.]+)\s+(20[0-9]{2})/gi,
      "$1 $2 $3 $4 $5"
    );

    // 行ごとに分割してパース
    const rawLines = text
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    // 日付 (YYYY/MM/DD) と 講義コード (8桁数字) をアンカーにして、
    // セル内折り返しで分断された行を結合・再構成
    const lines: string[] = [];
    let pendingPrefix = "";

    for (const line of rawLines) {
      if (
        line.includes("分野系列名") ||
        line.includes("科目ごとの成績") ||
        line.includes("第１外国語") ||
        line.includes("第1外国語") ||
        line.includes("ログインユーザ") ||
        line.includes("最終更新日") ||
        line.includes("講義コード") ||
        line.includes("成績照会") ||
        line.startsWith("※") ||
        line.startsWith("---")
      ) {
        continue;
      }

      const hasDate = /\b20[0-9]{2}\/[0-9]{2}\/[0-9]{2}\b/.test(line);
      const hasCode = /\b[0-9]{8}\b/.test(line);

      if (hasDate && hasCode) {
        // レコード本体行
        const fullLine = pendingPrefix ? `${pendingPrefix} ${line}` : line;
        lines.push(fullLine.replace(/\s+/g, " ").trim());
        pendingPrefix = "";
      } else {
        // 折り返された断片行（科目名上段、ナンバリング上段など）
        pendingPrefix = pendingPrefix ? `${pendingPrefix} ${line}` : line;
      }
    }

    const rawDetected: Array<{
      rawCourseName: string;
      credits: number;
      grade: string;
      gp: string;
      year: number;
      term: string;
      numbering?: string;
      courseCode?: string;
      instructor?: string;
    }> = [];

    // 講義コード(8桁)と日付(YYYY/MM/DD)をアンカーとして各行を高精度パース
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const dateMatch = line.match(/\b(20[0-9]{2}\/[0-9]{2}\/[0-9]{2})\b/);
      const codeMatch = line.match(/\b([0-9]{8})\b/);

      if (!dateMatch || !codeMatch) continue;

      const courseCode = codeMatch[1];
      const dateStr = dateMatch[1];
      const codeIdx = line.indexOf(courseCode);
      const dateIdx = line.indexOf(dateStr);

      // 教員名（講義コードと日付の間）
      const instructor = line.slice(codeIdx + courseCode.length, dateIdx).trim();

      // 講義コードより前の部分（科目名, 単位数, 評価, GP, 年度, 学期, ナンバリング）
      const beforeCode = line.slice(0, codeIdx).trim();

      // パターン1: 講義コード直前部を末尾から一括抽出
      // 構成: [科目名部] + [単位数] + [評価] + [GP] + [年度] + [学期] + [ナンバリング(任意)]
      const beforeCodeRegex = /^(.*?)\s+([0-9]+(?:\.[0-9]+)?)\s+([SABCDFNRW合否\*]{1,2})\s+([0-9]+(?:\.[0-9]+)?|\*)\s+(20[0-9]{2})\s+(\S+)(?:\s+([A-Z0-9 -]{4,15}))?$/i;
      const match = beforeCode.match(beforeCodeRegex);

      let rawCourseName = "";
      let credits = 2;
      let grade = "";
      let gp = "*";
      let year = 2023;
      let term = "";
      let numbering: string | undefined = undefined;

      if (match) {
        rawCourseName = cleanCourseName(match[1]);
        credits = parseFloat(match[2]) || 2;
        grade = normalizeGrade(match[3]);
        gp = match[4].trim();
        year = parseInt(match[5], 10);
        term = match[6].trim();
        numbering = match[7] ? match[7].replace(/\s+/g, "").trim() : undefined;
      } else {
        // パターン2: トークン分割による後ろ向きフォールバック解析
        const tokens = beforeCode.split(/\s+/);
        let ptr = tokens.length - 1;

        // ナンバリング候補 (末尾が4〜15文字の英数記号)
        if (ptr >= 0 && /^[A-Z0-9-]{4,15}$/.test(tokens[ptr])) {
          numbering = tokens[ptr];
          ptr--;
        }
        // 学期候補 (年度や数値でない文字列)
        if (ptr >= 0 && !/^20[0-9]{2}$/.test(tokens[ptr]) && !/^[0-9.]+$/.test(tokens[ptr])) {
          term = tokens[ptr];
          ptr--;
        }
        // 年度候補 (20XX)
        if (ptr >= 0 && /^20[0-9]{2}$/.test(tokens[ptr])) {
          year = parseInt(tokens[ptr], 10);
          ptr--;
        }
        // GP候補 (数値または*)
        if (ptr >= 0 && (/^[0-9]+(?:\.[0-9]+)?$/.test(tokens[ptr]) || tokens[ptr] === "*")) {
          gp = tokens[ptr];
          ptr--;
        }
        // 評価候補 (S, A, B, C, D, F, R, W, 合, 否, *)
        if (ptr >= 0 && /^[SABCDFNRW合否\*]{1,2}$/i.test(tokens[ptr])) {
          grade = normalizeGrade(tokens[ptr]);
          ptr--;
        }
        // 単位数候補
        if (ptr >= 0 && /^[0-9]+(?:\.[0-9]+)?$/.test(tokens[ptr])) {
          credits = parseFloat(tokens[ptr]) || credits;
          ptr--;
        }

        rawCourseName = cleanCourseName(tokens.slice(0, ptr + 1).join(" ") || tokens[0]);
      }

      // 評価アルファベットの安全な導出とフォールバック
      // 評価が空またはGP記号(*)だった場合、GP情報から正確に補正
      if (!grade || grade === "*") {
        if (gp === "4.0" || gp === "4") grade = "S";
        else if (gp === "3.0" || gp === "3") grade = "A";
        else if (gp === "2.0" || gp === "2") grade = "B";
        else if (gp === "1.0" || gp === "1") grade = "C";
        else if (gp === "0.0" || gp === "0") grade = "F";
        else if (gp === "*") grade = "R"; // Campusmateの合否科目はR (Recognition)
        else grade = "合";
      }

      if (!rawCourseName.includes("分野系列名") && !rawCourseName.includes("科目名") && rawCourseName.length > 0) {
        rawDetected.push({
          rawCourseName,
          credits,
          grade,
          gp,
          year,
          term,
          numbering,
          courseCode,
          instructor,
        });
      }
    }

    // 重複除去（同一講義コードまたは同一科目名・年度）
    const uniqueRaw: typeof rawDetected = [];
    const seenKeys = new Set<string>();
    for (const item of rawDetected) {
      const key = `${item.courseCode || item.rawCourseName}_${item.year}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueRaw.push(item);
      }
    }

    if (uniqueRaw.length === 0) {
      return NextResponse.json({
        success: false,
        error: "成績照会PDFから科目を検出できませんでした。Campusmateの「成績照会」画面のPDFかご確認ください。",
        // クライアントは code で表示言語の文言に変換する（error は従来互換の日本語メッセージ）
        code: "no_courses",
      }, { status: 422 });
    }

    // Supabase DB照合処理
    // 1. 講義コード完全一致検索
    const codes = uniqueRaw.map((r) => r.courseCode).filter(Boolean) as string[];
    const { data: byCodes } = codes.length > 0
      ? await supabase.from("course_skill_vectors").select("*").in("course_code", codes)
      : { data: [] };

    // 1-2. 講義コード「下6桁」による過年度コード照合 (例: 23531620 -> 25531620)
    const codeSuffixes = Array.from(
      new Set(
        uniqueRaw
          .map((r) => (r.courseCode && r.courseCode.length === 8 ? r.courseCode.slice(-6) : null))
          .filter(Boolean) as string[]
      )
    );

    let bySuffixData: CourseSkillVector[] = [];
    if (codeSuffixes.length > 0) {
      // 50件ずつバッチ照会
      // PDF から読み取った値を .or() の文字列に埋め込むため、念のためクォートしてエスケープする
      const orConditions = codeSuffixes.map((s) => ilikeEndsWith("course_code", s)).join(",");
      const { data: suffixMatches } = await supabase
        .from("course_skill_vectors")
        .select("*")
        .or(orConditions);
      if (suffixMatches) {
        bySuffixData = suffixMatches;
      }
    }

    // 2. ナンバリング一致検索
    const numberings = uniqueRaw.map((r) => r.numbering).filter(Boolean) as string[];
    const { data: byNumberings } = numberings.length > 0
      ? await supabase.from("course_skill_vectors").select("*").in("course_numbering", numberings)
      : { data: [] };

    const detectedItems: DetectedGradeItem[] = [];
    const assignedCourseIds = new Set<string>();

    for (let idx = 0; idx < uniqueRaw.length; idx++) {
      const raw = uniqueRaw[idx];
      const isPassed = checkIsPassed(raw.grade);
      let matchedCourse: CourseSkillVector | null = null;
      let matchStatus: DetectedGradeItem["matchStatus"] = "unmatched";

      // 1. コード完全一致（未割り当て優先）
      if (raw.courseCode) {
        const found = (byCodes || []).find(
          (c) => c.course_code === raw.courseCode && !assignedCourseIds.has(c.id)
        );
        if (found) {
          matchedCourse = found;
          matchStatus = "exact";
        }
      }

      // 1-2. 講義コード「下6桁」一致（過年度科目対応：23531620 -> 25531620 有機物質化学Ⅰ）
      if (!matchedCourse && raw.courseCode && raw.courseCode.length === 8) {
        const suffix = raw.courseCode.slice(-6);
        const suffixMatches = (bySuffixData || []).filter(
          (c) => c.course_code.endsWith(suffix) && !assignedCourseIds.has(c.id)
        );
        if (suffixMatches.length > 0) {
          if (raw.instructor) {
            const rawInstClean = raw.instructor.replace(/\s+/g, "");
            const instMatch = suffixMatches.find((c) => {
              const cInstClean = (c.instructor || "").replace(/\s+/g, "");
              return cInstClean.includes(rawInstClean) || rawInstClean.includes(cInstClean);
            });
            matchedCourse = instMatch || suffixMatches[0];
          } else {
            matchedCourse = suffixMatches[0];
          }
          matchStatus = "exact";
        }
      }

      // 2. ナンバリング一致（教員名考慮・スペース正規化・未割り当て優先）
      if (!matchedCourse && raw.numbering) {
        const numMatches = (byNumberings || []).filter(
          (c) => c.course_numbering?.includes(raw.numbering!) && !assignedCourseIds.has(c.id)
        );
        if (numMatches.length > 0) {
          if (raw.instructor) {
            const rawInstClean = raw.instructor.replace(/\s+/g, "");
            const instMatch = numMatches.find((c) => {
              const cInstClean = (c.instructor || "").replace(/\s+/g, "");
              return cInstClean.includes(rawInstClean) || rawInstClean.includes(cInstClean);
            });
            matchedCourse = instMatch || numMatches[0];
          } else {
            matchedCourse = numMatches[0];
          }
          matchStatus = "numbering";
        }
      }

      // 3. 科目名による一致検索（サフィックス・ローマ数字の一致を厳密化）
      if (!matchedCourse && raw.rawCourseName) {
        // 全角・半角統一や括弧の除去
        const cleanName = raw.rawCourseName
          .replace(/[（(].*?[）)]/g, "")
          .replace(/[・\s]+/g, "")
          .trim();

        // ローマ数字や番号の検出 (Ⅰ, Ⅱ, Ⅲ, Ⅳ, 1, 2, A, B など)
        const romanMatch = raw.rawCourseName.match(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ1234AB]/);
        const targetSuffix = romanMatch ? romanMatch[0] : null;

        if (cleanName.length >= 2) {
          // まず完全一致・前方一致を問い合わせ
          const { data: nameMatches } = await supabase
            .from("course_skill_vectors")
            .select("*")
            .ilike("course_name", `%${cleanName}%`)
            .limit(10);

          if (nameMatches && nameMatches.length > 0) {
            // 未割り当ての候補に絞り込み
            const availableCandidates = nameMatches.filter((c) => !assignedCourseIds.has(c.id));

            // サフィックス（Ⅰ, Ⅱ など）が一致する候補を優先
            let filteredCandidates = availableCandidates;
            if (targetSuffix) {
              const suffixMatches = availableCandidates.filter((c) => c.course_name.includes(targetSuffix));
              if (suffixMatches.length > 0) {
                filteredCandidates = suffixMatches;
              }
            }

            if (filteredCandidates.length > 0) {
              // 教員名も一致するものを最優先
              if (raw.instructor) {
                const rawInstClean = raw.instructor.replace(/\s+/g, "");
                const instMatch = filteredCandidates.find((c) => {
                  const cInstClean = (c.instructor || "").replace(/\s+/g, "");
                  return cInstClean.includes(rawInstClean) || rawInstClean.includes(cInstClean);
                });
                // 教員が一致するか、科目名が完全一致する場合のみ採用（誤マッチ防止）
                if (instMatch) {
                  matchedCourse = instMatch;
                  matchStatus = "name";
                } else {
                  const exactNameMatch = filteredCandidates.find(
                    (c) => c.course_name.replace(/[（(].*?[）)]/g, "").replace(/[・\s]+/g, "").trim() === cleanName
                  );
                  if (exactNameMatch) {
                    matchedCourse = exactNameMatch;
                    matchStatus = "name";
                  }
                }
              } else {
                matchedCourse = filteredCandidates[0];
                matchStatus = "name";
              }
            }
          }
        }
      }

      // マッチした場合は割り当て済みIDとして記録（同一バッチ内の重複割り当てを防止）
      if (matchedCourse) {
        assignedCourseIds.add(matchedCourse.id);
      }

      detectedItems.push({
        id: `pdf_item_${idx}_${Date.now()}`,
        rawCourseName: raw.rawCourseName,
        credits: raw.credits,
        grade: raw.grade,
        gp: raw.gp,
        year: raw.year,
        term: raw.term,
        numbering: raw.numbering,
        courseCode: raw.courseCode,
        instructor: raw.instructor,
        isPassed,
        matchStatus,
        matchedCourse,
      });
    }

    return NextResponse.json({
      success: true,
      extractedCount: detectedItems.length,
      detectedItems,
    });
  } catch (err) {
    console.error("PDF parse error:", err);
    // 従来の err?.message と同じく、message を持つ値ならその文字列を使う
    const message =
      err && typeof err === "object" && "message" in err && err.message ? String(err.message) : "";
    return NextResponse.json(
      {
        error: "PDFの処理中にエラーが発生しました: " + (message || "不明なエラー"),
        code: "processing_failed",
        detail: message,
      },
      { status: 500 }
    );
  }
}
