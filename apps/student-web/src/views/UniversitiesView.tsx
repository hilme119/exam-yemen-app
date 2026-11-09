import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Building2,
  BookOpen,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Sparkles,
  PlayCircle,
  FileText
} from 'lucide-react';
import { ExamModel } from '../types';
import { db, collection, getDocs, query, where } from '../services/firebase';
import { toEnDigits } from '../utils/numberFormatter';

interface UniversityItem {
  id: string;
  name: string;
  location?: string;
  logoUrl?: string;
}

interface MajorItem {
  id: string;
  universityId: string;
  name: string;
}

interface AdmissionSubjectItem {
  id: string;
  majorId: string;
  name: string;
}

interface AdmissionExamItem {
  id: string;
  subjectId: string;
  title: string;
  academicYear: string;
  isPdf?: boolean;
  pdfUrl?: string;
  questionsCount?: number;
  durationMinutes?: number;
}

interface UniversitiesViewProps {
  onStartExam: (exam: ExamModel) => void;
  onGoHome: () => void;
}

export const UniversitiesView: React.FC<UniversitiesViewProps> = ({
  onStartExam,
  onGoHome,
}) => {
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [selectedUni, setSelectedUni] = useState<UniversityItem | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<MajorItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<AdmissionSubjectItem | null>(null);

  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [subjects, setSubjects] = useState<AdmissionSubjectItem[]>([]);
  const [exams, setExams] = useState<AdmissionExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load: Universities
  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'universities'));
      const list: UniversityItem[] = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as UniversityItem)
      );
      setUniversities(list);
    } catch (err) {
      console.error('Error fetching universities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUni = async (uni: UniversityItem) => {
    setSelectedUni(uni);
    setLevel(1);
    setSearchQuery('');
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'admission_majors'), where('universityId', '==', uni.id))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MajorItem));
      setMajors(list);
    } catch (err) {
      console.error('Error fetching majors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMajor = async (major: MajorItem) => {
    setSelectedMajor(major);
    setLevel(2);
    setSearchQuery('');
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'admission_subjects'), where('majorId', '==', major.id))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdmissionSubjectItem));
      setSubjects(list);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = async (sub: AdmissionSubjectItem) => {
    setSelectedSubject(sub);
    setLevel(3);
    setSearchQuery('');
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'admission_exams'), where('subjectId', '==', sub.id))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdmissionExamItem));
      setExams(list);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdmissionExam = (admExam: AdmissionExamItem) => {
    const examModel: ExamModel = {
      id: admExam.id,
      subjectId: admExam.subjectId,
      title: `${selectedUni?.name || ''} - ${selectedMajor?.name || ''}: ${admExam.title}`,
      academicYear: admExam.academicYear,
      isPdf: admExam.isPdf || false,
      pdfUrl: admExam.pdfUrl,
      questionsCount: admExam.questionsCount || 40,
      durationMinutes: admExam.durationMinutes || 60,
      subjectName: selectedSubject?.name,
    };

    if (admExam.isPdf && admExam.pdfUrl) {
      window.open(admExam.pdfUrl, '_blank');
    } else {
      onStartExam(examModel);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-2">
            بوابة القبول والتسجيل الجامعي 🎓
          </span>
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            نماذج اختبارات المفاضلة والقبول للجامعات اليمنية
          </h1>
          <p className="text-xs md:text-sm text-sky-100 leading-relaxed">
            تدرب على أسئلة اختبارات القبول لكليات الطب والهندسة والحاسوب بجامعات صنعاء وعدن وتعز وإب وبقية الجامعات الحكومية والخاصة.
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setLevel(0)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              level === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>الجامعات</span>
          </button>

          {level >= 1 && selectedUni && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <button
                onClick={() => setLevel(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  level === 1 ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{selectedUni.name}</span>
              </button>
            </>
          )}

          {level >= 2 && selectedMajor && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <button
                onClick={() => setLevel(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  level === 2 ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{selectedMajor.name}</span>
              </button>
            </>
          )}

          {level >= 3 && selectedSubject && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700">
                {selectedSubject.name}
              </span>
            </>
          )}
        </div>

        {level > 0 && (
          <button
            onClick={() => setLevel((prev) => (prev - 1) as any)}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 shrink-0"
          >
            <span>رجوع خطوة</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري تحميل البيانات الأكاديمية...</span>
        </div>
      ) : level === 0 ? (
        /* Universities Grid */
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">اختر الجامعة:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universities.map((uni) => (
              <div
                key={uni.id}
                onClick={() => handleSelectUni(uni)}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {uni.name}
                  </h3>
                  {uni.location && (
                    <span className="text-xs text-slate-400 font-medium">{uni.location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : level === 1 ? (
        /* Majors Grid */
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">
            كليات وتخصصات {selectedUni?.name}:
          </h2>
          {majors.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-xs text-slate-400">لم يتم إدراج تخصصات لهذه الجامعة بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {majors.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMajor(m)}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                      {m.name}
                    </span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : level === 2 ? (
        /* Subjects Grid */
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">
            مواد اختبار القبول في {selectedMajor?.name}:
          </h2>
          {subjects.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-xs text-slate-400">لا توجد مواد مضافة لهذا التخصص حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub)}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                    {sub.name}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Exams Grid */
        <div>
          <h2 className="text-base font-black text-slate-900 mb-4">
            نماذج اختبار {selectedSubject?.name}:
          </h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-xs text-slate-400">لا توجد نماذج مضافة لهذه المادة بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 font-black text-[11px] mb-3 inline-block">
                      {ex.academicYear}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mb-2">{ex.title}</h3>
                  </div>

                  <button
                    onClick={() => handleStartAdmissionExam(ex)}
                    className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {ex.isPdf ? (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>فتح ملف الـ PDF</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        <span>بدء اختبار المفاضلة المؤتمت</span>
                      </>
                    )}
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
