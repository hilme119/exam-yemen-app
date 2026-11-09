import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { GradeItem } from '../types';

interface GradesViewProps {
  grades: GradeItem[];
  onAddGrade: (grade: GradeItem) => void;
  onUpdateGrade: (grade: GradeItem) => void;
  onDeleteGrade: (id: string) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  grades,
  onAddGrade,
  onUpdateGrade,
  onDeleteGrade,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [hasStreams, setHasStreams] = useState(false);
  const [streamsInput, setStreamsInput] = useState('');

  const handleOpenAdd = () => {
    setEditingGrade(null);
    setId('grade_' + Date.now());
    setName('');
    setOrder(grades.length + 1);
    setHasStreams(false);
    setStreamsInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (grade: GradeItem) => {
    setEditingGrade(grade);
    setId(grade.id);
    setName(grade.name);
    setOrder(grade.order || 1);
    setHasStreams(grade.hasStreams || false);
    setStreamsInput((grade.streams || []).join('، '));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedStreams = hasStreams 
      ? streamsInput.split(/[،,]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const item: GradeItem = {
      id: editingGrade ? editingGrade.id : id.trim(),
      name: name.trim(),
      order,
      hasStreams,
      streams: parsedStreams,
    };

    if (editingGrade) {
      onUpdateGrade(item);
    } else {
      onAddGrade(item);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>المراحل الدراسية والمسارات</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">إدارة الصفوف والمراحل التعليمية</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            التحكم في الصفوف المعتمدة وتحديد المسارات (علمي، أدبي، إنجليزي)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مرحلة دراسية</span>
        </button>
      </div>

      {/* Grades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {grades.map((grade) => (
          <div
            key={grade.id}
            className="calm-card p-6 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <GraduationCap className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{grade.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">معرف النظام: {grade.id}</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400 font-mono">
                  #{grade.order || 1}
                </span>
              </div>

              {/* Streams Chips */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  المسارات والفروع التابعة:
                </span>
                {grade.hasStreams && grade.streams && grade.streams.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {grade.streams.map((stream, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {stream}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">لا توجد مسارات فرعية (مسار عام موحد)</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(grade)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف المرحلة "${grade.name}"؟`)) {
                    onDeleteGrade(grade.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingGrade ? 'تعديل المرحلة الدراسية' : 'إضافة مرحلة دراسية جديدة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingGrade && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">معرف المرحلة (ID)</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="grade9 أو grade12"
                    className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-mono font-medium"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">اسم المرحلة</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الصف التاسع الأساسي، الثالث الثانوي"
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">الترتيب في القائمة</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-mono font-medium"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStreams}
                    onChange={(e) => setHasStreams(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700">تحتوي على مسارات وفروع (علمي / أدبي)</span>
                </label>

                {hasStreams && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 block">المسارات مفصولة بفواصل (،)</label>
                    <input
                      type="text"
                      value={streamsInput}
                      onChange={(e) => setStreamsInput(e.target.value)}
                      placeholder="علمي، أدبي، علمي إنجليزي، أدبي إنجليزي"
                      className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-medium"
                    />
                  </div>
                )}
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
                  {editingGrade ? 'حفظ التعديلات' : 'إضافة المرحلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
