import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Building2, 
  Search, 
  Trash2, 
  ExternalLink,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Calendar,
  X,
  Clock,
  Layers,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { db, collection, setDoc, doc, deleteDoc, onSnapshot } from '../services/firebase';
import { UniversityAdmission, AdmissionMajor, AdmissionSubject, AdmissionExam } from '../types';
import { formatEnNumber, toEnDigits } from '../utils/formatters';

export const AdmissionView: React.FC = () => {
  // Navigation level: 0 = Universities, 1 = Majors/Faculties, 2 = Subjects, 3 = Exams
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [selectedUni, setSelectedUni] = useState<UniversityAdmission | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<AdmissionMajor | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<AdmissionSubject | null>(null);

  // Data from Firestore
  const [universities, setUniversities] = useState<UniversityAdmission[]>([]);
  const [allMajors, setAllMajors] = useState<AdmissionMajor[]>([]);
  const [allAdmissionSubjects, setAllAdmissionSubjects] = useState<AdmissionSubject[]>([]);
  const [allAdmissionExams, setAllAdmissionExams] = useState<AdmissionExam[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);
  const [uniName, setUniName] = useState('');
  const [uniLocation, setUniLocation] = useState('صنعاء');

  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [majorName, setMajorName] = useState('');

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subName, setSubName] = useState('');

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examYear, setExamYear] = useState('2024');
  const [isPdf, setIsPdf] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');

  // 1. Real-time Listeners for all admission collections
  useEffect(() => {
    setLoading(true);

    // Universities listener
    const unsubUnis = onSnapshot(collection(db, 'universities'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name || '',
        location: d.data().location || d.data().city || 'اليمن',
        ...d.data()
      } as UniversityAdmission));
      setUniversities(list);
      setLoading(false);
    }, (err) => {
      console.error('Universities sync error:', err);
      setLoading(false);
    });

    // Majors listener
    const unsubMajors = onSnapshot(collection(db, 'majors'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        universityId: d.data().universityId || '',
        name: d.data().name || '',
        ...d.data()
      } as AdmissionMajor));
      setAllMajors(list);
    }, (err) => console.error('Majors sync error:', err));

    // Subjects listener
    const unsubSubjects = onSnapshot(collection(db, 'admission_subjects'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        majorId: d.data().majorId || '',
        name: d.data().name || '',
        ...d.data()
      } as AdmissionSubject));
      setAllAdmissionSubjects(list);
    }, (err) => console.error('Admission subjects sync error:', err));

    // Exams listener
    const unsubExams = onSnapshot(collection(db, 'admission_exams'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        subjectId: d.data().subjectId || '',
        title: d.data().title || '',
        academicYear: d.data().academicYear || d.data().year || '2024',
        isPdf: d.data().isPdf !== false,
        pdfUrl: d.data().pdfUrl || d.data().url || '',
        ...d.data()
      } as AdmissionExam));
      setAllAdmissionExams(list);
    }, (err) => console.error('Admission exams sync error:', err));

    return () => {
      unsubUnis();
      unsubMajors();
      unsubSubjects();
      unsubExams();
    };
  }, []);

  // Filtered lists for the active level
  const currentMajors = useMemo(() => {
    if (!selectedUni) return [];
    return allMajors.filter(m => m.universityId === selectedUni.id);
  }, [allMajors, selectedUni]);

  const currentSubjects = useMemo(() => {
    if (!selectedMajor) return [];
    return allAdmissionSubjects.filter(s => s.majorId === selectedMajor.id);
  }, [allAdmissionSubjects, selectedMajor]);

  const currentExams = useMemo(() => {
    if (!selectedSubject) return [];
    return allAdmissionExams.filter(e => e.subjectId === selectedSubject.id);
  }, [allAdmissionExams, selectedSubject]);

  // Search filtering
  const filteredUniversities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(u => u.name.toLowerCase().includes(q) || (u.location && u.location.toLowerCase().includes(q)));
  }, [universities, searchQuery]);

  const filteredMajors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentMajors;
    return currentMajors.filter(m => m.name.toLowerCase().includes(q));
  }, [currentMajors, searchQuery]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentSubjects;
    return currentSubjects.filter(s => s.name.toLowerCase().includes(q));
  }, [currentSubjects, searchQuery]);

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentExams;
    return currentExams.filter(e => e.title.toLowerCase().includes(q) || (e.academicYear && e.academicYear.includes(q)));
  }, [currentExams, searchQuery]);

  // Handlers for Adding Items
  const handleAddUni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniName.trim()) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'universities', id), {
        id,
        name: uniName.trim(),
        location: uniLocation.trim() || 'صنعاء',
        createdAt: new Date().toISOString(),
      });
      setIsUniModalOpen(false);
      setUniName('');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إضافة الجامعة');
    }
  };

  const handleAddMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!majorName.trim() || !selectedUni) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'majors', id), {
        id,
        universityId: selectedUni.id,
        name: majorName.trim(),
        createdAt: new Date().toISOString(),
      });
      setIsMajorModalOpen(false);
      setMajorName('');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إضافة الكلية');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !selectedMajor) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'admission_subjects', id), {
        id,
        majorId: selectedMajor.id,
        name: subName.trim(),
        createdAt: new Date().toISOString(),
      });
      setIsSubModalOpen(false);
      setSubName('');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إضافة المادة');
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !selectedSubject) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'admission_exams', id), {
        id,
        subjectId: selectedSubject.id,
        title: examTitle.trim(),
        academicYear: examYear.trim() || '2024',
        isPdf,
        pdfUrl: isPdf ? pdfUrl.trim() : '',
        url: isPdf ? pdfUrl.trim() : '',
        createdAt: new Date().toISOString(),
      });
      setIsExamModalOpen(false);
      setExamTitle('');
      setPdfUrl('');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إضافة نموذج الاختبار');
    }
  };

  // Handlers for Deleting Items
  const handleDeleteItem = async (colName: 'universities' | 'majors' | 'admission_subjects' | 'admission_exams', id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}" نهائياً من قاعدة البيانات؟`)) {
      try {
        await deleteDoc(doc(db, colName, id));
      } catch (e) {
        console.error(e);
        alert('فشل الحذف من قاعدة البيانات');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Calm SaaS Header */}
      <div className="calm-panel p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>منظومة القبول والمفاضلة الجامعية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            اختبارات قبول الجامعات اليمنية
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            إدارة متكاملة للجامعات، الكليات والتخصصات الطبية والهندسية، مواد المفاضلة، وبنوك أسئلة ونماذج اختبارات القبول المعتمدة.
          </p>
        </div>

        {/* Action Button for Current Level */}
        <div className="flex items-center gap-3">
          {level === 0 && (
            <button
              onClick={() => setIsUniModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة جامعة جديدة</span>
            </button>
          )}
          {level === 1 && (
            <button
              onClick={() => setIsMajorModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة كلية / تخصص</span>
            </button>
          )}
          {level === 2 && (
            <button
              onClick={() => setIsSubModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة مادة مفاضلة</span>
            </button>
          )}
          {level === 3 && (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة نموذج اختبار</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">الجامعات المسجلة</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatEnNumber(universities.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">الكليات والتخصصات</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
              {formatEnNumber(allMajors.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">مواد المفاضلة</span>
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 block">
              {formatEnNumber(allAdmissionSubjects.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="calm-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">نماذج الاختبارات</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {formatEnNumber(allAdmissionExams.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation Trail */}
      <div className="calm-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto">
          {/* Universities Root */}
          <button
            onClick={() => {
              setLevel(0);
              setSelectedUni(null);
              setSelectedMajor(null);
              setSelectedSubject(null);
              setSearchQuery('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              level === 0 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>الجامعات</span>
          </button>

          {/* Level 1: Selected University */}
          {selectedUni && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <button
                onClick={() => {
                  setLevel(1);
                  setSelectedMajor(null);
                  setSelectedSubject(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  level === 1 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{selectedUni.name}</span>
              </button>
            </>
          )}

          {/* Level 2: Selected Major */}
          {selectedMajor && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <button
                onClick={() => {
                  setLevel(2);
                  setSelectedSubject(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  level === 2 
                    ? 'bg-cyan-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{selectedMajor.name}</span>
              </button>
            </>
          )}

          {/* Level 3: Selected Subject */}
          {selectedSubject && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                <span>{selectedSubject.name}</span>
              </span>
            </>
          )}
        </div>

        {/* Search Input for Current Level */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              level === 0 ? "بحث في الجامعات..." :
              level === 1 ? "بحث في الكليات والتخصصات..." :
              level === 2 ? "بحث في مواد المفاضلة..." :
              "بحث في نماذج الاختبارات..."
            }
            className="w-full pr-9 pl-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* LEVEL 0: Universities Catalog */}
      {level === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUniversities.map((uni) => {
            const uniMajorsCount = allMajors.filter(m => m.universityId === uni.id).length;
            return (
              <div
                key={uni.id}
                className="calm-panel p-5 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>

                    <button
                      onClick={() => handleDeleteItem('universities', uni.id, uni.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="حذف الجامعة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {uni.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {uni.location || 'اليمن'} • {formatEnNumber(uniMajorsCount)} كلية وتخصص
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedUni(uni);
                      setLevel(1);
                      setSearchQuery('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>استعراض كليات وتخصصات الجامعة ({formatEnNumber(uniMajorsCount)})</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEVEL 1: Majors of Selected University */}
      {level === 1 && selectedUni && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMajors.map((maj) => {
            const majSubjectsCount = allAdmissionSubjects.filter(s => s.majorId === maj.id).length;
            return (
              <div
                key={maj.id}
                className="calm-panel p-5 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-6 h-6" />
                    </div>

                    <button
                      onClick={() => handleDeleteItem('majors', maj.id, maj.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="حذف الكلية"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                      {selectedUni.name}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                      {maj.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatEnNumber(majSubjectsCount)} مواد مفاضلة معتمدة
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedMajor(maj);
                      setLevel(2);
                      setSearchQuery('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white dark:bg-purple-950/60 dark:hover:bg-purple-600 dark:text-purple-300 dark:hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>استعراض مواد المفاضلة ({formatEnNumber(majSubjectsCount)})</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEVEL 2: Admission Subjects of Selected Major */}
      {level === 2 && selectedMajor && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => {
            const subExamsCount = allAdmissionExams.filter(e => e.subjectId === sub.id).length;
            return (
              <div
                key={sub.id}
                className="calm-panel p-5 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>

                    <button
                      onClick={() => handleDeleteItem('admission_subjects', sub.id, sub.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="حذف مادة المفاضلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block mb-1">
                      {selectedMajor.name}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatEnNumber(subExamsCount)} نماذج امتحانات مفاضلة
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedSubject(sub);
                      setLevel(3);
                      setSearchQuery('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-600 text-cyan-600 hover:text-white dark:bg-cyan-950/60 dark:hover:bg-cyan-600 dark:text-cyan-300 dark:hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>استعراض نماذج الاختبارات ({formatEnNumber(subExamsCount)})</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEVEL 3: Admission Exams of Selected Subject */}
      {level === 3 && selectedSubject && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                نماذج امتحانات: {selectedSubject.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedUni?.name} • {selectedMajor?.name}
              </p>
            </div>

            <button
              onClick={() => setIsExamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة نموذج جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="calm-panel p-5 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        exam.isPdf 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {exam.isPdf ? 'ملف PDF' : 'مؤتمت تفاعلي'}
                      </span>

                      <button
                        onClick={() => handleDeleteItem('admission_exams', exam.id, exam.title)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="حذف النموذج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {exam.title}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      العام الدراسي: {exam.academicYear || '2024'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {exam.pdfUrl ? (
                    <a
                      href={exam.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      معاينة نموذج الـ PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">اختبار إلكتروني مؤتمت</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredExams.length === 0 && (
            <div className="calm-panel p-12 text-center max-w-md mx-auto space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">لا توجد نماذج امتحانات مضافة لهذه المادة بعد</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يمكنك إضافة نماذج امتحانات مفاضلة (PDF أو إلكترونية) بالضغط على الزر بالأعلى.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add University Modal */}
      {isUniModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة جامعة جديدة</h3>
              <button onClick={() => setIsUniModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUni} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الجامعة</label>
                <input
                  type="text"
                  value={uniName}
                  onChange={(e) => setUniName(e.target.value)}
                  placeholder="مثال: جامعة عدن"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">المدينة أو المحافظة</label>
                <input
                  type="text"
                  value={uniLocation}
                  onChange={(e) => setUniLocation(e.target.value)}
                  placeholder="مثال: صنعاء، عدن، تعز"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsUniModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">إضافة الجامعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Major Modal */}
      {isMajorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة كلية أو تخصص لـ {selectedUni?.name}</h3>
              <button onClick={() => setIsMajorModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMajor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الكلية أو التخصص</label>
                <input
                  type="text"
                  value={majorName}
                  onChange={(e) => setMajorName(e.target.value)}
                  placeholder="مثال: كلية الطب البشري"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsMajorModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">إضافة الكلية</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة مادة مفاضلة لـ {selectedMajor?.name}</h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم مادة المفاضلة</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="مثال: كيمياء، أحياء، رياضيات، إنجليزي"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md">إضافة المادة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة نموذج اختبار مفاضلة</h3>
              <button onClick={() => setIsExamModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">عنوان النموذج</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: نموذج اختبار مفاضلة 2024"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">العام الدراسي</label>
                <input
                  type="text"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  placeholder="مثال: 2024"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pdfCheck"
                  checked={isPdf}
                  onChange={(e) => setIsPdf(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="pdfCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  نموذج PDF رسمي (رابط تحميل)
                </label>
              </div>

              {isPdf && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">رابط ملف الـ PDF المباشر</label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://firebasestorage.googleapis.com/... أو رابط مباشر"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-white font-mono"
                    dir="ltr"
                    required={isPdf}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsExamModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md">حفظ النموذج</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
