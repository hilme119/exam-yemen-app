import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Zap,
  Clock,
  Award,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  PlayCircle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ExamModel, StudentUser } from '../types';
import { db, collection, getDocs, query, where } from '../services/firebase';
import { toEnDigits } from '../utils/numberFormatter';

interface CompetitionSemesterItem {
  id: string;
  name: string;
}

interface CompetitionSubjectItem {
  id: string;
  semesterId: string;
  name: string;
}

interface CompetitionExamItem {
  id: string;
  subjectId: string;
  semesterId: string;
  title: string;
  pointsAwarded: number;
  durationMinutes: number;
  questionsCount?: number;
}

interface CompetitionsViewProps {
  currentUser: StudentUser | null;
  onStartExam: (exam: ExamModel) => void;
  onGoHome: () => void;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  currentUser,
  onStartExam,
  onGoHome,
}) => {
  const [level, setLevel] = useState<0 | 1 | 2>(0);
  const [selectedSemester, setSelectedSemester] = useState<CompetitionSemesterItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CompetitionSubjectItem | null>(null);

  const [semesters, setSemesters] = useState<CompetitionSemesterItem[]>([]);
  const [subjects, setSubjects] = useState<CompetitionSubjectItem[]>([]);
  const [exams, setExams] = useState<CompetitionExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'competition_semesters'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompetitionSemesterItem));
      setSemesters(list);
    } catch (err) {
      console.error('Error fetching competition semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSemester = async (sem: CompetitionSemesterItem) => {
    setSelectedSemester(sem);
    setLevel(1);
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'competition_subjects'), where('semesterId', '==', sem.id))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompetitionSubjectItem));
      setSubjects(list);
    } catch (err) {
      console.error('Error fetching competition subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = async (sub: CompetitionSubjectItem) => {
    setSelectedSubject(sub);
    setLevel(2);
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'competition_exams'), where('subjectId', '==', sub.id))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompetitionExamItem));
      setExams(list);
    } catch (err) {
      console.error('Error fetching competition exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCompExam = (cExam: CompetitionExamItem) => {
    const examModel: ExamModel = {
      id: cExam.id,
      subjectId: cExam.subjectId,
      title: `المسابقة - ${cExam.title}`,
      academicYear: '2024-2025',
      isPdf: false,
      questionsCount: cExam.questionsCount || 30,
      durationMinutes: cExam.durationMinutes || 30,
      subjectName: selectedSubject?.name,
    };
    onStartExam(examModel);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-200" />
            <span>المسابقات والتحديات 🏆</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            مسابقات وتحديات الاختبارات الموقوتة
          </h1>
          <p className="text-xs md:text-sm text-amber-100 leading-relaxed">
            شارك في التحديات والمسابقات العلمية الموقوتة واكسب نقاط التميز للارتقاء في لوحة الشرف.
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setLevel(0)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              level === 0 ? 'bg-amber-50 text-amber-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>مراحل المسابقة</span>
          </button>

          {level >= 1 && selectedSemester && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <button
                onClick={() => setLevel(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  level === 1 ? 'bg-amber-50 text-amber-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{selectedSemester.name}</span>
              </button>
            </>
          )}

          {level >= 2 && selectedSubject && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800">
                {selectedSubject.name}
              </span>
            </>
          )}
        </div>

        {level > 0 && (
          <button
            onClick={() => setLevel((prev) => (prev - 1) as any)}
            className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 shrink-0"
          >
            <span>رجوع خطوة</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري تحميل جولات المسابقات...</span>
        </div>
      ) : level === 0 ? (
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">اختر مرحلة أو فصل التحدي:</h2>
          {semesters.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-xs text-slate-400">لا توجد مراحل مسابقة مضافة حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesters.map((sem) => (
                <div
                  key={sem.id}
                  onClick={() => handleSelectSemester(sem)}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                      {sem.name}
                    </h3>
                    <span className="text-xs text-slate-400">انقر لاستعراض مواد التحدي</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : level === 1 ? (
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">
            مواد تحدي {selectedSemester?.name}:
          </h2>
          {subjects.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-xs text-slate-400">لا توجد مواد مسابقة لهذا الفصل بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub)}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                    {sub.name}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:-translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">
            اختبارات وتحديات {selectedSubject?.name}:
          </h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-xs text-slate-400">لا توجد اختبارات مسابقة مضافة لهذه المادة بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 font-black text-xs flex items-center gap-1 border border-amber-200">
                        <Zap className="w-3.5 h-3.5" />
                        <span>+{toEnDigits(ex.pointsAwarded || 250)} نقطة</span>
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{toEnDigits(ex.durationMinutes || 30)} دقيقة</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 mb-2">{ex.title}</h3>
                  </div>

                  <button
                    onClick={() => handleStartCompExam(ex)}
                    className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>خوض التحدي الآن</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
