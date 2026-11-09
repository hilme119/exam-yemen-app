import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AcademicYear } from '../types';

interface AcademicYearsViewProps {
  years: AcademicYear[];
  onAddYear: (year: AcademicYear) => void;
  onUpdateYear: (year: AcademicYear) => void;
  onDeleteYear: (id: string) => void;
}

export const AcademicYearsView: React.FC<AcademicYearsViewProps> = ({
  years,
  onAddYear,
  onUpdateYear,
  onDeleteYear,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearText, setYearText] = useState('');

  const getLabel = (y: AcademicYear) => y.yearLabel || (y as any).year || '';

  const handleOpenAdd = () => {
    setEditingYear(null);
    setYearText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (yr: AcademicYear) => {
    setEditingYear(yr);
    setYearText(getLabel(yr));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearText.trim()) return;

    if (editingYear) {
      onUpdateYear({
        ...editingYear,
        yearLabel: yearText.trim(),
      });
    } else {
      const newYear: AcademicYear = {
        id: 'yr_' + Date.now(),
        yearLabel: yearText.trim(),
      };
      onAddYear(newYear);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>التقويم والأعوام الدراسية</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">إدارة الأعوام الوزارية</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تحديد مواسم ونماذج الاختبارات حسب الأعوام الدراسية المعتمدة
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عام دراسي جديد</span>
        </button>
      </div>

      {/* Grid of Years */}
      {years.length === 0 ? (
        <div className="calm-panel p-16 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-base font-bold text-slate-800">لا توجد أعوام دراسية مسجلة</p>
          <p className="text-xs text-slate-500">أضف أعواماً دراسية مثل (2024 / 2023) لربط الاختبارات بها.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {years.map((yr) => {
            const label = getLabel(yr);
            return (
              <div
                key={yr.id}
                className="calm-card p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Calendar className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ID: {yr.id.slice(0, 8)}</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">{label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">العام الوزاري الرسمي</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(yr)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="تعديل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف العام الدراسي "${label}"؟`)) {
                        onDeleteYear(yr.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingYear ? 'تعديل العام الدراسي' : 'إضافة عام دراسي جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">العام الدراسي (نص أو رقم)</label>
                <input
                  type="text"
                  value={yearText}
                  onChange={(e) => setYearText(e.target.value)}
                  placeholder="مثال: 2024 أو 2023-2024"
                  className="calm-input w-full py-2.5 px-3.5 text-xs text-slate-900 font-mono font-medium"
                  required
                />
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
                  {editingYear ? 'حفظ التعديل' : 'إضافة العام'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
