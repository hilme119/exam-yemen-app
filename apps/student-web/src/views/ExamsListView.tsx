import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ChevronLeft,
  Calendar,
  CheckCircle,
  Play,
  Download,
  Eye,
  Award,
  Sparkles
} from 'lucide-react';
import { SubjectModel, ExamModel, ResultModel, StudentUser } from '../types';
import { db, collection, getDocs, query, where } from '../services/firebase';
import { formatNumber, formatPercentage, toEnDigits } from '../utils/numberFormatter';

interface ExamsListViewProps {
  subject: SubjectModel;
  currentUser: StudentUser | null;
  onStartExam: (exam: ExamModel) => void;
  onBack: () => void;
}

export const ExamsListView: React.FC<ExamsListViewProps> = ({
  subject,
  currentUser,
  onStartExam,
  onBack
}) => {
  const [exams, setExams] = useState<ExamModel[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, ResultModel>>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'interactive' | 'pdf'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchExamsAndResults = async () => {
      setLoading(true);
      try {
        // 1. Fetch Exams for this subject
        const q = query(collection(db, 'exams'), where('subjectId', '==', subject.id));
        const snap = await getDocs(q);
        const list: ExamModel[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExamModel));
        setExams(list);

        // 2. Fetch User Results if logged in
        if (currentUser?.id) {
          const resQuery = query(collection(db, 'results'), where('userId', '==', currentUser.id));
          const resSnap = await getDocs(resQuery);
          const map: Record<string, ResultModel> = {};
          resSnap.docs.forEach((doc) => {
            const r = doc.data() as ResultModel;
            if (r.examId) {
              map[r.examId] = r;
            }
          });
          setResultsMap(map);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamsAndResults();
  }, [subject.id, currentUser?.id]);

  // Extract unique academic years
  const availableYears = Array.from(
    new Set(exams.map((e) => e.academicYear?.trim()).filter(Boolean))
  ).sort().reverse();

  // Filter exams
  const filteredExams = exams.filter((exam) => {
    // Search query
    if (searchQuery.trim() && !exam.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
      return false;
    }
    // Year filter
    if (selectedYear !== 'all' && exam.academicYear !== selectedYear) {
      return false;
    }
    // Type filter
    if (activeTab === 'interactive' && exam.isPdf) return false;
    if (activeTab === 'pdf' && !exam.isPdf) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  نماذج {subject.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  {formatNumber(filteredExams.length)} نموذج
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                الامتحانات الوزارية الصادرة لجميع المحافظات • متوافقة مع نظام التصحيح الإلكتروني
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في أسماء النماذج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Year Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedYear === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              جميع الأعوام
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedYear === yr
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {toEnDigits(yr)}
              </button>
            ))}
          </div>

          {/* Interactive vs PDF Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveTab('interactive')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'interactive' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              مؤتمت ذكي
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pdf' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              ملفات PDF
            </button>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">جاري تحميل نماذج الاختبارات...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">لا توجد نماذج لهذا العام المختار</h3>
          <p className="text-xs text-slate-500 mt-1">اختر "جميع الأعوام" لعرض كل النماذج المتاحة لهذه المادة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => {
            const pastResult = resultsMap[exam.id];
            const isDone = !!pastResult;
            const percentage = pastResult && pastResult.totalQuestions > 0
              ? (pastResult.score / pastResult.totalQuestions) * 100
              : 0;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-floating transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                          {exam.title || 'نموذج وزاري'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>العام: {toEnDigits(exam.academicYear)}</span>
                          </span>
                          {exam.questionsCount && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              • {formatNumber(exam.questionsCount)} سؤال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                        exam.isPdf
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      {exam.isPdf ? 'ملف PDF' : 'مؤتمت ذكي'}
                    </span>
                  </div>

                  {/* Solved previously banner */}
                  {isDone && (
                    <div className="mb-4 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>تم الحل سابقاً: {toEnDigits(pastResult.score)} / {toEnDigits(pastResult.totalQuestions)}</span>
                      </span>
                      <span className="font-black text-emerald-700">
                        {formatPercentage(percentage)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  {exam.isPdf ? (
                    exam.pdfUrl ? (
                      <a
                        href={exam.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض النموذج PDF</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">الملف غير متوفر</span>
                    )
                  ) : (
                    <button
                      onClick={() => onStartExam(exam)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isDone ? 'إعادة الاختبار' : 'بدء الاختبار الآن'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

