import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderDown, 
  Plus, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Download,
  BookOpen,
  Video,
  FileCheck2,
  Sparkles,
  Search,
  Filter,
  X,
  GraduationCap,
  Eye,
  CheckCircle2,
  Upload,
  Check,
  AlertCircle,
  FileUp
} from 'lucide-react';
import { uploadMediaFile } from '../services/uploadService';
import { db, collection, setDoc, doc, deleteDoc, onSnapshot } from '../services/firebase';
import { LearningMaterial, Subject, GradeItem, AcademicYear } from '../types';
import { 
  formatEnNumber, 
  formatFirestoreDate, 
  normalizeGrade, 
  normalizeStream, 
  getGradeDisplayName, 
  getStreamDisplayName, 
  toEnDigits 
} from '../utils/formatters';

interface MaterialsViewProps {
  subjects?: Subject[];
  grades?: GradeItem[];
  years?: AcademicYear[];
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ 
  subjects = [], 
  grades = [],
  years = []
}) => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'summary' | 'book' | 'video'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedModalStream, setSelectedModalStream] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [matType, setMatType] = useState<'summary' | 'book' | 'video' | 'pdf'>('summary');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadError(null);

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFileSize(sizeMb + ' ميجابايت');
    setUploadedFileName(file.name);

    try {
      const url = await uploadMediaFile(file, file.name);
      setFileUrl(url);

      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setTitle(cleanName);
      }

      if (file.name.toLowerCase().endsWith('.pdf')) {
        setMatType('summary');
      } else if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4')) {
        setMatType('video');
      }
    } catch (err: any) {
      console.error('Error uploading material file:', err);
      setUploadError('فشل رفع الملف تلقائياً. يمكنك تجربة ملف آخر أو وضع الرابط يدوياً.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Set initial selected grade when grades load
  useEffect(() => {
    if (grades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(grades[0].id);
    }
  }, [grades, selectedGradeId]);

  // Real-time Firestore sync with learning_materials collection
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'learning_materials'), (snap) => {
      const items: LearningMaterial[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          subjectId: data.subjectId || '',
          subjectName: data.subjectName || '',
          grade: data.grade || '',
          type: data.type || 'summary',
          url: data.url || data.fileUrl || '',
          fileUrl: data.fileUrl || data.url || '',
          description: data.description || '',
          views: data.views || 0,
          downloads: data.downloads || 0,
          createdAt: data.createdAt,
        } as LearningMaterial;
      });

      setMaterials(items);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching learning_materials:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter subjects based on selected grade and stream inside Add Modal
  const modalAvailableSubjects = useMemo(() => {
    if (!selectedGradeId) return subjects;
    const targetNorm = normalizeGrade(selectedGradeId);
    return subjects.filter(s => {
      const subNorm = normalizeGrade(s.grade);
      const gradeMatches = s.grade === selectedGradeId || (subNorm && subNorm === targetNorm);
      if (!gradeMatches) return false;

      if (selectedModalStream !== 'all') {
        const normSubStream = normalizeStream(s.stream);
        const normTarget = normalizeStream(selectedModalStream);
        if (normSubStream && normSubStream !== 'general' && normSubStream !== normTarget) {
          return false;
        }
      }
      return true;
    });
  }, [subjects, selectedGradeId, selectedModalStream]);

  // When modal grade changes, update selected subject
  useEffect(() => {
    if (modalAvailableSubjects.length > 0) {
      setSelectedSubjectId(modalAvailableSubjects[0].id);
    } else {
      setSelectedSubjectId('');
    }
  }, [modalAvailableSubjects]);

  // Helper to resolve friendly Subject Name and Grade Name for each material
  const resolveMaterialMetadata = (mat: LearningMaterial) => {
    const subject = subjects.find(s => s.id === mat.subjectId);
    const subjectName = mat.subjectName || subject?.name || 'مادة عامة';
    
    let resolvedGradeName = mat.grade;
    if (!resolvedGradeName && subject) {
      resolvedGradeName = getGradeDisplayName(subject.grade, grades);
      if (subject.stream) {
        resolvedGradeName += ` - ${getStreamDisplayName(subject.stream)}`;
      }
    }

    return {
      subjectName,
      gradeName: resolvedGradeName || 'منهج وزاري عام',
      gradeId: subject?.grade || mat.grade
    };
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const { subjectName, gradeName, gradeId } = resolveMaterialMetadata(m);
      const subject = subjects.find(s => s.id === m.subjectId);
      const query = searchQuery.trim().toLowerCase();
      
      const matchesSearch = 
        !query ||
        m.title.toLowerCase().includes(query) ||
        subjectName.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query));

      const matchesType = 
        typeFilter === 'all' || 
        (typeFilter === 'summary' && (m.type === 'summary' || m.type === 'pdf')) ||
        (typeFilter === 'book' && m.type === 'book') ||
        (typeFilter === 'video' && m.type === 'video');

      let matchesGrade = true;
      if (gradeFilter !== 'all') {
        const normFilter = normalizeGrade(gradeFilter);
        const normMatGrade = normalizeGrade(gradeId, gradeName);
        matchesGrade = 
          gradeId === gradeFilter || 
          normMatGrade === normFilter || 
          gradeName.includes(gradeFilter);
      }

      let matchesStream = streamFilter === 'all';
      if (!matchesStream) {
        matchesStream = subject ? normalizeStream(subject.stream) === normalizeStream(streamFilter) : true;
      }

      return matchesSearch && matchesType && matchesGrade && matchesStream;
    });
  }, [materials, searchQuery, typeFilter, gradeFilter, streamFilter, subjects, grades]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    setIsSubmitting(true);
    const id = Date.now().toString();
    const chosenSubject = subjects.find(s => s.id === selectedSubjectId);
    const chosenGrade = grades.find(g => g.id === selectedGradeId);

    const newMat = {
      id,
      title: title.trim(),
      subjectId: selectedSubjectId || '',
      subjectName: chosenSubject?.name || '',
      grade: chosenGrade?.name || '',
      gradeId: selectedGradeId || '',
      academicYear: selectedYear.trim(),
      type: matType,
      url: fileUrl.trim(),
      fileUrl: fileUrl.trim(),
      description: description.trim(),
      views: 0,
      downloads: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'learning_materials', id), newMat);
      setIsModalOpen(false);
      setTitle('');
      setFileUrl('');
      setDescription('');
      setSelectedYear('');
      setUploadedFileName(null);
      setUploadedFileSize(null);
      setUploadError(null);
      setShowManualUrl(false);
    } catch (e) {
      console.error('Error adding material:', e);
      alert('حدث خطأ أثناء حفظ المادة التعليمية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, matTitle: string) => {
    if (confirm(`هل أنت متأكد من حذف المادة التعليمية "${matTitle}" نهائياً من المكتبة؟`)) {
      try {
        await deleteDoc(doc(db, 'learning_materials', id));
      } catch (e) {
        console.error(e);
        alert('فشل حذف المادة من قاعدة البيانات');
      }
    }
  };

  // Group summary counts
  const totalSummaries = materials.filter(m => m.type === 'summary' || m.type === 'pdf').length;
  const totalBooks = materials.filter(m => m.type === 'book').length;
  const totalVideos = materials.filter(m => m.type === 'video').length;

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Calm SaaS Header */}
      <div className="calm-panel p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>المكتبة الرقمية والملازم الرسمية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            إدارة الملازم والكتب الرقمية
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            استعراض وتوفير الملازم المعتمدة والكتب المنهجية الوزارية لطلاب الصف التاسع والثالث الثانوي، مع روابط تحميل PDF مباشرة لتمكين الطلاب من الدراسة بدون إنترنت.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة ملزمة أو كتاب جديد</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">إجمالي المحتوى</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatEnNumber(materials.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <FolderDown className="w-5 h-5" />
          </div>
        </div>

        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">الملازم والملخصات</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
              {formatEnNumber(totalSummaries)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">الكتب الوزارية</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {formatEnNumber(totalBooks)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">الشروحات المرئية</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
              {formatEnNumber(totalVideos)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Video className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dynamic Grade & Type Filters & Search */}
      <div className="calm-panel p-4 space-y-3">
        {/* Row 1: Grade Filters (Fetched dynamically from real Firestore Grades) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span>المرحلة والصف:</span>
          </span>

          <button
            onClick={() => setGradeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              gradeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            جميع الصفوف ({formatEnNumber(materials.length)})
          </button>

          {grades.map((g) => (
            <button
              key={g.id}
              onClick={() => setGradeFilter(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                gradeFilter === g.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Row 2: Stream Filters (Scientific vs Literary) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>المسار / القسم:</span>
          </span>
          <button
            onClick={() => setStreamFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
              streamFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            كل الأقسام
          </button>
          <button
            onClick={() => setStreamFilter('scientific')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              streamFilter === 'scientific'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            <span>🔬</span>
            <span>القسم العلمي</span>
          </button>
          <button
            onClick={() => setStreamFilter('literary')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              streamFilter === 'literary'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
            }`}
          >
            <span>📚</span>
            <span>القسم الأدبي</span>
          </button>
        </div>

        {/* Row 2: Type Filters + Search Box */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Type Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setTypeFilter('summary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'summary'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ملازم وملخصات ({formatEnNumber(totalSummaries)})
            </button>
            <button
              onClick={() => setTypeFilter('book')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'book'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              كتب وزارية ({formatEnNumber(totalBooks)})
            </button>
            <button
              onClick={() => setTypeFilter('video')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'video'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              شروحات فيديو ({formatEnNumber(totalVideos)})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الملزمة أو المادة..."
              className="w-full pr-10 pl-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.map((mat) => {
          const { subjectName, gradeName } = resolveMaterialMetadata(mat);
          const isBook = mat.type === 'book';
          const isVideo = mat.type === 'video';
          const fileDownloadUrl = mat.url || mat.fileUrl;

          return (
            <div
              key={mat.id}
              className="calm-panel p-5 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-3.5">
                {/* Top Row: Icon, Type Badge, Delete Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                    isBook 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                      : isVideo 
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                  }`}>
                    {isBook ? <BookOpen className="w-5 h-5" /> : isVideo ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isBook 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : isVideo 
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {isBook ? 'كتاب رسمي' : isVideo ? 'فيديو' : 'ملزمة / ملخص'}
                    </span>

                    <button
                      onClick={() => handleDelete(mat.id, mat.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="حذف من المكتبة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badges: Subject & Grade */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {subjectName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    • {gradeName}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 
                    className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    title={mat.title}
                  >
                    {mat.title}
                  </h3>
                  {mat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {mat.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Link & Meta Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {fileDownloadUrl ? (
                  <a
                    href={fileDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isVideo ? 'مشاهدة الفيديو' : 'معاينة وتحميل PDF'}</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">رابط الملف غير متاح</span>
                )}

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  {mat.views !== undefined && mat.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatEnNumber(mat.views)}
                    </span>
                  )}
                  {mat.downloads !== undefined && mat.downloads > 0 && (
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {formatEnNumber(mat.downloads)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && !loading && (
        <div className="calm-panel p-16 text-center max-w-md mx-auto space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">لا توجد مواد تعليمية مطابقة للبحث</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            يمكنك رفع ملازم وملخصات جديدة بالضغط على زر الإضافة بالأعلى.
          </p>
        </div>
      )}

      {/* Add Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة ملزمة أو كتاب دراسي جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  عنوان الملزمة أو الكتاب
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: ملخص الفيزياء الشامل - الثالث الثانوي"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Dynamic Grade, Stream & Subject Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    المرحلة الدراسية
                  </label>
                  <select
                    value={selectedGradeId}
                    onChange={(e) => setSelectedGradeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    المسار / القسم
                  </label>
                  <select
                    value={selectedModalStream}
                    onChange={(e) => setSelectedModalStream(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
                  >
                    <option value="all">كل الأقسام / مشترك</option>
                    <option value="scientific">القسم العلمي</option>
                    <option value="literary">القسم الأدبي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    المادة الدراسية
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
                    required
                  >
                    {modalAvailableSubjects.length === 0 ? (
                      <option value="">لا توجد مواد مطابقة</option>
                    ) : (
                      modalAvailableSubjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({getStreamDisplayName(s.stream)})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  نوع المحتوى
                </label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
                >
                  <option value="summary">ملزمة أو ملخص دراسي (PDF)</option>
                  <option value="book">كتاب وزاري مدرسي (رسمي)</option>
                  <option value="video">شرح فيديو مرئي (YouTube / MP4)</option>
                </select>
              </div>

              {/* Academic Year Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                  <span>العام الدراسي (اختياري):</span>
                  <span className="text-[10px] text-blue-500">من قاعدة البيانات</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="materials-years-list"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="اختر أو اكتب العام الدراسي..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white font-mono"
                  />
                  <datalist id="materials-years-list">
                    {years.map((y) => {
                      const lbl = y.yearLabel || (y as any).year || '';
                      return lbl ? <option key={y.id} value={lbl} /> : null;
                    })}
                  </datalist>
                </div>
              </div>

              {/* File Upload Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  ملف الملزمة أو الكتاب الدراسي:
                </label>

                {uploadedFileName && fileUrl ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">{uploadedFileName}</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80">{uploadedFileSize} • تم الرفع والحفظ سحابياً بنجاح</p>
                      </div>
                    </div>
                    <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shrink-0">
                      <span>تغيير الملف</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.epub,.mp4,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploadingFile}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        {isUploadingFile ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isUploadingFile ? 'جاري رفع الملف للسحابة...' : 'اختر ملف الملزمة أو الكتاب من جهازك'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          يدعم ملفات PDF، الكتب، الملازم، أو شروحات الفيديو
                        </p>
                      </div>
                    </div>

                    <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-sm">
                      <span>{isUploadingFile ? 'يرفع الآن...' : 'تصفح ملف من جهازك'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.epub,.mp4,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploadingFile}
                      />
                    </label>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}

                {/* Optional Manual URL */}
                <div className="pt-1">
                  {!showManualUrl && !fileUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowManualUrl(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>أو إدخال رابط خارجي يدوياً (YouTube / رابط مباشر)</span>
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          رابط الملف المباشر أو رابط الفيديو:
                        </label>
                        {!fileUrl && (
                          <button
                            type="button"
                            onClick={() => setShowManualUrl(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-600"
                          >
                            إخفاء
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://... أو رابط خارجي"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white font-mono"
                        dir="ltr"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  وصف مختصر (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ملاحظات حول محتوى الملزمة وما تغطيه من وحدات..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ ونشر المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
