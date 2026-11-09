import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  School, 
  BookOpen, 
  FileText, 
  FileCheck2, 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  X, 
  Check, 
  Search, 
  ChevronLeft,
  ExternalLink,
  Zap,
  Award,
  Layers,
  Filter,
  LayoutGrid,
  List,
  Edit3
} from 'lucide-react';
import { Exam, Subject, AcademicYear, Question, GradeItem, PREDEFINED_GRADES } from '../types';
import { 
  formatEnNumber, 
  toEnDigits, 
  isSubjectMatchingGradeAndStream, 
  getGradeDisplayName, 
  getStreamDisplayName, 
  normalizeGrade, 
  normalizeStream 
} from '../utils/formatters';

interface ExamsViewProps {
  exams: Exam[];
  subjects: Subject[];
  years: AcademicYear[];
  grades?: GradeItem[];
  questionsMap: Record<string, Question[]>;
  onAddExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onBulkDeleteExams?: (ids: string[]) => Promise<void> | void;
  onOpenQuestions: (exam: Exam) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  subjects,
  years,
  grades = [],
  questionsMap,
  onAddExam,
  onDeleteExam,
  onBulkDeleteExams,
  onOpenQuestions,
}) => {
  // Multi-Selection State for automated exams
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());

  // Wipe / Reset Modal State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeType, setWipeType] = useState<'selected' | 'subject' | 'year' | 'grade' | 'all'>('selected');
  const [wipeSubjectId, setWipeSubjectId] = useState<string>('');
  const [wipeYear, setWipeYear] = useState<string>('');
  const [wipeGrade, setWipeGrade] = useState<string>('grade9');
  const [wipeConfirmText, setWipeConfirmText] = useState<string>('');
  const [isWiping, setIsWiping] = useState(false);
  // View Modes: 'explorer' (All Exams Search & Filter) or 'wizard' (5-Step Breadcrumb Stepper)
  const [viewMode, setViewMode] = useState<'explorer' | 'wizard'>('explorer');

  // Explorer State
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerTypeFilter, setExplorerTypeFilter] = useState<'all' | 'interactive' | 'pdf'>('all');
  const [explorerYearFilter, setExplorerYearFilter] = useState<string>('all');
  const [explorerGradeFilter, setExplorerGradeFilter] = useState<string>('all');
  const [explorerStreamFilter, setExplorerStreamFilter] = useState<string>('all');

  // Wizard Stepper State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isPdfType, setIsPdfType] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState<string>('');

  // Add/Edit Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examYear, setExamYear] = useState('2024');
  const [examDuration, setExamDuration] = useState(60);
  const [examIsPdf, setExamIsPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Dynamic Grade & Stream cards from live Firestore
  const dynamicGradeMeta = useMemo(() => {
    if (!grades || grades.length === 0) {
      return [
        { id: 'grade9', stream: null, label: 'الصف التاسع الأساسي', gradeName: 'الصف التاسع الأساسي', badge: 'الشهادة الأساسية' },
        { id: 'grade12', stream: 'scientific', label: 'الثالث الثانوي - علمي', gradeName: 'الثالث الثانوي', badge: 'القسم العلمي' },
        { id: 'grade12', stream: 'literary', label: 'الثالث الثانوي - أدبي', gradeName: 'الثالث الثانوي', badge: 'القسم الأدبي' },
        { id: 'grade12', stream: 'scientific_english', label: 'الثالث الثانوي - علمي (إنجليزي)', gradeName: 'ثالث ثانوي قسم انجليزي', badge: 'Scientific English' },
      ];
    }

    const cards: { id: string; stream: string | null; label: string; gradeName: string; badge: string }[] = [];
    const sorted = [...grades].sort((a, b) => (a.order || 0) - (b.order || 0));
    sorted.forEach(g => {
      if (g.hasStreams && g.streams && g.streams.length > 0) {
        g.streams.forEach(st => {
          const streamLabel = (st === 'عملي' || st === 'علمي') 
            ? 'القسم العلمي' 
            : (st === 'أدبي' || st === 'ادبي') 
            ? 'القسم الأدبي' 
            : `مسار ${st}`;
          cards.push({
            id: g.id,
            stream: (st === 'عملي' ? 'علمي' : st),
            label: `${g.name} - ${streamLabel}`,
            gradeName: g.name,
            badge: streamLabel,
          });
        });
      } else {
        cards.push({
          id: g.id,
          stream: null,
          label: g.name,
          gradeName: g.name,
          badge: 'عام موحد',
        });
      }
    });
    return cards;
  }, [grades]);

  // English format helper
  const formatEn = (n: number | undefined | null) => formatEnNumber(n);

  // Filtered exams for Explorer Mode
  const explorerFilteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSearch = explorerSearch.trim() === '' || 
        e.title.toLowerCase().includes(explorerSearch.toLowerCase()) ||
        (e.subjectName && e.subjectName.toLowerCase().includes(explorerSearch.toLowerCase()));

      const matchType = explorerTypeFilter === 'all' || 
        (explorerTypeFilter === 'pdf' ? Boolean(e.isPdf) : !e.isPdf);

      const matchYear = explorerYearFilter === 'all' || 
        (e.academicYear === explorerYearFilter || e.year === explorerYearFilter);

      const sub = subjects.find(s => s.id === e.subjectId);
      const matchGrade = explorerGradeFilter === 'all' || 
        e.grade === explorerGradeFilter || 
        (sub && (sub.grade === explorerGradeFilter || normalizeGrade(sub.grade) === normalizeGrade(explorerGradeFilter)));

      const matchStream = explorerStreamFilter === 'all' || 
        (sub && normalizeStream(sub.stream) === normalizeStream(explorerStreamFilter));

      return matchSearch && matchType && matchYear && matchGrade && matchStream;
    });
  }, [exams, explorerSearch, explorerTypeFilter, explorerYearFilter, explorerGradeFilter, explorerStreamFilter, subjects]);

  const stepsList = [
    { num: 0, title: 'المرحلة والمسار', icon: School },
    { num: 1, title: 'المادة الدراسية', icon: BookOpen },
    { num: 2, title: 'نوع النموذج', icon: Sparkles },
    { num: 3, title: 'العام الدراسي', icon: Calendar },
    { num: 4, title: 'بنك الاختبارات', icon: FileText },
  ];

  const getStepValue = (stepIndex: number) => {
    if (stepIndex === 0 && selectedGrade) {
      return dynamicGradeMeta.find(g => g.id === selectedGrade && (g.stream || null) === (selectedStream || null))?.badge || 'محدد';
    }
    if (stepIndex === 1 && selectedSubject) return selectedSubject.name;
    if (stepIndex === 2) return isPdfType ? 'PDF وزارية' : 'أتمتة تفاعلية';
    if (stepIndex === 3 && selectedYear) return selectedYear;
    return null;
  };

  const openNewExamModal = (presetSubjectId?: string, presetIsPdf?: boolean) => {
    setEditingExamId(null);
    setExamTitle('');
    setExamSubjectId(presetSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
    setExamYear(selectedYear || '2024');
    setExamDuration(60);
    setExamIsPdf(presetIsPdf !== undefined ? presetIsPdf : isPdfType);
    setPdfUrl('');
    setIsExamModalOpen(true);
  };

  // Toggle select single exam
  const toggleSelectExam = (id: string) => {
    setSelectedExamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all currently visible exams
  const toggleSelectAllVisible = (visibleExams: Exam[]) => {
    const visibleIds = visibleExams.map(e => e.id);
    const allSelected = visibleIds.every(id => selectedExamIds.has(id));
    if (allSelected) {
      setSelectedExamIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedExamIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Delete batch of exams safely
  const executeBatchDelete = async (ids: string[], confirmMessage: string) => {
    if (ids.length === 0) return;
    if (!confirm(confirmMessage)) return;

    setIsWiping(true);
    try {
      if (onBulkDeleteExams) {
        await onBulkDeleteExams(ids);
      } else {
        for (const id of ids) {
          await onDeleteExam(id);
        }
      }
      setSelectedExamIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      setIsWipeModalOpen(false);
      setWipeConfirmText('');
    } catch (err) {
      console.error('Error executing batch delete:', err);
      alert('حدث خطأ أثناء مسح النماذج');
    } finally {
      setIsWiping(false);
    }
  };

  // Handle Wipe action from the modal
  const handleExecuteWipe = async () => {
    let idsToDelete: string[] = [];
    let message = '';

    if (wipeType === 'selected') {
      idsToDelete = Array.from(selectedExamIds);
      message = `هل أنت متأكد من مسح ${idsToDelete.length} نموذج محدد نهائياً؟`;
    } else if (wipeType === 'subject') {
      const sub = subjects.find(s => s.id === wipeSubjectId);
      idsToDelete = exams.filter(e => e.subjectId === wipeSubjectId && !e.isPdf).map(e => e.id);
      message = `هل أنت متأكد من مسح كافة نماذج مادة "${sub?.name || 'المختارة'}" (${idsToDelete.length} نموذج)؟`;
    } else if (wipeType === 'year') {
      idsToDelete = exams.filter(e => (e.academicYear === wipeYear || e.year === wipeYear) && !e.isPdf).map(e => e.id);
      message = `هل أنت متأكد من مسح كافة نماذج العام الدراسي "${wipeYear}" (${idsToDelete.length} نموذج)؟`;
    } else if (wipeType === 'grade') {
      idsToDelete = exams.filter(e => {
        const sub = subjects.find(s => s.id === e.subjectId);
        return sub ? sub.grade === wipeGrade : false;
      }).filter(e => !e.isPdf).map(e => e.id);
      const gradeLabel = wipeGrade === 'grade9' ? 'الصف التاسع' : 'الثالث الثانوي';
      message = `هل أنت متأكد من مسح كافة نماذج "${gradeLabel}" (${idsToDelete.length} نموذج)؟`;
    } else if (wipeType === 'all') {
      if (wipeConfirmText.trim() !== 'تأكيد' && wipeConfirmText.trim().toUpperCase() !== 'DELETE') {
        alert('يرجى كتابة كلمة "تأكيد" للتحقق من الرغبة في المسح الشامل لكافة نماذج الأتمتة.');
        return;
      }
      idsToDelete = exams.filter(e => !e.isPdf).map(e => e.id);
      message = `تحذير نهائي: هل أنت متأكد تماماً من تهيئة ومسح جميع نماذج الأتمتة (${idsToDelete.length} نموذج)؟ لا يمكن التراجع عن هذا الإجراء.`;
    }

    if (idsToDelete.length === 0) {
      alert('لا توجد نماذج مطابقة للمسح حسب هذا الخيار.');
      return;
    }

    await executeBatchDelete(idsToDelete, message);
  };

  const handleSaveExam = () => {
    if (!examTitle.trim()) return;
    const subObj = subjects.find(s => s.id === examSubjectId);

    const examData: Exam = {
      id: editingExamId || 'exam_' + Date.now(),
      title: examTitle.trim(),
      subjectId: examSubjectId,
      subjectName: subObj?.name || 'مادة دراسية',
      grade: subObj?.grade || selectedGrade || 'grade12',
      stream: subObj?.stream || selectedStream || undefined,
      academicYear: examYear,
      year: examYear,
      durationMinutes: examDuration,
      questionsCount: editingExamId ? (exams.find(e => e.id === editingExamId)?.questionsCount || 0) : 0,
      isPdf: examIsPdf,
      pdfUrl: examIsPdf ? pdfUrl : undefined,
      createdAt: new Date().toISOString(),
    };

    onAddExam(examData);
    setIsExamModalOpen(false);
  };

  // -------------------------------------------------------------
  // RENDER EXPLORER VIEW (All Exams with fast search & filter)
  // -------------------------------------------------------------
  const renderExplorerView = () => (
    <div className="space-y-5 animate-fadeIn">
      {/* Search and Filters Bar */}
      <div className="calm-panel p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={explorerSearch}
              onChange={(e) => setExplorerSearch(e.target.value)}
              placeholder="ابحث باسم الاختبار، النموذج، أو اسم المادة..."
              className="calm-input w-full py-2.5 pr-10 pl-4 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setWipeType(selectedExamIds.size > 0 ? 'selected' : 'subject');
                setWipeSubjectId(subjects.length > 0 ? subjects[0].id : '');
                setWipeYear(years.length > 0 ? years[0].yearLabel : '2024');
                setIsWipeModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs shadow-sm transition-all"
              title="تهيئة ومسح نماذج الأتمتة"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>تهيئة ومسح النماذج</span>
            </button>

            <button
              onClick={() => openNewExamModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة نموذج جديد للسحابة</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 ml-2">
            <Filter className="w-3.5 h-3.5" />
            النوع:
          </span>

          {[
            { id: 'all', label: `الكل (${formatEn(exams.length)})` },
            { id: 'interactive', label: `تفاعلي مؤتمت (${formatEn(exams.filter(e => !e.isPdf).length)})` },
            { id: 'pdf', label: `PDF رسمي (${formatEn(exams.filter(e => e.isPdf).length)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setExplorerTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                explorerTypeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="text-slate-400 font-semibold mr-3 ml-2">الصف:</span>
          <select
            value={explorerGradeFilter}
            onChange={(e) => setExplorerGradeFilter(e.target.value)}
            className="calm-input py-1 px-3 text-xs font-medium"
          >
            <option value="all">جميع الصفوف</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <span className="text-slate-400 font-semibold mr-3 ml-2">المسار:</span>
          <select
            value={explorerStreamFilter}
            onChange={(e) => setExplorerStreamFilter(e.target.value)}
            className="calm-input py-1 px-3 text-xs font-medium"
          >
            <option value="all">كل الأقسام</option>
            <option value="scientific">القسم العلمي</option>
            <option value="literary">القسم الأدبي</option>
          </select>

          <span className="text-slate-400 font-semibold mr-3 ml-2">العام:</span>
          <select
            value={explorerYearFilter}
            onChange={(e) => setExplorerYearFilter(e.target.value)}
            className="calm-input py-1 px-3 text-xs font-mono font-medium"
          >
            <option value="all">جميع الأعوام</option>
            {years.map(y => (
              <option key={y.id} value={y.yearLabel}>{y.yearLabel}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-Selection Sticky Action Bar */}
      {selectedExamIds.size > 0 && (
        <div className="sticky top-4 z-30 p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs sm:text-sm font-bold">
              تم تحديد ({formatEn(selectedExamIds.size)}) نموذج اختبار
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSelectAllVisible(explorerFilteredExams)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              {explorerFilteredExams.every(e => selectedExamIds.has(e.id)) ? 'إلغاء تحديد المعروض' : 'تحديد كل المعروض'}
            </button>
            <button
              onClick={() => setSelectedExamIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
            >
              تفريغ التحديد
            </button>
            <button
              onClick={() => {
                setWipeType('selected');
                setIsWipeModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح المحدد ({formatEn(selectedExamIds.size)})</span>
            </button>
          </div>
        </div>
      )}

      {/* Exams Grid */}
      {explorerFilteredExams.length === 0 ? (
        <div className="calm-panel p-16 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">لا توجد اختبارات تطابق الفلتر الحالي</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            جرب إزالة كلمات البحث أو انقر على "إضافة نموذج جديد للسحابة" لإدخال أول اختبار.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {explorerFilteredExams.map((exam) => {
            const sub = subjects.find(s => s.id === exam.subjectId);
            return (
              <div
                key={exam.id}
                className="calm-card p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Checkbox for selection */}
                      <input
                        type="checkbox"
                        checked={selectedExamIds.has(exam.id)}
                        onChange={() => toggleSelectExam(exam.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        title="تحديد للمسح"
                      />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {exam.academicYear || exam.year || '2024'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {sub?.name || exam.subjectName || 'مادة عامة'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الاختبار "${exam.title}" من فايربيس؟`)) {
                            onDeleteExam(exam.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{exam.isPdf ? '📄 نموذج PDF وزارى' : '⚡ أتمتة تفاعلية'}</span>
                      <span>•</span>
                      <span className="font-mono">{formatEn(exam.durationMinutes || 60)} دقيقة</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatEn(exam.questionsCount || 0)} سؤال</span>
                  </div>

                  {exam.isPdf ? (
                    <a
                      href={exam.pdfUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح PDF</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onOpenQuestions(exam)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 border border-blue-200 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>إدارة الأسئلة ({formatEn(exam.questionsCount || 0)})</span>
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

  // -------------------------------------------------------------
  // RENDER WIZARD STEPPER (Guided 5-step navigation)
  // -------------------------------------------------------------
  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2 py-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          الخطوة الأولى: تحديد المسار الأكاديمي
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">اختر الصف والمرحلة الدراسية</h3>
        <p className="text-xs text-slate-500">حدد المرحلة لعرض المواد والنماذج الوزارية التابعة لها</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dynamicGradeMeta.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              setSelectedGrade(item.id);
              setSelectedStream(item.stream);
              setCurrentStep(1);
            }}
            className="calm-card p-5 cursor-pointer group hover:border-blue-300 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <School className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                {item.badge}
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {item.label}
              </h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <span>تصفح المواد والنماذج</span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-[-2px] transition-transform" />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => {
    const activeMeta = dynamicGradeMeta.find(
      (g) => g.id === selectedGrade && (g.stream || null) === (selectedStream || null)
    );
    const filtered = subjects.filter(
      (s) => isSubjectMatchingGradeAndStream(
        s.grade, 
        s.stream, 
        selectedGrade, 
        selectedStream, 
        activeMeta?.gradeName || activeMeta?.label
      ) && s.name.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">اختر المادة الدراسية</h3>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">
              المرحلة: {activeMeta?.label || 'المرحلة المحددة'}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder="ابحث عن مادة..."
              className="calm-input w-full py-2 pr-10 pl-4 text-xs font-medium"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="calm-panel p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-base font-bold text-slate-800">لا توجد مواد مسجلة لهذا الصف حالياً</p>
            <p className="text-xs text-slate-500">يمكنك إضافة المواد من قسم "المواد الدراسية" بالقائمة الجانبية.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((subject) => (
              <div
                key={subject.id}
                onClick={() => {
                  setSelectedSubject(subject);
                  setCurrentStep(2);
                }}
                className="calm-card p-4 cursor-pointer group space-y-3 hover:border-blue-300 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {subject.name}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">{subject.stream || 'عام'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1.5 py-2">
        <h3 className="text-xl font-bold text-slate-900">اختر نوع نماذج الاختبارات</h3>
        <p className="text-xs text-slate-500">حدد هل تريد النماذج التفاعلية المؤتمتة أو النسخ الرسمية بصيغة PDF</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div
          onClick={() => { setIsPdfType(false); setCurrentStep(3); }}
          className="calm-card p-6 cursor-pointer group hover:border-blue-400 transition-all space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Zap className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                النظام الموصى به ⭐
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                نماذج تفاعلية مؤتمتة
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                بنك أسئلة ذكي يتيح للطالب خوض الاختبار بمؤقت وتصحيح آلي فوري وإحصائيات مباشرة.
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setIsPdfType(true); setCurrentStep(3); }}
          className="calm-card p-6 cursor-pointer group hover:border-slate-400 transition-all space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                أرشيف رسمي
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                نماذج PDF وزارية رسمية
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                النسخ المصورة طبق الأصل من نماذج الامتحانات الوزارية لوزارة التربية والتعليم للطباعة والمراجعة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1.5 py-2">
        <h3 className="text-xl font-bold text-slate-900">اختر العام الدراسي</h3>
        <p className="text-xs text-slate-500">حدد العام الدراسي للنموذج المطلوب في مادة {selectedSubject?.name}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => {
            setSelectedYear(null);
            setCurrentStep(4);
          }}
          className="calm-card p-4 text-center cursor-pointer group hover:border-blue-400 transition-all space-y-2 bg-blue-50/40"
        >
          <div className="w-10 h-10 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              جميع الأعوام
            </div>
            <span className="text-[10px] text-slate-500 font-medium">عرض كل النماذج</span>
          </div>
        </div>
        {(years.length > 0 ? years : [{ id: '2024', yearLabel: '2024' }, { id: '2023', yearLabel: '2023' }]).map((y) => (
          <div
            key={y.id}
            onClick={() => {
              setSelectedYear(y.yearLabel);
              setCurrentStep(4);
            }}
            className="calm-card p-4 text-center cursor-pointer group hover:border-blue-400 transition-all space-y-2"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-mono">
                {y.yearLabel}
              </div>
              <span className="text-[10px] text-slate-400">العام الوزاري</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => {
    const filteredExams = exams.filter((e) => {
      const matchSubject = e.subjectId === selectedSubject?.id;
      const matchYear = selectedYear ? (e.academicYear === selectedYear || e.year === selectedYear) : true;
      const matchPdf = isPdfType ? e.isPdf === true : (e.isPdf === false || !e.isPdf);
      return matchSubject && matchYear && matchPdf;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              قائمة الاختبارات • {selectedSubject?.name} ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              نوع النماذج: {isPdfType ? 'PDF وزارية مصورة' : 'اختبارات مؤتمتة ذكية'}
            </p>
          </div>

          <button
            onClick={() => openNewExamModal(selectedSubject?.id, isPdfType)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نموذج جديد للسحابة</span>
          </button>
        </div>

        {filteredExams.length === 0 ? (
          <div className="calm-panel p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-base font-bold text-slate-800">لا توجد نماذج مضافة لهذا العام حتى الآن</p>
            <p className="text-xs text-slate-500">انقر على زر "إضافة نموذج جديد للسحابة" لإنشاء أول اختبار والبدء بإضافة الأسئلة مباشرة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="calm-card p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedExamIds.has(exam.id)}
                        onChange={() => toggleSelectExam(exam.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        title="تحديد للمسح"
                      />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {exam.academicYear || exam.year || selectedYear}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف الاختبار "${exam.title}" من فايربيس؟`)) {
                          onDeleteExam(exam.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="حذف الاختبار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {exam.title}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatEn(exam.durationMinutes || 60)} دقيقة
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      {formatEn(exam.questionsCount || 0)} سؤال
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {exam.isPdf ? (
                    <a
                      href={exam.pdfUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح ملف الـ PDF</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onOpenQuestions(exam)}
                      className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 transition-all font-mono"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>إدارة وتحرير الأسئلة ({formatEn(exam.questionsCount || 0)})</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Bar with View Mode Switcher */}
      <div className="calm-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>بنوك الاختبارات والنماذج الوزارية</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">إدارة نماذج الامتحانات الوزارية</h2>
          <p className="text-xs text-slate-500">إجمالي النماذج المسجلة بالسحابة: <span className="font-bold text-blue-600 font-mono">{formatEn(exams.length)}</span> نموذج</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('explorer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'explorer'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>المستكشف والبحث الشامل</span>
          </button>
          <button
            onClick={() => setViewMode('wizard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'wizard'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>المسار المتسلسل (5 خطوات)</span>
          </button>
        </div>
      </div>

      {/* EXPLORER MODE */}
      {viewMode === 'explorer' && renderExplorerView()}

      {/* WIZARD MODE */}
      {viewMode === 'wizard' && (
        <div className="space-y-6">
          {/* Stepper Breadcrumbs */}
          <div className="calm-panel p-4 flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {stepsList.map((st, i) => {
                const SIcon = st.icon;
                const isCurrent = currentStep === st.num;
                const isCompleted = currentStep > st.num;
                const value = getStepValue(st.num);

                return (
                  <React.Fragment key={st.num}>
                    {i > 0 && <ChevronLeft className="w-4 h-4 text-slate-300 mx-1 shrink-0" />}

                    <button
                      onClick={() => { if (isCompleted) setCurrentStep(st.num); }}
                      disabled={!isCompleted && !isCurrent}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isCompleted
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <SIcon className="w-3.5 h-3.5" />
                      <span>{st.title}</span>
                      {value && isCompleted && (
                        <span className="text-[10px] bg-white/80 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                          {value}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <span>رجوع للخطوة السابقة</span>
              </button>
            )}
          </div>

          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      )}

      {/* Wipe & Reset Modal Studio */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-5 border border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    تهيئة ومسح نماذج الأتمتة
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    حدد النطاق الذي تريد مسحه بدقة من قاعدة البيانات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWipeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wipe Options Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                اختر نوع المسح المطلوب:
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setWipeType('selected')}
                  className={`p-3 rounded-xl border text-right font-bold transition-all ${
                    wipeType === 'selected'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p>1. مسح المحدد باليد</p>
                  <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    ({formatEn(selectedExamIds.size)} نموذج محدد)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWipeType('subject')}
                  className={`p-3 rounded-xl border text-right font-bold transition-all ${
                    wipeType === 'subject'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p>2. مسح مادة بالكامل</p>
                  <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    حسب مادة معينة
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWipeType('year')}
                  className={`p-3 rounded-xl border text-right font-bold transition-all ${
                    wipeType === 'year'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p>3. مسح عام دراسي</p>
                  <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    كافة نماذج عام محدد
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWipeType('all')}
                  className={`p-3 rounded-xl border text-right font-bold transition-all ${
                    wipeType === 'all'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                      : 'border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <p>4. تهيئة ومسح شامل</p>
                  <p className="text-[10px] font-normal opacity-90 mt-0.5">
                    مسح كافة نماذج الأتمتة
                  </p>
                </button>
              </div>
            </div>

            {/* Dynamic Controls based on selected Wipe Type */}
            {wipeType === 'subject' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  اختر المادة الدراسية المراد مسح نماذجها:
                </label>
                <select
                  value={wipeSubjectId}
                  onChange={(e) => setWipeSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {subjects.map(s => {
                    const count = exams.filter(e => e.subjectId === s.id && !e.isPdf).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade === 'grade12' ? 'ثالث ثانوي' : 'تاسع'}) — متوفر {count} نموذج
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {wipeType === 'year' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  اختر العام الدراسي المراد مسح نماذجه:
                </label>
                <select
                  value={wipeYear}
                  onChange={(e) => setWipeYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium font-mono"
                >
                  {years.map(y => {
                    const count = exams.filter(e => (e.academicYear === y.yearLabel || e.year === y.yearLabel) && !e.isPdf).length;
                    return (
                      <option key={y.id} value={y.yearLabel}>
                        العام الدراسي: {y.yearLabel} — متوفر {count} نموذج
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {wipeType === 'all' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2.5">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  ⚠️ تأكيد أمان المسح الشامل:
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                  سيتم مسح كافة نماذج الأتمتة التفاعلية المسجلة ({exams.filter(e => !e.isPdf).length} نموذج) مع جميع الأسئلة التابعة لها نهائياً.
                  للتأكيد، يرجى كتابة كلمة <strong className="font-mono bg-rose-200 dark:bg-rose-900 px-1 py-0.5 rounded">تأكيد</strong> في الحقل أدناه:
                </p>
                <input
                  type="text"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value)}
                  placeholder="اكتب كلمة تأكيد هنا..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-slate-900 dark:text-white font-bold"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteWipe}
                disabled={isWiping}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isWiping ? 'جاري المسح من السحابة...' : 'تنفيذ المسح الآن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingExamId ? 'تعديل نموذج الاختبار' : 'إضافة نموذج اختبار جديد للسحابة'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">عنوان الاختبار</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: النموذج الوزاري الأول - مادة الرياضيات 2024"
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">المادة الدراسية</label>
                <select
                  value={examSubjectId}
                  onChange={(e) => setExamSubjectId(e.target.value)}
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-medium"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({getGradeDisplayName(s.grade, grades)} - {getStreamDisplayName(s.stream)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">العام الدراسي</label>
                  <select
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                    className="calm-input w-full py-2.5 px-3 text-xs text-slate-900 font-mono font-medium"
                  >
                    {(years.length > 0 ? years : [{ id: '2024', yearLabel: '2024' }, { id: '2023', yearLabel: '2023' }]).map(y => (
                      <option key={y.id} value={y.yearLabel}>{y.yearLabel}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">مدة الاختبار (بالدقائق)</label>
                  <input
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examIsPdf}
                    onChange={(e) => setExamIsPdf(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">هذا النموذج هو نسخة مصورة (PDF)</span>
                </label>

                {examIsPdf && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">رابط ملف الـ PDF</label>
                    <input
                      type="url"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://..."
                      className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-mono font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveExam}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                حفظ الاختبار في فايربيس
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
