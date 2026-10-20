"use client";

import { useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  User,
  Info,
  Calendar,
  Award
} from "lucide-react";
import { CourseSkillVector, EnrolledCourse } from "@/types/database";

export interface DetectedGradeItem {
  id: string;
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

export interface GradePdfImportItem {
  course: CourseSkillVector;
  grade?: string;
}

interface GradePdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrolledCourses: EnrolledCourse[];
  onImportCourses: (items: GradePdfImportItem[]) => void;
}

export default function GradePdfImportModal({
  isOpen,
  onClose,
  enrolledCourses,
  onImportCourses,
}: GradePdfImportModalProps) {
  const [step, setStep] = useState<"upload" | "confirm">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedGradeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 既に登録済みのコースIDセット
  const enrolledCourseIds = new Set(enrolledCourses.map((e) => e.course.id));
  const enrolledCourseCodes = new Set(enrolledCourses.map((e) => e.course.course_code).filter(Boolean));

  // ファイルアップロード＆解析処理
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("PDF形式のファイルを選択してください。");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-grade-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "PDFの解析に失敗しました。");
      }

      const items: DetectedGradeItem[] = data.detectedItems || [];
      setDetectedItems(items);

      // デフォルトで「合格（修得済み）かつ未登録」のものを選択
      const initialSelected = new Set<string>();
      items.forEach((item) => {
        const isAlreadyEnrolled =
          (item.matchedCourse && enrolledCourseIds.has(item.matchedCourse.id)) ||
          (item.courseCode && enrolledCourseCodes.has(item.courseCode));
        if (item.isPassed && !isAlreadyEnrolled) {
          initialSelected.add(item.id);
        }
      });
      setSelectedIds(initialSelected);

      setStep("confirm");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "PDF解析処理中にエラーが発生しました。");
    } finally {
      setIsUploading(false);
    }
  };

  // ドロップハンドラ
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 全選択 / 全解除
  const handleToggleSelectAll = () => {
    const selectableItems = detectedItems.filter((item) => {
      const isAlready =
        (item.matchedCourse && enrolledCourseIds.has(item.matchedCourse.id)) ||
        (item.courseCode && enrolledCourseCodes.has(item.courseCode));
      return !isAlready;
    });

    if (selectedIds.size === selectableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((i) => i.id)));
    }
  };

  // 単一トグル
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 確定して登録
  const handleConfirmImport = () => {
    const toImport: GradePdfImportItem[] = [];
    const seenIds = new Set<string>();

    detectedItems.forEach((item, idx) => {
      if (!selectedIds.has(item.id)) return;

      if (item.matchedCourse) {
        if (!seenIds.has(item.matchedCourse.id)) {
          seenIds.add(item.matchedCourse.id);
          toImport.push({
            course: item.matchedCourse,
            grade: item.grade || undefined,
          });
        }
      } else {
        const uniqueFallbackId = `grade_fallback_${item.courseCode || item.rawCourseName}_${item.year}_${idx}_${Date.now()}`;
        if (!seenIds.has(uniqueFallbackId)) {
          seenIds.add(uniqueFallbackId);
          const knowledgeVec = [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 3];
          const generalVec = [2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1, 1];
          const fallbackCourse: CourseSkillVector = {
            id: uniqueFallbackId,
            university_name: "九州大学",
            academic_year: item.year || 2025,
            course_name: item.rawCourseName,
            course_code: item.courseCode || `TEMP_${Date.now()}_${idx}`,
            course_numbering: item.numbering || null,
            faculty_name: "基幹教育科目",
            credits: item.credits || 2,
            semester: item.term || null,
            term_time: `${item.year}年度 ${item.term}`,
            instructor: item.instructor || "教員未記載",
            is_zero_vector: false,
            extraction_count: 3,
            knowledge_vector: knowledgeVec,
            general_vector: generalVec,
            a_1_education: 0,
            a_2_humanities: 0,
            a_3_arts: 0,
            a_4_social_sciences: 0,
            a_5_business: 0,
            a_6_natural_sciences: 0,
            a_7_ict: 0,
            a_8_engineering: 0,
            a_9_hardware_operation: 2,
            a_10_agriculture_forestry: 2,
            a_11_health_welfare: 2,
            a_12_services: 3,
            b_1_teamwork: 2,
            b_2_critical: 2,
            b_3_language: 1,
            b_4_ethics: 2,
            b_5_self_management: 2,
            b_6_problem_solving: 2,
            b_7_adaptability: 2,
            b_8_creativity: 1,
            b_9_expressiveness: 2,
            b_10_info_processing: 2,
            b_11_computer_skills: 1,
            b_12_leadership: 1,
          };
          toImport.push({
            course: fallbackCourse,
            grade: item.grade || undefined,
          });
        }
      }
    });

    if (toImport.length > 0) {
      onImportCourses(toImport);
    }
    handleClose();
  };

  const handleClose = () => {
    setStep("upload");
    setErrorMessage(null);
    setDetectedItems([]);
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* モーダルヘッダー */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Campusmate 成績照会PDFの一括取り込み</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-2xs">
                  AI自動解析
                </span>
              </h2>
              <p className="text-2xs text-slate-500">
                成績照会PDFから履修済み科目を自動抽出し、シラバスデータと照合して一括登録します。
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダルコンテンツ */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === "upload" ? (
            <div className="space-y-6">
              {/* ドロップゾーン */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]"
                    : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".pdf"
                  className="hidden"
                />

                {isUploading ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      PDFを解析し、シラバスデータと照合中...
                    </div>
                    <p className="text-2xs text-slate-400">
                      講義コード・ナンバリング・教員名を抽出しています
                    </p>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        ここに成績照会のPDFファイルをドラッグ＆ドロップ
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        またはクリックしてファイルを選択（.pdf）
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 手順・安心ガイド */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Campusmateからの出力手順</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-2xs text-slate-600 dark:text-slate-400 pl-1">
                  <li>Campusmateにログインし、<strong>「成績照会」</strong>画面を開きます。</li>
                  <li>ブラウザの印刷機能（Ctrl + P または ⌘ + P）を開き、送信先を<strong>「PDFとして保存」</strong>にします。</li>
                  <li>保存したPDFファイルを上記枠内にアップロードしてください。</li>
                </ol>
                <div className="text-3xs text-slate-400 dark:text-slate-500 pt-1 border-t border-indigo-100/60 dark:border-indigo-900/40">
                  ※ 学籍番号や個人情報は一切外部・サーバーに保存されません。
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: 検出結果の確認＆登録画面（ユーザーに尋ねるスタイル） */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>検出された履修科目 ({detectedItems.length}件)</span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    シラバスDBと照合しました。登録する科目を確認・選択してください。
                  </p>
                </div>

                {/* 全選択トグル */}
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center space-x-1"
                >
                  {selectedIds.size === detectedItems.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>選択全解除</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>未登録を全選択</span>
                    </>
                  )}
                </button>
              </div>

              {/* 科目カードスクロールリスト */}
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {detectedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isAlreadyEnrolled =
                    (item.matchedCourse && enrolledCourseIds.has(item.matchedCourse.id)) ||
                    (item.courseCode && enrolledCourseCodes.has(item.courseCode));

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isAlreadyEnrolled && handleToggleSelect(item.id)}
                      className={`p-3.5 rounded-2xl border transition-all text-xs ${
                        isAlreadyEnrolled
                          ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-70 cursor-default"
                          : isSelected
                          ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs cursor-pointer"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* チェックボックス */}
                        <div className="pt-0.5 shrink-0">
                          {isAlreadyEnrolled ? (
                            <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-3xs font-bold">
                              済
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleToggleSelect(item.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                          )}
                        </div>

                        {/* 科目詳細 */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* メタ情報バッジ */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 講義コード */}
                            {item.courseCode && (
                              <span className="font-mono text-2xs px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                                #{item.courseCode}
                              </span>
                            )}

                            {/* 評価バッジ */}
                            <span
                              className={`text-2xs px-1.5 py-0.2 rounded font-bold ${
                                item.isPassed
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              評価: {item.grade}
                            </span>

                            {/* 年度・期間 */}
                            <span className="text-2xs text-slate-500">
                              {item.year}年度 {item.term}
                            </span>

                            {/* 照合ステータスバッジ */}
                            {item.matchedCourse ? (
                              <span className="text-3xs px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 font-medium">
                                シラバス照合済 ({item.matchStatus === "exact" ? "コード一致" : "ナンバリング/教員一致"})
                              </span>
                            ) : (
                              <span className="text-3xs px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                過年度科目 (情報保持登録)
                              </span>
                            )}
                          </div>

                          {/* 科目名 */}
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {item.matchedCourse ? item.matchedCourse.course_name : item.rawCourseName}
                          </div>

                          {/* 原文科目名と異なる場合の補足 */}
                          {item.matchedCourse &&
                            item.matchedCourse.course_name !== item.rawCourseName &&
                            !/^[A-Z0-9-]+$/.test(item.rawCourseName) &&
                            item.rawCourseName.length > 2 && (
                              <div className="text-3xs text-slate-400">
                                PDF記載名: {item.rawCourseName}
                              </div>
                            )}

                          {/* 教員 ＆ 単位 */}
                          <div className="flex items-center gap-3 text-2xs text-slate-500 pt-0.5">
                            {item.instructor && (
                              <span className="inline-flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{item.instructor}</span>
                              </span>
                            )}
                            <span>{item.credits}単位</span>
                            {item.numbering && (
                              <span className="text-slate-400">({item.numbering})</span>
                            )}
                          </div>
                        </div>

                        {/* 登録状態 */}
                        {isAlreadyEnrolled && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-2xs shrink-0">
                            登録済
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* モーダルフッター */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          {step === "upload" ? (
            <div className="text-2xs text-slate-400">
              PDFファイルをアップロードして解析を開始します
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              ← 別のPDFをアップロード
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              キャンセル
            </button>

            {step === "confirm" && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedIds.size === 0}
                className="px-5 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>選択した {selectedIds.size} 件を履修登録する</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
