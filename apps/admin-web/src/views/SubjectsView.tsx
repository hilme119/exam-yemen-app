import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Search,
  School,
  Layers,
  Sparkles
} from 'lucide-react';
import { Subject, GradeItem, PREDEFINED_GRADES } from '../types';
import { 
  formatEnNumber, 
  toEnDigits, 
  normalizeGrade, 
  normalizeStream, 
  getGradeDisplayName, 
  getStreamDisplayName 
} from '../utils/formatters';

interface SubjectsViewProps {
  subjects: Subject[];
  grades?: GradeItem[];
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  grades = [],
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);

  // Sorted grades list by order
  const sortedGrades = useMemo(() => {
    return [...grades].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [grades]);

  // Dynamically build grade + stream options from live Firestore grades
  const availableOptions = useMemo(() => {
    if (!sortedGrades || sortedGrades.length === 0) {
      return PREDEFINED_GRADES.map(p => ({
        gradeId: p.gradeId || p.id,
        streamId: p.streamId !== undefined ? p.streamId : p.stream,
        label: p.label || p.name,
        gradeName: p.name,
      }));
    }
    const list: { gradeId: string; streamId: string | null; label: string; gradeName: string }[] = [];
    sortedGrades.forEach(g => {
      if (g.hasStreams && g.streams && g.streams.length > 0) {
        g.streams.forEach(st => {
          const streamLabel = (st === 'عملي' || st === 'علمي') 
            ? 'القسم العلمي' 
            : (st === 'أدبي' || st === 'ادبي') 
            ? 'القسم الأدبي' 
            : `مسار ${st}`;
          list.push({
            gradeId: g.id,
            streamId: (st === 'عملي' ? 'علمي' : st),
            label: `${g.name} - ${streamLabel}`,
            gradeName: g.name,
          });
        });
      } else {
        list.push({
          gradeId: g.id,
          streamId: null,
          label: `${g.name} (عام / موحد)`,
          gradeName: g.name,
        });
      }
    });
    return list;
  }, [sortedGrades]);

  // Active Grade object if a specific grade is selected
  const activeGradeObj = useMemo(() => {
    if (selectedFilter === 'all') return null;
    return grades.find(g => g.id === selectedFilter || normalizeGrade(g.id, g.name) === normalizeGrade(selectedFilter));
  }, [grades, selectedFilter]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      // 1. Grade Filter
      let matchesGrade = selectedFilter === 'all';
      if (!matchesGrade) {
        matchesGrade = s.grade === selectedFilter || 
                       normalizeGrade(s.grade) === normalizeGrade(selectedFilter, activeGradeObj?.name);
      }

      // 2. Stream Filter
      let matchesStream = selectedStreamFilter === 'all';
      if (!matchesStream) {
        const normSubStream = normalizeStream(s.stream);
        const normFilterStream = normalizeStream(selectedStreamFilter);
        matchesStream = normSubStream === normFilterStream;
      }

      // 3. Search Filter
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [subjects, selectedFilter, selectedStreamFilter, searchQuery, activeGradeObj]);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setSelectedOptionIndex(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    const optIdx = availableOptions.findIndex(
      (opt) => (opt.gradeId === subject.grade || normalizeGrade(opt.gradeId, opt.gradeName) === normalizeGrade(subject.grade)) && 
               (normalizeStream(opt.streamId) === normalizeStream(subject.stream))
    );
    setSelectedOptionIndex(optIdx >= 0 ? optIdx : 0);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const opt = availableOptions[selectedOptionIndex] || availableOptions[0];
    const canonicalGrade = normalizeGrade(opt.gradeId, opt.gradeName);
    const canonicalStream = normalizeStream(opt.streamId);

    if (editingSubject) {
      onUpdateSubject({
        ...editingSubject,
        name: name.trim(),
        grade: canonicalGrade,
        stream: canonicalStream || undefined,
      });
    } else {
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: name.trim(),
        grade: canonicalGrade,
        stream: canonicalStream || undefined,
        iconName: 'book',
      };
      onAddSubject(newSubject);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>المناهج والكتب الوزارية</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">إدارة المواد والمقررات الدراسية</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة وتعديل المواد وتوزيعها بدقة بين القسم العلمي والقسم الأدبي والشهادة الأساسية
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة دراسية جديدة</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="calm-panel p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Main Grade Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedFilter('all');
                setSelectedStreamFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              جميع المواد ({formatEnNumber(subjects.length)})
            </button>
            {sortedGrades.map((gr) => (
              <button
                key={gr.id}
                onClick={() => {
                  setSelectedFilter(gr.id);
                  setSelectedStreamFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === gr.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {gr.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن مادة..."
              className="calm-input w-full py-2 pr-10 pl-4 text-xs font-medium"
            />
          </div>
        </div>

        {/* Secondary Stream Filter (when the selected grade has streams or for all) */}
        {(activeGradeObj?.hasStreams || selectedFilter === 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 ml-1">تصفية حسب المسار / القسم:</span>
            <button
              onClick={() => setSelectedStreamFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedStreamFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedStreamFilter('scientific')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStreamFilter === 'scientific'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span>🔬</span>
              <span>القسم العلمي</span>
            </button>
            <button
              onClick={() => setSelectedStreamFilter('literary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStreamFilter === 'literary'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span>📚</span>
              <span>القسم الأدبي</span>
            </button>
          </div>
        )}
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="calm-panel p-16 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-base font-bold text-slate-800">لا توجد مواد تطابق هذا الفلتر حالياً</p>
          <p className="text-xs text-slate-500">جرب تغيير الفلتر أو انقر على "إضافة مادة دراسية جديدة" لإضافة منهج جديد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((subject) => {
            const streamNorm = normalizeStream(subject.stream);
            return (
              <div
                key={subject.id}
                className="calm-card p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <BookOpen className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                        {getGradeDisplayName(subject.grade, grades)}
                      </span>
                      {subject.stream && (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                          streamNorm === 'scientific'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : streamNorm === 'literary'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {getStreamDisplayName(subject.stream)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{subject.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      المسار: {getStreamDisplayName(subject.stream)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {subject.id}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(subject)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="تعديل المادة"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف مادة "${subject.name}" من النظام؟`)) {
                          onDeleteSubject(subject.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="حذف المادة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'تعديل المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">اسم المادة الدراسية</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: القرآن الكريم، الرياضيات، الفيزياء، الفلسفة"
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">المرحلة الدراسية والمسار</label>
                <select
                  value={selectedOptionIndex}
                  onChange={(e) => setSelectedOptionIndex(Number(e.target.value))}
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-medium"
                >
                  {availableOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {editingSubject ? 'حفظ التعديلات' : 'إضافة المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
