import React, { useState } from 'react';
import { 
  Trophy, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Download, 
  User, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  Percent,
  X,
  FileCheck2
} from 'lucide-react';
import { StudentResult, UserModel } from '../types';
import { formatEnNumber, toEnDigits, formatFirestoreDate } from '../utils/formatters';

interface ResultsViewProps {
  results: StudentResult[];
  users?: UserModel[];
  onExportCsv?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  users = [],
  onExportCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [selectedResultForDetails, setSelectedResultForDetails] = useState<StudentResult | null>(null);

  const getStudentRealName = (userId?: string, fallbackName?: string) => {
    if (!userId) return fallbackName || 'طالب منصة';
    const found = users.find(u => u.id === userId);
    return found?.name || fallbackName || `طالب (${userId.slice(0, 6)})`;
  };

  // Filter results
  const filteredResults = results.filter((r) => {
    const studentName = getStudentRealName(r.userId, r.userName || r.studentName);
    const examName = r.examName || r.examTitle || r.subjectName || '';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      examName.toLowerCase().includes(searchQuery.toLowerCase());

    const percentage = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0;
    const isPassed = percentage >= 50;

    if (filterStatus === 'passed') return matchesSearch && isPassed;
    if (filterStatus === 'failed') return matchesSearch && !isPassed;
    return matchesSearch;
  });

  const totalAttempts = results.length;
  const passedAttempts = results.filter(r => (r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 >= 50 : false)).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const headers = ['معرف الطالب', 'اسم الطالب الحقيقي', 'اسم الاختبار', 'الدرجة', 'إجمالي الأسئلة', 'النسبة المئوية', 'التاريخ'];
    const rows = filteredResults.map(r => [
      r.userId,
      getStudentRealName(r.userId, r.userName || r.studentName),
      r.examName || r.examTitle || r.subjectName || 'اختبار وزاري',
      r.score,
      r.totalQuestions,
      `${r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0}%`,
      formatFirestoreDate(r.dateTaken || r.createdAt || r.completedAt)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `نتائج_الطلاب_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-200">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>مراقبة الأداء والتقييم اللحظي</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            سجل نتائج وتقارير الطلاب
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            متابعة نتائج واختبارات الطلاب الحية ومعدلات النجاح المستخرجة مباشرة من قاعدة بيانات Firebase مع إمكانية البحث والتصدير.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>تصدير تقرير النتائج (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="calm-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الاختبارات المنجزة</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatEnNumber(totalAttempts)}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">اختبار خاضه الطلاب بالسحابة</span>
        </div>

        <div className="calm-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الاختبارات الناجحة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatEnNumber(passedAttempts)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">حققوا نسبة 50% فأعلى</span>
        </div>

        <div className="calm-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط نسبة النجاح</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {toEnDigits(passRate)}%
          </div>
          <span className="text-[11px] text-purple-600 font-semibold">معدل تحصيل المتدربين العام</span>
        </div>
      </div>

      {/* Search and Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            جميع النتائج ({formatEnNumber(results.length)})
          </button>
          <button
            onClick={() => setFilterStatus('passed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'passed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            الناجحين فقط ({formatEnNumber(passedAttempts)})
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'failed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            دون النجاح ({formatEnNumber(totalAttempts - passedAttempts)})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الطالب أو الاختبار..."
            className="calm-input w-full py-2 pr-10 pl-4 text-xs font-medium"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="calm-panel overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">اسم الطالب الحقيقي</th>
                <th className="px-5 py-3.5">النموذج / المادة</th>
                <th className="px-5 py-3.5 text-center">الدرجة</th>
                <th className="px-5 py-3.5 text-center">النسبة</th>
                <th className="px-5 py-3.5 text-center">الحالة</th>
                <th className="px-5 py-3.5">تاريخ الحل</th>
                <th className="px-5 py-3.5 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    لا توجد نتائج مطابقة للبحث أو الفلتر
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => {
                  const percentage = res.totalQuestions > 0 ? Math.round((res.score / res.totalQuestions) * 100) : 0;
                  const isPassed = percentage >= 50;
                  const realName = getStudentRealName(res.userId, res.userName || res.studentName);
                  const dateStr = formatFirestoreDate(res.dateTaken || res.createdAt || res.completedAt);

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                            {realName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {realName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              UID: {res.userId ? res.userId.substring(0, 10) : '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-800 block">
                          {res.examName || res.examTitle || 'اختبار تفاعلي'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {res.subjectName || 'مادة وزارية'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-900">
                        {formatEnNumber(res.score)} / {formatEnNumber(res.totalQuestions)}
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono font-bold">
                        <span className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                          {toEnDigits(percentage)}%
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPassed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isPassed ? 'ناجح ✓' : 'راسب ✕'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {dateStr}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedResultForDetails(res)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-colors"
                        >
                          معاينة
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedResultForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="calm-panel max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">تفاصيل اختبار الطالب</h3>
              <button onClick={() => setSelectedResultForDetails(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block">اسم الطالب:</span>
                <strong className="text-sm font-bold text-slate-900 block">
                  {getStudentRealName(selectedResultForDetails.userId, selectedResultForDetails.userName || selectedResultForDetails.studentName)}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">UID: {selectedResultForDetails.userId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">النموذج:</span>
                  <strong className="text-slate-800">{selectedResultForDetails.examName || selectedResultForDetails.examTitle || 'نموذج وزاري'}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">المادة:</span>
                  <strong className="text-slate-800">{selectedResultForDetails.subjectName || 'مادة وزارية'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">الدرجة:</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatEnNumber(selectedResultForDetails.score)} / {formatEnNumber(selectedResultForDetails.totalQuestions)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">النسبة:</span>
                  <span className="text-sm font-bold text-blue-700 font-mono">
                    {toEnDigits(selectedResultForDetails.totalQuestions > 0 ? Math.round((selectedResultForDetails.score / selectedResultForDetails.totalQuestions) * 100) : 0)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">الحالة:</span>
                  <span className={`text-xs font-bold ${
                    (selectedResultForDetails.score / (selectedResultForDetails.totalQuestions || 1)) >= 0.5
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}>
                    {(selectedResultForDetails.score / (selectedResultForDetails.totalQuestions || 1)) >= 0.5 ? 'ناجح' : 'راسب'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedResultForDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
