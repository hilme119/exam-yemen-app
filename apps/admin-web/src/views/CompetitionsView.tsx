import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Clock, 
  Award, 
  Calendar,
  Sparkles, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  X,
  Layers,
  Edit3
} from 'lucide-react';
import { db, collection, setDoc, doc, deleteDoc, updateDoc, onSnapshot } from '../services/firebase';
import { CompetitionSemester, CompetitionSubject, CompetitionExam } from '../types';
import { formatEnNumber, toEnDigits } from '../utils/formatters';

export const CompetitionsView: React.FC = () => {
  // Navigation level: 0 = Semesters, 1 = Subjects, 2 = Exams
  const [level, setLevel] = useState<0 | 1 | 2>(0);
  const [selectedSemester, setSelectedSemester] = useState<CompetitionSemester | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CompetitionSubject | null>(null);

  // Data from live Firestore
  const [semesters, setSemesters] = useState<CompetitionSemester[]>([]);
  const [compSubjects, setCompSubjects] = useState<CompetitionSubject[]>([]);
  const [compExams, setCompExams] = useState<CompetitionExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [semesterName, setSemesterName] = useState('');

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(45);
  const [points, setPoints] = useState(250);

  // 1. Listen to Real Firestore Semesters
  useEffect(() => {
    setIsLoading(true);
    const unsub = onSnapshot(collection(db, 'competition_semesters'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CompetitionSemester));
      setSemesters(list);
      setIsLoading(false);
    }, (err) => {
      console.error('competition_semesters error:', err);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Listen to Real Firestore Subjects for active Semester
  useEffect(() => {
    if (!selectedSemester) {
      setCompSubjects([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'competition_subjects'), (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as CompetitionSubject))
        .filter(s => s.semesterId === selectedSemester.id);
      setCompSubjects(list);
    }, (err) => console.error('competition_subjects error:', err));
    return () => unsub();
  }, [selectedSemester]);

  // 3. Listen to Real Firestore Exams for active Subject
  useEffect(() => {
    if (!selectedSubject) {
      setCompExams([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'competition_exams'), (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as CompetitionExam))
        .filter(e => e.subjectId === selectedSubject.id);
      setCompExams(list);
    }, (err) => console.error('competition_exams error:', err));
    return () => unsub();
  }, [selectedSubject]);

  // Handlers matching Flutter schema
  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterName.trim()) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'competition_semesters', id), {
        id,
        name: semesterName.trim(),
        createdAt: new Date().toISOString(),
      });
      setIsSemesterModalOpen(false);
      setSemesterName('');
    } catch (e) {
      console.error('Error adding semester:', e);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !selectedSemester) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'competition_subjects', id), {
        id,
        semesterId: selectedSemester.id,
        name: subjectName.trim(),
        createdAt: new Date().toISOString(),
      });
      setIsSubjectModalOpen(false);
      setSubjectName('');
    } catch (e) {
      console.error('Error adding competition subject:', e);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !selectedSubject) return;
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'competition_exams', id), {
        id,
        subjectId: selectedSubject.id,
        title: examTitle.trim(),
        timerMinutes: duration,
        rewardPoints: points,
      });
      setIsExamModalOpen(false);
      setExamTitle('');
    } catch (e) {
      console.error('Error adding competition exam:', e);
    }
  };

  const handleDeleteItem = async (col: string, id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}" من قاعدة بيانات فايربيس؟`)) {
      try {
        await deleteDoc(doc(db, col, id));
      } catch (e) {
        console.error('Error deleting document:', e);
      }
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>بيانات حية من سحابة Firebase (مجموعات competition_*)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            إدارة المسابقات والتحديات التنافسية
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            تنظيم مراحل وفصول التحديات، إضافة المواد التنافسية ونماذج الاختبارات الموقوتة، وتوزيع نقاط المكافآت للمتصدرين في لوحة الصدارة والتطبيق.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {level === 0 && (
            <button
              onClick={() => setIsSemesterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة فصل / دورة مسابقات</span>
            </button>
          )}
          {level === 1 && (
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة مادة تحدي</span>
            </button>
          )}
          {level === 2 && (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة نموذج مسابقة</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb Trail */}
      <div className="calm-panel p-3.5 flex items-center gap-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => {
            setLevel(0);
            setSelectedSemester(null);
            setSelectedSubject(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            level === 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>دورات وفصول المسابقات ({formatEnNumber(semesters.length)})</span>
        </button>

        {selectedSemester && (
          <>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => {
                setLevel(1);
                setSelectedSubject(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                level === 1 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{selectedSemester.name} ({formatEnNumber(compSubjects.length)} مواد)</span>
            </button>
          </>
        )}

        {selectedSubject && (
          <>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>{selectedSubject.name} ({formatEnNumber(compExams.length)} نماذج)</span>
            </span>
          </>
        )}
      </div>

      {/* Level 0: Semesters (Real from Firestore) */}
      {level === 0 && (
        <div className="space-y-4">
          {semesters.length === 0 ? (
            <div className="calm-panel p-16 text-center space-y-3">
              <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-800">لا توجد دورات مسابقات مسجلة في فايربيس حالياً</p>
              <p className="text-xs text-slate-500">انقر على "إضافة فصل / دورة مسابقات" لإضافة أول دورة تنافسية للطلاب.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesters.map((sem) => (
                <div
                  key={sem.id}
                  className="calm-card p-5 space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Trophy className="w-6 h-6 stroke-[2]" />
                    </div>
                    <button
                      onClick={() => handleDeleteItem('competition_semesters', sem.id, sem.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="حذف الفصل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{sem.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      معرف الفصل في فايربيس: <span className="font-mono text-slate-700">{sem.id}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSemester(sem);
                      setLevel(1);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>إدارة مواد وتحديات الدورة</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Level 1: Subjects of active semester */}
      {level === 1 && selectedSemester && (
        <div className="space-y-4">
          {compSubjects.length === 0 ? (
            <div className="calm-panel p-16 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-800">لا توجد مواد مضافة لهذا الفصل ({selectedSemester.name})</p>
              <p className="text-xs text-slate-500">انقر على "إضافة مادة تحدي" لإضافة أول مادة تنافسية في هذا الفصل.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="calm-card p-5 space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Zap className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <button
                      onClick={() => handleDeleteItem('competition_subjects', sub.id, sub.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="حذف المادة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      تابع لفصل: <strong className="text-slate-700">{selectedSemester.name}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubject(sub);
                      setLevel(2);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>نماذج واختبارات التحدي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Level 2: Exams of active subject */}
      {level === 2 && selectedSubject && (
        <div className="space-y-4">
          {compExams.length === 0 ? (
            <div className="calm-panel p-16 text-center space-y-3">
              <Clock className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-800">لا توجد نماذج مسابقات مضافة لمادة ({selectedSubject.name})</p>
              <p className="text-xs text-slate-500">انقر على "إضافة نموذج مسابقة" لإضافة اختبار تنافسي موقوت مع تحديد نقاط المكافأة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compExams.map((exam) => (
                <div
                  key={exam.id}
                  className="calm-card p-5 space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Award className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <button
                      onClick={() => handleDeleteItem('competition_exams', exam.id, exam.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="حذف النموذج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {toEnDigits(exam.durationMinutes || 45)} دقيقة
                      </span>
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        +{formatEnNumber(exam.points || 250)} نقطة
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                    ID: {exam.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Semester Modal */}
      {isSemesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="calm-panel max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إضافة فصل أو دورة مسابقات جديدة</h3>
              <button onClick={() => setIsSemesterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSemester} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الدورة أو الفصل التنافسي</label>
                <input
                  type="text"
                  required
                  value={semesterName}
                  onChange={(e) => setSemesterName(e.target.value)}
                  placeholder="مثال: ثالث ثانوي علمي - الفصل الأول"
                  className="calm-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSemesterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  حفظ الفصل في السحابة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && selectedSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="calm-panel max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إضافة مادة تنافسية جديدة</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الفصل التابع له</label>
                <input
                  type="text"
                  disabled
                  value={selectedSemester.name}
                  className="calm-input w-full p-2.5 text-xs font-medium bg-slate-100 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المادة التنافسية</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="مثال: تحدي الكيمياء السريعة"
                  className="calm-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  حفظ المادة التنافسية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isExamModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="calm-panel max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إضافة نموذج مسابقة تنافسي</h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان نموذج المسابقة</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="مثال: تحدي الأسبوع الأول - الجولة الحاسمة"
                  className="calm-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">وقت الاختبار (بالدقائق)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                    className="calm-input w-full p-2.5 text-xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نقاط المكافأة (XP)</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 100)}
                    className="calm-input w-full p-2.5 text-xs font-mono font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  إنشاء النموذج التنافسي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
