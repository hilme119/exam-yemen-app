import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  BookOpen,
  X,
  ExternalLink,
  Layers,
  GraduationCap
} from 'lucide-react';
import { ExamModel, SubjectModel, LearningMaterialModel, GradeModel, AcademicYearModel } from '../types';
import { db, collection, getDocs } from '../services/firebase';
import { toEnDigits } from '../utils/numberFormatter';

interface LibraryViewProps {
  onGoHome: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onGoHome }) => {
  const [tab, setTab] = useState<'exams' | 'summaries'>('exams');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [grades, setGrades] = useState<GradeModel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearModel[]>([]);
  const [pdfExams, setPdfExams] = useState<ExamModel[]>([]);
  const [summaries, setSummaries] = useState<LearningMaterialModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loading, setLoading] = useState(true);

  // PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Grades from database
      const gradesSnap = await getDocs(collection(db, 'grades'));
      let gradesList: GradeModel[] = gradesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as GradeModel)
      );
      if (gradesList.length === 0) {
        gradesList = [
          { id: 'grade9', name: 'الصف التاسع الأساسي', order: 1 },
          { id: 'grade12', name: 'الثالث الثانوي', order: 2, hasStreams: true, streams: ['علمي', 'أدبي'] },
        ];
      } else {
        gradesList.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      setGrades(gradesList);

      // 2. Fetch Academic Years from database
      const yearsSnap = await getDocs(collection(db, 'academic_years'));
      const yearsList: AcademicYearModel[] = yearsSnap.docs.map((d) => ({
        id: d.id,
        yearLabel: d.data().yearLabel || d.data().year || '',
        ...d.data(),
      } as AcademicYearModel));
      setAcademicYears(yearsList);

      // 3. Fetch Subjects
      const subjSnap = await getDocs(collection(db, 'subjects'));
      const subjList: SubjectModel[] = subjSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubjectModel));
      setSubjects(subjList);

      const subjMap = new Map(subjList.map(s => [s.id, s.name]));

      // 4. Fetch PDF Exams
      const examSnap = await getDocs(collection(db, 'exams'));
      const examList: ExamModel[] = [];
      examSnap.docs.forEach(d => {
        const data = d.data();
        if (data.isPdf) {
          examList.push({
            id: d.id,
            subjectId: data.subjectId || '',
            title: data.title || '',
            academicYear: data.academicYear || '',
            isPdf: true,
            pdfUrl: data.pdfUrl || '',
            subjectName: subjMap.get(data.subjectId) || data.subjectName || '',
            questionsCount: data.questionsCount || 50,
          });
        }
      });
      setPdfExams(examList);

      // 5. Fetch Learning Materials / Summaries
      let matList: LearningMaterialModel[] = [];
      try {
        const matSnap = await getDocs(collection(db, 'learning_materials'));
        matList = matSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            pdfUrl: data.url || data.fileUrl || data.pdfUrl || '',
            title: data.title || '',
            subjectId: data.subjectId || '',
            description: data.description || '',
          } as LearningMaterialModel;
        });
      } catch (err) {
        console.warn('learning_materials fetch warning', err);
      }

      // Fallback check on 'materials' collection
      if (matList.length === 0) {
        try {
          const fallbackSnap = await getDocs(collection(db, 'materials'));
          matList = fallbackSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              pdfUrl: data.pdfUrl || data.url || data.fileUrl || '',
              title: data.title || '',
              subjectId: data.subjectId || '',
              description: data.description || '',
            } as LearningMaterialModel;
          });
        } catch (e) {
          console.warn('materials fallback fetch warning', e);
        }
      }

      setSummaries(matList);
    } catch (err) {
      console.error('Error loading library data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct Years directly from Firestore 'academic_years' collection + PDF exams
  const uniqueYears = useMemo(() => {
    const s = new Set<string>();
    academicYears.forEach(y => {
      if (y.yearLabel && y.yearLabel.trim()) s.add(y.yearLabel.trim());
    });
    pdfExams.forEach(e => {
      if (e.academicYear && e.academicYear.trim()) s.add(e.academicYear.trim());
    });
    summaries.forEach(m => {
      if (m.academicYear && m.academicYear.trim()) s.add(m.academicYear.trim());
    });
    return Array.from(s).sort().reverse();
  }, [academicYears, pdfExams, summaries]);

  // Filtered PDF exams
  const filteredExams = useMemo(() => {
    return pdfExams.filter(e => {
      const matchSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.subjectName && e.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchYear = yearFilter === 'all' || e.academicYear === yearFilter;
      
      // match dynamic grade if subject found
      let matchGrade = true;
      if (gradeFilter !== 'all') {
        const s = subjects.find(sub => sub.id === e.subjectId);
        if (s) {
          if (gradeFilter.includes('_')) {
            const [gId, str] = gradeFilter.split('_');
            if (s.grade !== gId) matchGrade = false;
            if (s.stream && s.stream !== str && !s.stream.includes(str)) matchGrade = false;
          } else {
            if (s.grade !== gradeFilter) matchGrade = false;
          }
        }
      }

      return matchSearch && matchYear && matchGrade;
    });
  }, [pdfExams, searchQuery, yearFilter, gradeFilter, subjects]);

  // Filtered Summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter(m => {
      const matchSearch = !searchQuery || 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchYear = yearFilter === 'all' || !m.academicYear || m.academicYear === yearFilter;

      let matchGrade = true;
      if (gradeFilter !== 'all') {
        if (m.gradeId) {
          if (gradeFilter.includes('_')) {
            const [gId] = gradeFilter.split('_');
            matchGrade = m.gradeId === gId;
          } else {
            matchGrade = m.gradeId === gradeFilter;
          }
        } else if (m.grade) {
          const targetObj = grades.find(g => g.id === gradeFilter || gradeFilter.startsWith(g.id));
          if (targetObj) {
            matchGrade = m.grade.includes(targetObj.name) || targetObj.name.includes(m.grade);
          }
        }
      }

      return matchSearch && matchYear && matchGrade;
    });
  }, [summaries, searchQuery, yearFilter, gradeFilter, grades]);

  const handleOpenPdf = (title: string, url?: string) => {
    if (!url) {
      alert('عذراً، لم يتم ربط رابط الملف بعد.');
      return;
    }
    setPreviewPdfTitle(title);
    setPreviewPdfUrl(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-2">
            المكتبة الرقمية الرسمية 📚
          </span>
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            نماذج الاختبارات الوزارية والملخصات المعتمدة
          </h1>
          <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
            تصفح وحمل جميع نماذج امتحانات الثانوية العامة والصف التاسع بصيغة PDF الرسمية لجميع المحافظات مع الملازم والشروحات المركزة.
          </p>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-soft border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Main Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setTab('exams')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              tab === 'exams'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>نماذج PDF الرسمية ({toEnDigits(pdfExams.length)})</span>
          </button>
          <button
            onClick={() => setTab('summaries')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              tab === 'summaries'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الملازم والملخصات ({toEnDigits(summaries.length)})</span>
          </button>
        </div>

        {/* Dynamic Grade Filter (Direct from database 'grades' collection) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setGradeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              gradeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الصفوف
          </button>
          {grades.map((g) => {
            if (g.hasStreams && g.streams && g.streams.length > 0) {
              return g.streams.map((str) => {
                const filterKey = `${g.id}_${str}`;
                const isSelected = gradeFilter === filterKey;
                return (
                  <button
                    key={filterKey}
                    onClick={() => setGradeFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {g.name} ({str})
                  </button>
                );
              });
            }
            const isSelected = gradeFilter === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setGradeFilter(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub Filter: Search & Academic Years (Directly from Firestore 'academic_years') */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم النموذج أو المادة..."
            className="w-full pl-3 pr-10 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {uniqueYears.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span>الأعوام:</span>
            </span>
            <button
              onClick={() => setYearFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                yearFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              جميع الأعوام
            </button>
            {uniqueYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  yearFilter === yr
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري تحميل النماذج والملخصات من قاعدة البيانات...</span>
        </div>
      ) : tab === 'exams' ? (
        filteredExams.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft max-w-md mx-auto my-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800">لا توجد نماذج PDF مطابقة</h3>
            <p className="text-xs text-slate-400 mt-1">جرب تغيير معايير البحث أو اختيار عام دراسي أو صف آخر</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-black text-[11px] border border-blue-100">
                      {ex.academicYear || 'نموذج وزاري'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {ex.subjectName}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                    {ex.title}
                  </h3>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenPdf(ex.title, ex.pdfUrl)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>معاينة وقراءة</span>
                  </button>

                  {ex.pdfUrl && (
                    <a
                      href={ex.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="تحميل مباشر"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Summaries tab */
        filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft max-w-md mx-auto my-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800">لا توجد ملخصات مطابقة</h3>
            <p className="text-xs text-slate-400 mt-1">يتم رفع وتدقيق الملازم من قبل نخبة المعلمين في لوحة التحكم باستمرار</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSummaries.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    {mat.academicYear && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-black text-[11px]">
                        {mat.academicYear}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">{mat.title}</h3>
                  {mat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {mat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPdf(mat.title, mat.pdfUrl)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>تصفح الملزمة</span>
                  </button>
                  {mat.pdfUrl && (
                    <a
                      href={mat.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="تحميل"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* PDF Embedded Viewer Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-4 md:p-6 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl flex-1 flex flex-col overflow-hidden border border-slate-800 shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black truncate max-w-md">{previewPdfTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في نافذة جديدة</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Iframe Viewer */}
            <div className="flex-1 bg-slate-800">
              <iframe
                src={previewPdfUrl}
                title={previewPdfTitle}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};