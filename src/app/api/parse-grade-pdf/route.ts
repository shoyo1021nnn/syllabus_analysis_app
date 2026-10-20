import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { createClient } from "@supabase/supabase-js";
import { CourseSkillVector } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// 合格判定（修得済み判定）
function checkIsPassed(grade: string): boolean {
  const g = normalizeGrade(grade);
  if (!g || g === "*" || g === "F" || g === "D" || g === "否" || g === "不可") {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDFファイルがアップロードされていません" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // PDFテキスト抽出 (unpdf)
    const { text: pagesText } = await extractText(uint8);
    const rawText = Array.isArray(pagesText) ? pagesText.join("\n") : (pagesText || "");
    // 特殊スペース（ノーブレークスペース \u00A0 や全角スペース \u3000 等）を通常の半角空白に統一
    const text = rawText.replace(/[\u00A0\u3000\u2000-\u200B]/g, " ");

    if (!text.trim()) {
      return NextResponse.json({ error: "PDFからテキストを抽出できませんでした" }, { status: 400 });
    }

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
        line === "成績照会" ||
        line.startsWith("※")
      ) {
        continue;
      }

      const hasDate = /\b20[0-9]{2}\/[0-9]{2}\/[0-9]{2}\b/.test(line);
      const hasCode = /\b[0-9]{8}\b/.test(line);

      if (hasDate && hasCode) {
        // レコード本体行
        const fullLine = pendingPrefix ? `${pendingPrefix} ${line}` : line;
        lines.push(fullLine);
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

    // パターン1: 1行にまとまっている場合
    // 例: 学術英語・アカデミックイシューズ 1 S 4.0 2023 前 KED-LCB1153W 23531351 松村 瑞子 2023/08/17
    // 例: 基幹教育セミナー 1 R * 2023 夏学期 KED-KES1111J 23535315 木實 新一 2023/08/27
    const singleLineRegex = /^(.*?)(?:\s+|(?<=[^\s0-9]))([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z0-9*合否]+)\s+([0-9*.]+)\s+(20[0-9]{2})\s+(\S+)\s+([A-Z0-9-]{8,15})\s+([0-9]{8})\s+(.*?)\s+([0-9]{4}\/[0-9]{2}\/[0-9]{2})$/;

    // パターン2: 最終更新日や講義コードが含まれる行を緩やかにキャッチ
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 単一行正規表現マッチ
      const match = line.match(singleLineRegex);
      if (match) {
        let rawCourseName = match[1].trim();
        const credits = parseFloat(match[2]) || 2;
        const grade = normalizeGrade(match[3]);
        const gp = match[4].trim();
        const year = parseInt(match[5], 10);
        const term = match[6].trim();
        let numbering = match[7].trim();
        const courseCode = match[8].trim();
        const instructor = match[9].trim();

        // 科目名の末尾にナンバリングの断片 (例: "KED-xxx 22J") が混入している場合の修正
        const numFragmentMatch = rawCourseName.match(/\s+([A-Z]{3}-[A-Z0-9-]{3,12})$/);
        if (numFragmentMatch) {
          numbering = `${numFragmentMatch[1]}${numbering}`;
          rawCourseName = rawCourseName.replace(/\s+[A-Z]{3}-[A-Z0-9-]{3,12}$/, "").trim();
        }

        // 科目名末尾の余計な空白を結合
        rawCourseName = rawCourseName.replace(/\s+/g, "");

        if (!rawCourseName.includes("分野系列名") && !rawCourseName.includes("科目名")) {
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
          continue;
        }
      }

      // パターン3: 8桁コード + 日付が含まれる行をトークン分割してパース
      const dateMatch = line.match(/\b(20[0-9]{2}\/[0-9]{2}\/[0-9]{2})\b/);
      const codeMatch = line.match(/\b([0-9]{8})\b/);
      if (dateMatch && codeMatch) {
        const tokens = line.split(/\s+/);
        const codeIdx = tokens.findIndex((t) => /^[0-9]{8}$/.test(t));
        const dateIdx = tokens.findIndex((t) => /^20[0-9]{2}\/[0-9]{2}\/[0-9]{2}$/.test(t));

        if (codeIdx > 0 && dateIdx > codeIdx) {
          const courseCode = tokens[codeIdx];
          const instructor = tokens.slice(codeIdx + 1, dateIdx).join(" ");
          let numberingCandidate = tokens[codeIdx - 1];
          let numbering = /^[A-Z0-9-]{4,15}$/.test(numberingCandidate) ? numberingCandidate : undefined;

          // 前のトークンにナンバリングの前半がある場合 (例: "KED-SCH12" "22J")
          if (codeIdx >= 2) {
            const prevToken = tokens[codeIdx - 2];
            if (/^[A-Z]{3}-[A-Z0-9]{3,8}$/.test(prevToken) && numbering) {
              numbering = `${prevToken}${numbering}`;
            }
          }

          let year = 2023;
          let term = "";
          let gp = "*";
          let grade = "";
          let credits = 2;
          let nameEndIdx = codeIdx - (numbering ? 2 : 1);

          for (let j = 0; j < codeIdx; j++) {
            if (/^20[0-9]{2}$/.test(tokens[j])) {
              year = parseInt(tokens[j], 10);
            }
            if (/^[0-9]+(?:\.[0-9]+)?$/.test(tokens[j]) && j <= 2) {
              credits = parseFloat(tokens[j]) || credits;
            }
            if (/^[SABCDF R合否*]+$/i.test(tokens[j]) && tokens[j].length <= 2) {
              grade = normalizeGrade(tokens[j]);
            }
          }

          let rawCourseName = tokens.slice(0, Math.max(1, nameEndIdx - 2)).join(" ") || tokens[0];
          // 不要な記号除去
          rawCourseName = rawCourseName.replace(/^[0-9.]+\s*/, "").trim();

          // rawCourseName に末尾の単位数・評価・GP（例: "現代物理学基礎2 A 3.0", "無機物質化学I 1 S 4.0"）が混入している場合を分解抽出
          const gradeTailRegex = /^(.*?)(?:\s+|(?<=[^\s0-9]))([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z0-9*合否]+)\s+([0-9*.]+)$/;
          const tailMatch = rawCourseName.match(gradeTailRegex);
          if (tailMatch) {
            rawCourseName = tailMatch[1].trim();
            credits = parseFloat(tailMatch[2]) || credits;
            grade = normalizeGrade(tailMatch[3]);
            gp = tailMatch[4].trim();
          }

          // それでもgradeが取得できなかった場合のデフォルト
          if (!grade) {
            grade = "合";
          }

          if (!rawCourseName.includes("分野系列名") && !rawCourseName.includes("科目名")) {
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
      const orConditions = codeSuffixes.map((s) => `course_code.ilike.%${s}`).join(",");
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
  } catch (err: any) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "PDFの処理中にエラーが発生しました: " + (err?.message || "不明なエラー") },
      { status: 500 }
    );
  }
}
