import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  X,
  Send,
  Flag,
  RotateCcw
} from 'lucide-react';
import { ExamModel, QuestionModel, ResultModel, StudentUser } from '../types';
import { db, collection, getDocs, doc, setDoc, Timestamp } from '../services/firebase';
import { MathRenderer } from '../components/MathRenderer';
import { toEnDigits, formatTimer } from '../utils/numberFormatter';

interface ExamPlayerViewProps {
  exam: ExamModel;
  customQuestions?: QuestionModel[];
  customTitle?: string;
  currentUser: StudentUser | null;
  onFinishExam: (result: ResultModel, questions: QuestionModel[]) => void;
  onExit: () => void;
}

export const ExamPlayerView: React.FC<ExamPlayerViewProps> = ({
  exam,
  customQuestions,
  customTitle,
  currentUser,
  onFinishExam,
  onExit,
}) => {
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Timer: default 45 mins or exam.durationMinutes
  const totalDuration = (exam.durationMinutes || 45) * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalDuration);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const loadQuestions = async () => {
      if (customQuestions && customQuestions.length > 0) {
        setQuestions(customQuestions);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'exams', exam.id, 'questions'));
        let list: QuestionModel[] = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as QuestionModel)
        );

        // Sort questions naturally by numeric ID
        list.sort((a, b) => {
          const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          if (numA !== 0 && numB !== 0) return numA - numB;
          return a.id.localeCompare(b.id);
        });

        setQuestions(list);
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [exam.id, customQuestions]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, remainingSeconds]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelectOption = (optIndex: number) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex,
    }));
  };

  const handleToggleCheck = () => {
    if (!currentQuestion) return;
    setCheckedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleForceSubmit = () => {
    calculateAndSaveResult();
  };

  const handleSubmitClick = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < totalQuestions) {
      setShowIncompleteModal(true);
    } else {
      calculateAndSaveResult();
    }
  };

  const calculateAndSaveResult = async () => {
    setSubmitting(true);
    try {
      let correctScore = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctAnswerIndex) {
          correctScore += 1;
        }
      });

      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const resultId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const percentage = totalQuestions > 0 ? (correctScore / totalQuestions) * 100 : 0;

      const resultData: ResultModel = {
        id: resultId,
        userId: currentUser?.id || 'guest',
        examId: exam.id,
        score: correctScore,
        totalQuestions,
        percentage,
        dateTaken: new Date(),
        selectedAnswers,
        subjectName: exam.subjectName || 'مادة وزارية',
        examName: customTitle || exam.title,
        durationSeconds: elapsedSeconds,
      };

      // Save to Firestore if user logged in
      if (currentUser?.id && !currentUser.isGuest) {
        await setDoc(doc(db, 'results', resultId), {
          ...resultData,
          dateTaken: Timestamp.now(),
        });
      }

      onFinishExam(resultData, questions);
    } catch (err) {
      console.error('Error saving result:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-700">جاري إعداد نموذج الاختبار والأسئلة...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-soft">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-black text-slate-900">لا توجد أسئلة مسجلة</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">لم يتم العثور على أسئلة لهذا النموذج حالياً.</p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          العودة للنماذج
        </button>
      </div>
    );
  }

  const selectedOpt = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isChecked = currentQuestion ? !!checkedMap[currentQuestion.id] : false;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Player Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Exit Button */}
          <button
            onClick={() => setShowExitModal(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">مغادرة الاختبار</span>
          </button>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-md">
              {customTitle || exam.title}
            </h2>
            <span className="text-[11px] text-slate-500">
              السؤال رقم {toEnDigits(currentIndex + 1)} من {toEnDigits(totalQuestions)}
            </span>
          </div>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              remainingSeconds < 180
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono tracking-wider">{formatTimer(remainingSeconds)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-soft space-y-6">
          {/* Question Text & Number Badge */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-xs">
                السؤال {toEnDigits(currentIndex + 1)}
              </span>

              {/* Check Answer Button */}
              {selectedOpt !== undefined && (
                <button
                  onClick={handleToggleCheck}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isChecked ? 'إخفاء الشرح' : 'تحقق من الإجابة'}</span>
                </button>
              )}
            </div>

            <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              <MathRenderer content={currentQuestion.text} />
            </div>

            {/* Question Image if exists */}
            {currentQuestion.questionImageUrl && (
              <div className="pt-2">
                <img
                  src={currentQuestion.questionImageUrl}
                  alt="توضيح السؤال"
                  onClick={() => setPreviewImage(currentQuestion.questionImageUrl!)}
                  className="max-h-64 rounded-2xl border border-slate-200 cursor-zoom-in hover:opacity-95 transition-opacity object-contain bg-slate-50"
                />
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = selectedOpt === optIdx;
              const isCorrect = optIdx === currentQuestion.correctAnswerIndex;

              let optionStyle = 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-slate-50';

              if (isChecked) {
                if (isCorrect) {
                  optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs';
                } else if (isSelected) {
                  optionStyle = 'bg-red-50 border-red-400 text-red-800 font-bold shadow-xs';
                }
              } else if (isSelected) {
                optionStyle = 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs';
              }

              const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${optionStyle}`}
                >
                  {/* Option Badge Circle */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition-colors ${
                      isChecked && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : isChecked && isSelected
                        ? 'bg-red-600 text-white'
                        : isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {optionLetter}
                  </div>

                  <div className="flex-1 text-sm sm:text-base">
                    <MathRenderer content={optionText} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation Box (when checked) */}
          {isChecked && (
            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-xs text-amber-800">
                <span>💡 التفسير والشرح النموذجي:</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-950 font-medium">
                {currentQuestion.explanation || currentQuestion.hint || 'الإجابة الصحيحة هي الخيار المحدد باللون الأخضر أعلاه والمطابق لمنهج الكتاب المدرسي الوزاري.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Previous Question Button */}
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex((i) => i - 1);
            }}
            disabled={currentIndex === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {/* Middle: Jump Palette or status */}
          <span className="text-xs font-semibold text-slate-500">
            أجبت على {toEnDigits(Object.keys(selectedAnswers).length)} من {toEnDigits(totalQuestions)}
          </span>

          {/* Next or Submit Button */}
          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmitClick}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'جاري التسليم...' : 'تسليم الإجابات'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentIndex < totalQuestions - 1) setCurrentIndex((i) => i + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">مغادرة الاختبار؟</h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              هل أنت متأكد من الخروج الآن؟ سيتم إلغاء الجلسة ولن تُحفظ إجاباتك كاختبار مكتمل.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                متابعة الاختبار
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Questions Modal */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">تنبيه أسئلة غير مجابة</h3>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              تبقى لديك {toEnDigits(totalQuestions - Object.keys(selectedAnswers).length)} سؤال بدون إجابة. هل ترغب بالتسليم الآن أم مراجعتها أولاً؟
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                مراجعة الأسئلة
              </button>
              <button
                onClick={() => {
                  setShowIncompleteModal(false);
                  calculateAndSaveResult();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                تسليم على أي حال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={previewImage} alt="تكبير" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

