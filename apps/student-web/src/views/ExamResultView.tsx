import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Target,
  ArrowRight,
  Home,
  Clock,
  HelpCircle,
  Lightbulb,
  Flag,
  Share2,
  Eye,
  Filter
} from 'lucide-react';
import { ExamModel, QuestionModel, ResultModel, StudentUser } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { toEnDigits, formatTimer } from '../utils/numberFormatter';

interface ExamResultViewProps {
  result: ResultModel;
  questions: QuestionModel[];
  exam: ExamModel;
  currentUser: StudentUser | null;
  onRetakeFull: () => void;
  onRetakeMistakes: (wrongQuestions: QuestionModel[]) => void;
  onBackToList: () => void;
  onGoHome: () => void;
  onOpenReportModal?: (q: QuestionModel, index: number) => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result,
  questions,
  exam,
  currentUser,
  onRetakeFull,
  onRetakeMistakes,
  onBackToList,
  onGoHome,
  onOpenReportModal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mistakes' | 'correct'>('all');
  const [showShareToast, setShowShareToast] = useState(false);

  const percentage = Math.round(result.percentage ?? (result.score / Math.max(1, result.totalQuestions)) * 100);
  const correctCount = result.score;
  const totalCount = result.totalQuestions;
  const wrongCount = Math.max(0, totalCount - correctCount);

  // Identify wrong questions
  const wrongQuestions = questions.filter((q) => {
    const selected = result.selectedAnswers[q.id];
    return selected === undefined || selected !== q.correctAnswerIndex;
  });

  useEffect(() => {
    // Confetti celebration if passing with good score
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [percentage]);

  const getScoreAssessment = () => {
    if (percentage >= 90) {
      return {
        badge: '🏆 ممتاز ومتميز جداً',
        sub: 'مستوى استثنائي! أنت في قمة التفوق والصدارة بإذن الله',
        color: 'from-amber-500 to-emerald-600',
        textColor: 'text-amber-500',
        bgColor: 'bg-amber-50 border-amber-200'
      };
    } else if (percentage >= 80) {
      return {
        badge: '🌟 رائع جداً ومتقدم',
        sub: 'أداء ممتاز، استمر في المراجعة للوصول للدرجة النهائية',
        color: 'from-blue-600 to-indigo-600',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      };
    } else if (percentage >= 65) {
      return {
        badge: '👍 جيد، ومبشر بالخير',
        sub: 'درجة طيبة، ركز على حل الأخطاء وستتفوق بسهولة',
        color: 'from-teal-600 to-cyan-600',
        textColor: 'text-teal-600',
        bgColor: 'bg-teal-50 border-teal-200'
      };
    } else if (percentage >= 50) {
      return {
        badge: '💡 مقبول، تحتاج مراجعة',
        sub: 'لقد اجتزت الاختبار ولكن تحتاج لإعادة حل الأسئلة التي تعثرت بها',
        color: 'from-orange-500 to-amber-600',
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-50 border-orange-200'
      };
    } else {
      return {
        badge: '⚠️ يحتاج إلى تدريب مكثف',
        sub: 'لا تقلق! هذا نموذج تدريبي، أعد المحاولة واستفد من التفسير النموذجي لكل سؤال',
        color: 'from-rose-500 to-red-600',
        textColor: 'text-rose-500',
        bgColor: 'bg-rose-50 border-rose-200'
      };
    }
  };

  const assessment = getScoreAssessment();

  // Filter questions for review
  const filteredQuestions = questions.filter((q) => {
    const selected = result.selectedAnswers[q.id];
    const isCorrect = selected === q.correctAnswerIndex;
    if (filterMode === 'mistakes') return !isCorrect;
    if (filterMode === 'correct') return isCorrect;
    return true;
  });

  const handleShare = () => {
    const shareText = `حققت ${toEnDigits(percentage)}% في ${exam.title} (${result.subjectName || ''}) على منصة اختبارات اليمن! 🇾🇪✨`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Score Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm mx-auto mb-4">
          <Trophy className={`w-10 h-10 ${assessment.textColor}`} />
        </div>

        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black mb-3 border bg-slate-100 text-slate-800">
          {exam.title} • {exam.academicYear}
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {toEnDigits(percentage)}%
        </h1>

        <div className={`mt-3 inline-block px-5 py-2 rounded-2xl font-black text-sm border ${assessment.bgColor} ${assessment.textColor}`}>
          {assessment.badge}
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
          {assessment.sub}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-6">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي الأسئلة</span>
            <span className="text-xl font-black text-slate-800">{toEnDigits(totalCount)}</span>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-center">
            <span className="text-[11px] font-bold text-emerald-600 block mb-1">الإجابات الصحيحة</span>
            <span className="text-xl font-black text-emerald-700">{toEnDigits(correctCount)}</span>
          </div>
          <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 text-center">
            <span className="text-[11px] font-bold text-rose-500 block mb-1">الإجابات الخاطئة</span>
            <span className="text-xl font-black text-rose-700">{toEnDigits(wrongCount)}</span>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 text-center">
            <span className="text-[11px] font-bold text-blue-600 block mb-1">الوقت المستغرق</span>
            <span className="text-lg font-black text-blue-700">
              {formatTimer(result.durationSeconds || 0)}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-100">
          {wrongCount > 0 && (
            <button
              onClick={() => onRetakeMistakes(wrongQuestions)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Target className="w-5 h-5" />
              <span>إعادة حل الأسئلة الخاطئة فقط ({toEnDigits(wrongCount)})</span>
            </button>
          )}

          <button
            onClick={onRetakeFull}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة الاختبار كاملاً</span>
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center gap-2"
            title="مشاركة النتيجة"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة النتيجة</span>
          </button>

          <button
            onClick={onBackToList}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>قائمة النماذج</span>
          </button>

          <button
            onClick={onGoHome}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>

        {showShareToast && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg animate-fade-in">
            تم نسخ نص النتيجة للمشاركة بنجاح!
          </div>
        )}
      </div>

      {/* Review Section Header & Filters */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">مراجعة الأسئلة والإجابات النموذجية</h2>
            <p className="text-xs text-slate-400">تصفح حلولك وقارنها بالإجابة الوزارية المعتمدة والتفسير</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الكل ({toEnDigits(totalCount)})
          </button>
          <button
            onClick={() => setFilterMode('mistakes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'mistakes'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            الأخطاء ({toEnDigits(wrongCount)})
          </button>
          <button
            onClick={() => setFilterMode('correct')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'correct'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            الصحيحة ({toEnDigits(correctCount)})
          </button>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">لا توجد أسئلة تحت هذا الفلتر</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const originalIndex = questions.findIndex((orig) => orig.id === q.id);
            const userSelectedIndex = result.selectedAnswers[q.id];
            const isCorrect = userSelectedIndex === q.correctAnswerIndex;
            const isSkipped = userSelectedIndex === undefined;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-3xl p-5 md:p-6 border transition-all ${
                  isCorrect
                    ? 'border-emerald-200/80 shadow-sm'
                    : isSkipped
                    ? 'border-amber-200/80 shadow-sm'
                    : 'border-rose-200/80 shadow-sm'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isSkipped
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {toEnDigits(originalIndex + 1)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {isCorrect ? 'إجابة صحيحة' : isSkipped ? 'تم تخطيه' : 'إجابة خاطئة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenReportModal && (
                      <button
                        onClick={() => onOpenReportModal(q, originalIndex + 1)}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="إضافة ملاحظة أو اعتراض على هذا السؤال"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ملاحظة</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-slate-800 font-bold text-sm md:text-base leading-relaxed mb-4">
                  <MathRenderer text={q.text} />
                </div>

                {/* Question Image if any */}
                {q.questionImageUrl && (
                  <div className="mb-4 max-w-sm rounded-2xl overflow-hidden border border-slate-200">
                    <img
                      src={q.questionImageUrl}
                      alt="Question attachment"
                      className="w-full object-contain max-h-64 bg-slate-50"
                    />
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isOptionCorrect = optIdx === q.correctAnswerIndex;
                    const isOptionSelected = userSelectedIndex === optIdx;

                    let optionStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    let badge = null;

                    if (isOptionCorrect) {
                      optionStyle = 'bg-emerald-50/90 border-emerald-400 text-emerald-900 font-bold';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" /> الإجابة المعتمدة
                        </span>
                      );
                    } else if (isOptionSelected) {
                      optionStyle = 'bg-rose-50/90 border-rose-400 text-rose-900 font-bold';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" /> إجابتك الخاطئة
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs md:text-sm ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white/70 border border-current flex items-center justify-center font-bold text-xs shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>
                            <MathRenderer text={opt} />
                          </span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Model Answer Explanation if available */}
                {q.explanation && q.explanation.trim() !== '' && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 text-xs md:text-sm">
                    <div className="flex items-center gap-2 font-black text-amber-800 mb-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span>💡 التفسير والشرح النموذجي:</span>
                    </div>
                    <div className="leading-relaxed">
                      <MathRenderer text={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Re-test Mistakes Action Bar */}
      {wrongCount > 0 && (
        <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-xl flex items-center justify-between gap-3 border border-slate-800">
          <div>
            <span className="text-xs font-black block">لديك {toEnDigits(wrongCount)} أسئلة خاطئة</span>
            <span className="text-[11px] text-slate-400">تدرب عليها الآن لتثبيت المعلومة وحصد العلامة الكاملة</span>
          </div>
          <button
            onClick={() => onRetakeMistakes(wrongQuestions)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs flex items-center gap-2 shrink-0 transition-transform active:scale-95"
          >
            <Target className="w-4 h-4" />
            <span>حل الأخطاء الآن</span>
          </button>
        </div>
      )}
    </div>
  );
};
