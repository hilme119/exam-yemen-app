import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Download, 
  Calendar, 
  BookOpen, 
  Sparkles, 
  Search, 
  Trash2, 
  Eye, 
  X,
  FileCheck2,
  Plus,
  Upload,
  LayoutGrid,
  Layers,
  Edit3,
  School,
  AlertCircle,
  Check
} from 'lucide-react';
import { Exam, Subject, AcademicYear, GradeItem } from '../types';
import { 
  formatEnNumber, 
  toEnDigits, 
  getGradeDisplayName, 
  getStreamDisplayName, 
  normalizeGrade, 
  normalizeStream 
} from '../utils/formatters';
import { uploadMediaFile } from '../services/uploadService';

interface PdfExamsViewProps {
  exams: Exam[];
  subjects: Subject[];
  years?: AcademicYear[];
  grades?: GradeItem[];
  onAddExam?: (exam: Exam) => Promise<void> | void;
  onDeleteExam: (id: string) => Promise<void>;
}

export const PdfExamsView: React.FC<PdfExamsViewProps> = ({
  exams,
  subjects,
  years = [],
  grades = [],
  onAddExam,
  onDeleteExam,
}) => {
  // View mode: 'subjects' (Grouped like automated exams) or 'explorer' (Direct Grid)
  const [viewMode, setViewMode] = useState<'subjects' | 'explorer'>('subjects');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('الكل');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState('all');

  // Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formGrade, setFormGrade] = useState('grade9');
  const [formYear, setFormYear] = useState('2025-2026');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formQuestionsCount, setFormQuestionsCount] = useState<number>(50);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState<string | null>(null);
  const [uploadedPdfFileSize, setUploadedPdfFileSize] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Filter only PDF exams
  const pdfExams = useMemo(() => exams.filter(e => e.isPdf), [exams]);

  // Unique years list
  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    // First: load all official academic years from database
    years.forEach(y => {
      const yr = y.yearLabel || (y as any).year;
      if (yr && yr.trim()) set.add(yr.trim());
    });
    // Second: include any years present in uploaded PDF exams
    pdfExams.forEach(e => {
      if (e.academicYear && e.academicYear.trim()) set.add(e.academicYear.trim());
    });
    if (set.size === 0) {
      set.add('2025-2026');
      set.add('2024-2025');
      set.add('2023-2024');
    }
    return ['الكل', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [pdfExams, years]);

  // Filtered list
  const filteredExams = useMemo(() => {
    return pdfExams.filter(e => {
      const matchesSearch = 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.academicYear && e.academicYear.includes(searchQuery));
      const matchesYear = selectedYearFilter === 'الكل' || e.academicYear === selectedYearFilter;
      
      let matchesGrade = true;
      let matchesStream = true;
      if (selectedGradeFilter !== 'all' || selectedStreamFilter !== 'all') {
        const sub = subjects.find(s => s.id === e.subjectId);
        if (selectedGradeFilter !== 'all') {
          const normActiveGrade = normalizeGrade(selectedGradeFilter);
          matchesGrade = sub ? (sub.grade === selectedGradeFilter || normalizeGrade(sub.grade) === normActiveGrade) : true;
        }
        if (selectedStreamFilter !== 'all') {
          matchesStream = sub ? normalizeStream(sub.stream) === normalizeStream(selectedStreamFilter) : true;
        }
      }

      return matchesSearch && matchesYear && matchesGrade && matchesStream;
    });
  }, [pdfExams, searchQuery, selectedYearFilter, selectedGradeFilter, selectedStreamFilter, subjects]);

  // Group by Academic Year -> Subject ID -> Exams
  const grouped: Record<string, Record<string, Exam[]>> = useMemo(() => {
    const map: Record<string, Record<string, Exam[]>> = {};
    for (const exam of filteredExams) {
      const year = exam.academicYear || 'عام غير محدد';
      const subId = exam.subjectId || 'مادة عامة';
      if (!map[year]) map[year] = {};
      if (!map[year][subId]) map[year][subId] = [];
      map[year][subId].push(exam);
    }
    return map;
  }, [filteredExams]);

  const getSubject = (subId: string): Subject | undefined => {
    return subjects.find(s => s.id === subId);
  };

  const getSubjectName = (subId: string) => {
    const found = getSubject(subId);
    return found ? found.name : subId;
  };

  // Open modal for new exam
  const handleOpenAddModal = (presetSubjectId?: string, presetYear?: string) => {
    const firstDbYear = years.length > 0 ? (years[0].yearLabel || (years[0] as any).year) : '2025-2026';
    setEditingExamId(null);
    setFormTitle('');
    setFormSubjectId(presetSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
    setFormYear(presetYear && presetYear !== 'الكل' ? presetYear : firstDbYear);
    setFormPdfUrl('');
    setFormQuestionsCount(50);
    setUploadedPdfFileName(null);
    setUploadedPdfFileSize(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing exam
  const handleOpenEditModal = (exam: Exam) => {
    const firstDbYear = years.length > 0 ? (years[0].yearLabel || (years[0] as any).year) : '2025-2026';
    setEditingExamId(exam.id);
    setFormTitle(exam.title);
    setFormSubjectId(exam.subjectId);
    setFormYear(exam.academicYear || firstDbYear);
    setFormPdfUrl(exam.pdfUrl || '');
    setFormQuestionsCount(exam.questionsCount || 50);
    setFormError('');
    setIsModalOpen(true);
  };

  // Upload PDF file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setFormError('يرجى اختيار ملف بصيغة PDF صالحة');
      return;
    }

    setIsUploadingPdf(true);
    setFormError('');
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedPdfFileSize(sizeMb + ' ميجابايت');
    setUploadedPdfFileName(file.name);

    try {
      const url = await uploadMediaFile(file, file.name);
      setFormPdfUrl(url);
      if (!formTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setFormTitle(cleanName);
      }
    } catch (err: any) {
      console.error('Error uploading PDF:', err);
      setFormError('فشل رفع ملف الـ PDF. يمكنك إدخال الرابط يدوياً.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Save Exam (Add or Edit)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('يرجى كتابة عنوان النموذج الوزاري');
      return;
    }
    if (!formSubjectId) {
      setFormError('يرجى اختيار المادة الدراسية');
      return;
    }
    if (!formPdfUrl.trim()) {
      setFormError('يرجى إرفاق ملف PDF أو إدخال رابط الملف');
      return;
    }

    const sub = getSubject(formSubjectId);
    const examData: Exam = {
      id: editingExamId || `pdf_exam_${Date.now()}`,
      title: formTitle.trim(),
      subjectId: formSubjectId,
      academicYear: formYear.trim(),
      isPdf: true,
      pdfUrl: formPdfUrl.trim(),
      questionsCount: formQuestionsCount,
      durationMinutes: 60,
      subjectName: sub ? sub.name : '',
      gradeName: sub ? getGradeDisplayName(sub.grade, grades) : '',
    };

    if (onAddExam) {
      await onAddExam(examData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-amber-950/30 border border-rose-500/20 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>مكتبة نماذج الاختبارات الوزارية المصورة الرسمية</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              نماذج الـ PDF الوزارية
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              إضافة واستعراض نماذج الامتحانات الوزارية بملفات PDF الرسمية المعتمدة لجميع المحافظات والمراحل مع سهولة التصفح والتحميل.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Add PDF Exam Button */}
            <button
              onClick={() => handleOpenAddModal()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2.5 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة نموذج PDF جديد</span>
            </button>

            {/* Total Counter Badge */}
            <div className="px-5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="block text-2xl font-black text-rose-400 font-mono">
                {formatEnNumber(pdfExams.length)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">نموذج PDF رسمي</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters & View Mode */}
      <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في أسماء النماذج والأعوام والمواد..."
              className="luxury-input w-full pr-11 pl-4 py-2.5 text-xs placeholder:text-slate-500"
            />
          </div>

          {/* Grade Filter */}
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className="luxury-input py-2.5 px-3 text-xs w-full sm:w-48 bg-slate-900 text-slate-200"
          >
            <option value="all">جميع المراحل الدراسية</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Stream Filter */}
          <select
            value={selectedStreamFilter}
            onChange={(e) => setSelectedStreamFilter(e.target.value)}
            className="luxury-input py-2.5 px-3 text-xs w-full sm:w-36 bg-slate-900 text-slate-200"
          >
            <option value="all">كل الأقسام</option>
            <option value="scientific">القسم العلمي</option>
            <option value="literary">القسم الأدبي</option>
          </select>
        </div>

        {/* View Switcher & Year Filter */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10">
            <button
              onClick={() => setViewMode('subjects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'subjects'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>حسب المواد (أتمتة)</span>
            </button>
            <button
              onClick={() => setViewMode('explorer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'explorer'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>المستكشف المباشر</span>
            </button>
          </div>

          {/* Year Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xs sm:max-w-none">
            {uniqueYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYearFilter(year)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedYearFilter === year
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-105'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                {year === 'الكل' ? 'جميع الأعوام' : toEnDigits(year)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredExams.length === 0 ? (
        <div className="luxury-card p-12 text-center max-w-md mx-auto space-y-4">
          <FileText className="w-16 h-16 text-slate-600 mx-auto stroke-1" />
          <h3 className="text-lg font-bold text-white">لم يتم العثور على نماذج PDF</h3>
          <p className="text-sm text-slate-400">
            لا توجد نماذج مطابقة للبحث أو التصفية المختارة. يمكنك إضافة نموذج جديد الآن.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول نموذج PDF</span>
          </button>
        </div>
      ) : viewMode === 'subjects' ? (
        /* Mode 1: Grouped like Automated Exams View */
        <div className="space-y-10">
          {Object.entries(grouped).map(([year, subjectsMap]) => (
            <div key={year} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-2xl font-black text-white">
                  العام الدراسي: <span className="text-amber-400 font-mono">{toEnDigits(year)}</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <button
                  onClick={() => handleOpenAddModal(undefined, year)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة نموذج لهذا العام</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(subjectsMap).map(([subjectId, subjectExams]) => {
                  const subject = getSubject(subjectId);
                  const subjectName = subject ? subject.name : subjectId;
                  const gradeLabel = subject?.grade === 'grade12' 
                    ? (subject.stream === 'scientific' ? 'ثالث ثانوي (علمي)' : subject.stream === 'literary' ? 'ثالث ثانوي (أدبي)' : 'ثالث ثانوي')
                    : 'الصف التاسع الأساسي';

                  return (
                    <div
                      key={subjectId}
                      className="luxury-card p-6 border-white/10 hover:border-rose-500/30 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div>
                        {/* Subject Card Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white">
                                {subjectName}
                              </h3>
                              <span className="text-[11px] text-slate-400">
                                {gradeLabel} • {formatEnNumber(subjectExams.length)} نماذج
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenAddModal(subjectId, year)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                            title="إضافة نموذج لهذه المادة"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Exams in this subject */}
                        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                          {subjectExams.map((exam) => (
                            <div
                              key={exam.id}
                              className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 flex items-center justify-between gap-3 group transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                                  {exam.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {exam.pdfUrl && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setPreviewPdfUrl(exam.pdfUrl!);
                                        setPreviewPdfTitle(exam.title);
                                      }}
                                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                                      title="معاينة النموذج داخل المتصفح"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <a
                                      href={exam.pdfUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                      title="فتح الرابط الخارجي"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}

                                <button
                                  onClick={() => handleOpenEditModal(exam)}
                                  className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف النموذج "${exam.title}"؟`)) {
                                      onDeleteExam(exam.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Mode 2: Direct Explorer Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredExams.map((exam) => {
            const subject = getSubject(exam.subjectId);
            const subjectName = subject ? subject.name : 'مادة مجهولة';

            return (
              <div
                key={exam.id}
                className="luxury-card p-5 border-white/10 hover:border-rose-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                      PDF رسمي
                    </span>
                    <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {toEnDigits(exam.academicYear)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>{subjectName}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {exam.pdfUrl && (
                      <>
                        <button
                          onClick={() => {
                            setPreviewPdfUrl(exam.pdfUrl!);
                            setPreviewPdfTitle(exam.title);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة</span>
                        </button>
                        <a
                          href={exam.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                          title="تحميل الملف"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(exam)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="تعديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف "${exam.title}"؟`)) {
                          onDeleteExam(exam.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit PDF Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="luxury-glass-panel rounded-3xl max-w-lg w-full flex flex-col border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingExamId ? 'تعديل نموذج PDF' : 'إضافة نموذج PDF وزاري جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  المادة الدراسية:
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="luxury-input w-full py-2.5 px-3 text-xs bg-slate-900 text-white"
                  required
                >
                  <option value="" disabled>اختر المادة...</option>
                  {subjects.map((s) => {
                    const gradeName = getGradeDisplayName(s.grade, grades);
                    const streamText = getStreamDisplayName(s.stream);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({gradeName} - {streamText})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان النموذج الوزاري:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثلاً: النموذج الوزاري الأول 2025 - أمانة العاصمة"
                  className="luxury-input w-full py-2.5 px-3 text-xs"
                  required
                />
              </div>

              {/* Academic Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>العام الدراسي:</span>
                    <span className="text-[10px] text-rose-400 font-normal">من قاعدة البيانات</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="admin-academic-years-list"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      placeholder="اختر أو اكتب العام الدراسي..."
                      className="luxury-input w-full py-2.5 px-3 text-xs font-mono"
                      required
                    />
                    <datalist id="admin-academic-years-list">
                      {years.map((y) => {
                        const lbl = y.yearLabel || (y as any).year || '';
                        return lbl ? <option key={y.id} value={lbl} /> : null;
                      })}
                    </datalist>
                  </div>
                  {years.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {years.slice(0, 5).map((y) => {
                        const lbl = y.yearLabel || (y as any).year || '';
                        if (!lbl) return null;
                        return (
                          <button
                            type="button"
                            key={y.id}
                            onClick={() => setFormYear(lbl)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                              formYear === lbl
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold'
                                : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    عدد الأسئلة التقريبي:
                  </label>
                  <input
                    type="number"
                    value={formQuestionsCount}
                    onChange={(e) => setFormQuestionsCount(parseInt(e.target.value) || 50)}
                    className="luxury-input w-full py-2.5 px-3 text-xs font-mono"
                  />
                </div>
              </div>

              {/* PDF File / URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  ملف النموذج (PDF):
                </label>
                
                {/* File Upload Box */}
                {formPdfUrl && (uploadedPdfFileName || formPdfUrl.startsWith('http')) ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-200 truncate">
                          {uploadedPdfFileName || 'ملف PDF مرفوع بنجاح'}
                        </p>
                        <p className="text-[10px] text-emerald-400/80">
                          {uploadedPdfFileSize ? `${uploadedPdfFileSize} • ` : ''}تم الرفع والحفظ سحابياً بنجاح
                        </p>
                      </div>
                    </div>
                    <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer shrink-0 transition-colors">
                      <span>تغيير الملف</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploadingPdf}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border-2 border-dashed border-white/20 hover:border-rose-500/50 transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                        {isUploadingPdf ? (
                          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isUploadingPdf ? 'جاري رفع وحفظ ملف الـ PDF...' : 'اختر ملف الـ PDF من جهازك'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          سيتم رفعه وتوليد الرابط تلقائياً بدون الحاجة لإدخال أي روابط
                        </p>
                      </div>
                    </div>

                    <label className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-lg shadow-rose-600/30">
                      <span>{isUploadingPdf ? 'يرفع الآن...' : 'تصفح ملف PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploadingPdf}
                      />
                    </label>
                  </div>
                )}

                {/* Direct Link Optional Fallback */}
                <div className="pt-1">
                  <input
                    type="url"
                    value={formPdfUrl}
                    onChange={(e) => setFormPdfUrl(e.target.value)}
                    placeholder="أو الصق رابط مباشر لملف الـ PDF يدوياً (https://...)"
                    className="luxury-input w-full py-2 px-3 text-[11px] font-mono text-left opacity-75 hover:opacity-100 transition-opacity"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPdf}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingExamId ? 'حفظ التعديلات' : 'إضافة النموذج الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal Viewer */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="luxury-glass-panel rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">
                  معاينة النموذج: {previewPdfTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في تبويب جديد</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-2">
              <iframe
                src={previewPdfUrl}
                title={previewPdfTitle}
                className="w-full h-full rounded-2xl border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
