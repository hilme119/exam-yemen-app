import React from 'react';
import { 
  ArrowRight, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { Exam, Question } from '../types';
import { MathRenderer } from '../components/common/MathRenderer';
import { formatEnNumber, toEnDigits } from '../utils/formatters';

interface QuestionsViewProps {
  exam: Exam;
  questions: Question[];
  onBack: () => void;
  onOpenAddQuestion: () => void;
  onOpenEditQuestion: (q: Question) => void;
  onOpenBulkImport: () => void;
  onDeleteQuestion: (qId: string) => void;
  onDeleteAllQuestions: () => void;
}

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  exam,
  questions,
  onBack,
  onOpenAddQuestion,
  onOpenEditQuestion,
  onOpenBulkImport,
  onDeleteQuestion,
  onDeleteAllQuestions,
}) => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Studio Header Banner */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs"
          >
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span>رجوع للاختبارات</span>
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {exam.subjectName || 'مادة وزارية'}
              </span>
              {exam.academicYear && (
                <span className="text-xs text-slate-500 font-mono font-medium">
                  {exam.academicYear}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {exam.title}
            </h2>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddQuestion}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة سؤال جديد</span>
          </button>

          <button
            onClick={onOpenBulkImport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            <span>استيراد ذكي (Excel / نص)</span>
          </button>

          {questions.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`هل أنت متأكد من تفريغ وحذف جميع أسئلة هذا النموذج (${questions.length} سؤال) نهائياً من قاعدة بيانات فايربيس؟`)) {
                  onDeleteAllQuestions();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
              title="تفريغ النموذج"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف الكل</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta Counter */}
      <div className="calm-panel p-3.5 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>إجمالي الأسئلة في هذا النموذج: <strong className="text-blue-700 font-mono text-sm">{formatEnNumber(questions.length)}</strong> سؤال وزاري</span>
        </span>
        <span className="text-slate-400 text-[11px] font-mono">
          exams/{exam.id}/questions
        </span>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="calm-panel p-16 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">لا توجد أسئلة مضافة في هذا النموذج بعد</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              اضغط على "إضافة سؤال جديد" لإدخال سؤال مع خياراته، أو استخدم زر "استيراد ذكي" لإدخال عشرات الأسئلة دفعة واحدة من ملف Excel.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAddQuestion}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول سؤال الآن</span>
            </button>
            <button
              onClick={onOpenBulkImport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>استيراد ملف Excel</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="calm-panel p-5 space-y-4 border border-slate-200 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 font-mono shadow-xs">
                    {formatEnNumber(idx + 1)}
                  </span>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 leading-relaxed">
                      <MathRenderer content={q.text} />
                    </div>
                    {q.questionImageUrl && (
                      <img
                        src={q.questionImageUrl}
                        alt="صورة السؤال"
                        className="max-h-56 rounded-xl object-contain border border-slate-200 my-2 shadow-xs"
                      />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onOpenEditQuestion(q)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 transition-all"
                    title="تعديل السؤال"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا السؤال من قاعدة البيانات؟')) {
                        onDeleteQuestion(q.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                    title="حذف السؤال"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correctAnswerIndex === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <div className="truncate">
                          <MathRenderer content={opt} />
                        </div>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                          الإجابة الصحيحة ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation if exists */}
              {q.explanation && (
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                  <strong className="block text-blue-800 font-bold mb-0.5">التوضيح والشرح الوزاري:</strong>
                  <MathRenderer content={q.explanation} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
