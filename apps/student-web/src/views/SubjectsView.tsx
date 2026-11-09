import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  FileText
} from 'lucide-react';
import { SubjectModel, ExamModel } from '../types';
import { db, collection, getDocs, query, where } from '../services/firebase';
import { formatNumber } from '../utils/numberFormatter';
import { normalizeGrade, normalizeStream, getGradeDisplayName, getStreamDisplayName } from '../utils/formatters';

interface SubjectsViewProps {
  selectedGrade: string;
  selectedStream: string;
  onSelectSubject: (subject: SubjectModel) => void;
  onBack: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  selectedGrade,
  selectedStream,
  onSelectSubject,
  onBack
}) => {
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [examsCountMap, setExamsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSubjectsAndExams = async () => {
      setLoading(true);
      try {
        // 1. Fetch Subjects
        const snap = await getDocs(collection(db, 'subjects'));
        const allSubjects: SubjectModel[] = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as SubjectModel)
        );

        // Filter by grade and stream accurately
        const normSelectedGrade = normalizeGrade(selectedGrade);
        const normSelectedStream = normalizeStream(selectedStream);

        const filtered = allSubjects.filter((s) => {
          const normSubjectGrade = normalizeGrade(s.grade);
          const gradeMatches = s.grade === selectedGrade || (normSubjectGrade && normSubjectGrade === normSelectedGrade);
          if (!gradeMatches) return false;

          if (normSelectedStream && normSelectedStream !== 'general') {
            const normSubStream = normalizeStream(s.stream);
            if (normSubStream && normSubStream !== 'general' && normSubStream !== 'عام') {
              if (normSubStream !== normSelectedStream) return false;
            }
          }
          return true;
        });

        // 2. Fetch Exams to compute counts per subject
        const examsSnap = await getDocs(collection(db, 'exams'));
        const counts: Record<string, number> = {};
        examsSnap.docs.forEach((doc) => {
          const data = doc.data() as ExamModel;
          if (data.subjectId) {
            counts[data.subjectId] = (counts[data.subjectId] || 0) + 1;
          }
        });

        setSubjects(filtered);
        setExamsCountMap(counts);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsAndExams();
  }, [selectedGrade, selectedStream]);

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const gradeName =
    normalizeGrade(selectedGrade) === 'grade9'
      ? 'الصف التاسع الأساسي'
      : normalizeGrade(selectedGrade) === 'grade12_english'
      ? `ثالث ثانوي قسم إنجليزي (${getStreamDisplayName(selectedStream)})`
      : `الثالث الثانوي (${getStreamDisplayName(selectedStream)})`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              المناهج والامتحانات المؤتمتة
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            اختر المادة الدراسية لعرض نماذج الاختبارات الوزارية لـ ({gradeName})
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن مادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">جاري تحميل المواد الدراسية...</span>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">لا توجد مواد مطابقة للبحث</h3>
          <p className="text-xs text-slate-500 mt-1">جرّب البحث باسم آخر أو تأكد من اختيار المرحلة الصحيحة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSubjects.map((sub) => {
            const count = examsCountMap[sub.id] || 0;
            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubject(sub)}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-500 hover:shadow-floating transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
                      {formatNumber(count)} نموذج
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    امتحانات وزارية لجميع الأعوام • محدث لحظياً
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>فتح النماذج</span>
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

