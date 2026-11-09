import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Target,
  Eye,
  Award,
  AlertCircle,
  Trash2,
  BookOpen
} from 'lucide-react';
import { ResultModel, StudentUser, QuestionModel, ExamModel } from '../types';
import { db, collection, query, where, getDocs, orderBy, doc, getDoc } from '../services/firebase';
import { toEnDigits, formatTimer } from '../utils/numberFormatter';

interface ResultsHistoryViewProps {
  currentUser: StudentUser | null;
  onReviewResult: (result: ResultModel, exam: ExamModel, questions: QuestionModel[]) => void;
  onRetakeMistakes: (wrongQuestions: QuestionModel[], exam: ExamModel) => void;
  onGoHome: () => void;
}

export const ResultsHistoryView: React.FC<ResultsHistoryViewProps> = ({
  currentUser,
  onReviewResult,
  onRetakeMistakes,
  onGoHome,
}) => {
  const [results, setResults] = useState<ResultModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'low'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [currentUser]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let loadedResults: ResultModel[] = [];

      // 1. Fetch from Firestore if logged in
      if (currentUser?.id && !currentUser.isGuest) {
        try {
          const q = query(
            collection(db, 'results'),
            where('userId', '==', currentUser.id)
          );
          const snap = await getDocs(q);
          loadedResults = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            dateTaken: d.data().dateTaken?.toDate ? d.data().dateTaken.toDate() : new Date(d.data().dateTaken || Date.now())
          })) as ResultModel[];
        } catch (err) {
          console.warn('Firestore fetch failed, falling back to local storage', err);
        }
      }

      // 2. Fetch from localStorage
      const local = localStorage.getItem('exam_yemen_student_results');
      if (local) {
        try {
          const parsed = JSON.parse(local) as ResultModel[];
          parsed.forEach((p) => {
            if (!loadedResults.some((r) => r.id === p.id)) {
              loadedResults.push({
                ...p,
                dateTaken: new Date(p.dateTaken)
              });
            }
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Sort newest first
      loadedResults.sort((a, b) => {
        const timeA = new Date(a.dateTaken).getTime();
        const timeB = new Date(b.dateTaken).getTime();
        return timeB - timeA;
      });

      setResults(loadedResults);
    } catch (err) {
      console.error('Error loading results history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (res: ResultModel, mode: 'review' | 'mistakes') => {
    setActionLoadingId(res.id);
    try {
      // 1. Fetch exam metadata
      let examDoc = await getDoc(doc(db, 'exams', res.examId));
      let examData: ExamModel;
      if (examDoc.exists()) {
        examData = { id: examDoc.id, ...examDoc.data() } as ExamModel;
      } else {
        examData = {
          id: res.examId,
          subjectId: 'unknown',
          title: res.examName || 'اختبار وزاري',
          academicYear: '2024-2025',
          isPdf: false,
          subjectName: res.subjectName || ''
        };
      }

      // 2. Fetch questions
      const qSnap = await getDocs(collection(db, 'exams', res.examId, 'questions'));
      let questionsList: QuestionModel[] = qSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as QuestionModel)
      );

      // Natural sort
      questionsList.sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        if (numA !== 0 && numB !== 0) return numA - numB;
        return a.id.localeCompare(b.id);
      });

      if (mode === 'review') {
        onReviewResult(res, examData, questionsList);
      } else {
        // filter mistakes
        const wrongQs = questionsList.filter((q) => {
          const selected = res.selectedAnswers[q.id];
          return selected === undefined || selected !== q.correctAnswerIndex;
        });
        if (wrongQs.length > 0) {
          onRetakeMistakes(wrongQs, examData);
        } else {
          alert('مبروك! ليس لديك أي أخطاء في هذا الاختبار (العلامة الكاملة)');
        }
      }
    } catch (err) {
      console.error('Error preparing result review:', err);
      alert('حدث خطأ أثناء تحميل تفاصيل النموذج، يرجى المحاولة لاحقاً');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredResults = results.filter((r) => {
    const pct = r.percentage ?? (r.score / Math.max(1, r.totalQuestions)) * 100;
    if (activeFilter === 'high') return pct >= 80;
    if (activeFilter === 'low') return pct < 60;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-soft border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">سجل نتائجي واختباراتي</h1>
            <p className="text-xs text-slate-400">تتبع تقدمك الدراسي، راجع إجاباتك السابقة وحل نقاط ضعفك</p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-stretch md:self-auto justify-center">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الكل ({toEnDigits(results.length)})
          </button>
          <button
            onClick={() => setActiveFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'high'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            المتفوقة (≥80%)
          </button>
          <button
            onClick={() => setActiveFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'low'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            تحتاج تركيز (&lt;60%)
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري استرجاع سجل الاختبارات...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">لا يوجد سجل اختبارات حتى الآن</h3>
          <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
            ابدأ بخوض أول اختبار وزاري مؤتمت وسيتم حفظ نتائجك وإحصائياتك هنا تلقائياً لتقييم مستواك.
          </p>
          <button
            onClick={onGoHome}
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            استعراض المواد والنماذج
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((res) => {
            const pct = Math.round(res.percentage ?? (res.score / Math.max(1, res.totalQuestions)) * 100);
            const wrongs = Math.max(0, res.totalQuestions - res.score);
            const dateStr = res.dateTaken instanceof Date
              ? res.dateTaken.toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'مؤخراً';

            const isSuccess = pct >= 60;
            const isLoadingThis = actionLoadingId === res.id;

            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-soft hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left side: details */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                      pct >= 85
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : pct >= 60
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className="text-base font-black leading-tight">{toEnDigits(pct)}%</span>
                    <span className="text-[10px] font-bold">
                      {pct >= 85 ? 'ممتاز' : pct >= 60 ? 'ناجح' : 'راسب'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm md:text-base font-black text-slate-900">
                      {res.examName || 'اختبار وزاري'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      {res.subjectName && (
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                          {res.subjectName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dateStr}</span>
                      </span>
                      {res.durationSeconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTimer(res.durationSeconds)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{toEnDigits(res.score)} صحيحة</span>
                      </span>
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{toEnDigits(wrongs)} خاطئة</span>
                      </span>
                      <span className="text-slate-400">
                        من {toEnDigits(res.totalQuestions)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {wrongs > 0 && (
                    <button
                      onClick={() => handleAction(res, 'mistakes')}
                      disabled={isLoadingThis}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs flex items-center gap-1.5 border border-amber-200 transition-colors"
                      title="إعادة حل الأسئلة التي تعثرت بها فقط"
                    >
                      <Target className="w-4 h-4 text-amber-600" />
                      <span>حل الأخطاء ({toEnDigits(wrongs)})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAction(res, 'review')}
                    disabled={isLoadingThis}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {isLoadingThis ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span>مراجعة الإجابات</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
