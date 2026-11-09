import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Users, 
  Trophy, 
  ArrowUpRight, 
  Sparkles, 
  BookOpen, 
  Zap, 
  Activity, 
  Calendar, 
  GraduationCap, 
  FileCheck2, 
  Bell, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  MapPin, 
  Clock, 
  Award, 
  BarChart2, 
  PieChart, 
  ShieldCheck, 
  ChevronLeft,
  Check
} from 'lucide-react';
import { DashboardStats, QuestionFeedback, UserModel, StudentResult } from '../types';
import { formatEnNumber, toEnDigits, formatFirestoreDate } from '../utils/formatters';

interface OverviewViewProps {
  stats: DashboardStats;
  users?: UserModel[];
  results?: StudentResult[];
  feedbacks?: QuestionFeedback[];
  onNavigateIndex: (index: number) => void;
  isLoading?: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  users = [],
  results = [],
  feedbacks = [],
  onNavigateIndex,
  isLoading = false,
}) => {
  // Format all numbers strictly in English digits (e.g. 1,540, 455, 0)
  const formatEn = (num: number | undefined | null) => formatEnNumber(num);

  const statCards = [
    {
      title: 'إجمالي الاختبارات والنماذج',
      value: formatEn(stats.totalExams),
      subtext: 'نموذج وزاري مسجل',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      change: 'محدث بالسحابة',
      changeColor: 'text-blue-700',
      navIdx: 5,
    },
    {
      title: 'الطلاب والمستخدمون المسجلون',
      value: formatEn(stats.totalStudents),
      subtext: 'طالب وطالبة بالمنظومة',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      change: 'بيانات حية مباشرة',
      changeColor: 'text-emerald-700',
      navIdx: 9,
    },
    {
      title: 'بنك الأسئلة المؤتمتة',
      value: formatEn(stats.totalQuestions),
      subtext: 'سؤال وزاري مدقق',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      change: 'خيارات وصور تفاعلية',
      changeColor: 'text-purple-700',
      navIdx: 5,
    },
    {
      title: 'المواد والمناهج الدراسية',
      value: formatEn(stats.totalSubjects),
      subtext: 'مقرر لكافة المراحل',
      icon: BookOpen,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      change: 'تاسع وثالث ثانوي',
      changeColor: 'text-amber-700',
      navIdx: 1,
    },
  ];

  // Dynamic distribution of students across grades from real `users`
  const studentDistribution = useMemo(() => {
    let grade9 = 0;
    let grade12Scientific = 0;
    let grade12Literary = 0;
    let other = 0;

    users.forEach((u) => {
      const g = (u.grade || u.gradeLevel || '').toLowerCase();
      if (g.includes('grade9') || g.includes('تاسع') || g.includes('أساسي')) {
        grade9++;
      } else if (g.includes('scientific') || g.includes('علمي') || g.includes('عملي')) {
        grade12Scientific++;
      } else if (g.includes('literary') || g.includes('أدبي') || g.includes('ادبي')) {
        grade12Literary++;
      } else if (g.includes('grade12') || g.includes('ثانوي')) {
        grade12Scientific++;
      } else {
        other++;
      }
    });

    const total = users.length || 1;
    return [
      { name: 'الصف التاسع الأساسي', count: grade9, pct: Math.round((grade9 / total) * 100), color: 'bg-blue-600' },
      { name: 'الثالث الثانوي (القسم العلمي)', count: grade12Scientific, pct: Math.round((grade12Scientific / total) * 100), color: 'bg-emerald-500' },
      { name: 'الثالث الثانوي (القسم الأدبي)', count: grade12Literary, pct: Math.round((grade12Literary / total) * 100), color: 'bg-amber-500' },
      { name: 'عام / حسابات أخرى', count: other, pct: Math.round((other / total) * 100), color: 'bg-slate-400' },
    ];
  }, [users]);

  // Recent student test attempts from real `results`
  const recentResults = useMemo(() => {
    return results.slice(0, 5);
  }, [results]);

  const pendingFeedbacksCount = feedbacks.filter(f => f.status === 'pending' || (!f.status && !f.isReadByAdmin)).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome Banner */}
      <div className="calm-panel p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-200">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>منظومة اختبارات اليمن v2.0 • لوحة القيادة الذكية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            مرحباً بك في مركز الإدارة الموحد
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            تحكم كامل في بنوك الأسئلة، إحصائيات الطلاب الحية، نماذج قبول الجامعات اليمنية، ومتابعة الاعتراضات بدقة واحترافية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateIndex(15)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all"
          >
            <Trophy className="w-4 h-4 fill-slate-950" />
            <span>لوحة الصدارة</span>
          </button>
          <button
            onClick={() => onNavigateIndex(5)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>إدارة بنك الاختبارات</span>
          </button>
          <button
            onClick={() => onNavigateIndex(1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>المواد والمناهج</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateIndex(card.navIdx)}
              className="calm-card p-5 cursor-pointer group hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-500">{card.title}</span>
                <div className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center border ${card.borderColor}`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>

              <div className="mt-4 space-y-1">
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-200/80 animate-pulse rounded-lg my-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {card.value}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">{card.subtext}</span>
                  <span className={`font-semibold ${card.changeColor}`}>
                    {isLoading ? 'جاري المزامنة...' : card.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Champions Leaderboard Highlight Card */}
      <div 
        onClick={() => onNavigateIndex(15)}
        className="calm-panel p-5 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-orange-500/10 border border-amber-200 hover:border-amber-400 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <Trophy className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900">لوحة الصدارة التنافسية للطلاب</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                محدث لحظياً
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              متابعة تنافس الطلاب ونقاط الصدارة في التطبيق لحظياً عبر حل النماذج والاختبارات، وترتيب المتصدرين لكل مرحلة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 self-end md:self-auto">
          <span>فتح لوحة الصدارة الكاملة</span>
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>

      {/* Notice & Alerts Bar if pending feedbacks exist */}
      {pendingFeedbacksCount > 0 && (
        <div 
          onClick={() => onNavigateIndex(8)}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-100/70 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                لديك {formatEn(pendingFeedbacksCount)} ملاحظات واعتراضات جديدة من الطلاب بانتظار المراجعة
              </h4>
              <p className="text-[11px] text-rose-700">
                انقر هنا للانتقال مباشرة إلى صندوق الاعتراضات والرد على الطلاب وتصحيح الأسئلة في بنك الاختبارات.
              </p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-rose-500" />
        </div>
      )}

      {/* Analytics & Live Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Student Distribution by Grade */}
        <div className="calm-panel p-6 space-y-5 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">توزيع الطلاب حسب المراحل</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">إجمالي: {formatEn(users.length)}</span>
          </div>

          <div className="space-y-4">
            {studentDistribution.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {formatEn(item.count)} طالب ({toEnDigits(item.pct)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(item.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
            💡 <strong>ملاحظة تقنية:</strong> هذه الإحصائية مستخرجة مباشرة من مجموعة <code className="text-blue-700 font-mono">users</code> الحية في سحابة Firebase وفق الصفوف المسجلة للطلاب.
          </div>
        </div>

        {/* Live Student Exam Attempts from real results */}
        <div className="calm-panel p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">سجل النشاط وحلول نماذج الطلاب الحية</h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              مباشر من السحابة ({formatEn(results.length)} اختبار)
            </span>
          </div>

          {recentResults.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">لا توجد اختبارات مسجلة مؤخراً</p>
              <p className="text-[11px] text-slate-400">ستظهر حلول واختبارات الطلاب هنا فور خوضهم للامتحانات في تطبيق الموبايل.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResults.map((res, rIdx) => {
                const student = users.find(u => u.id === res.userId);
                const sName = student?.name || res.studentName || res.userName || (res.userId ? `طالب (${res.userId.slice(0, 6)})` : 'طالب منصة');
                const score = res.score ?? 0;
                const total = res.totalQuestions ?? 50;
                const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                const dateStr = formatFirestoreDate(res.dateTaken || res.createdAt);

                return (
                  <div
                    key={res.id || rIdx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{sName}</span>
                        <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                          {dateStr}
                        </span>
                      </div>
                      <div className="text-slate-500 font-medium">
                        مادة: <strong className="text-slate-700">{res.subjectName || 'مادة وزارية'}</strong> • النموذج: <span className="text-blue-700">{res.examName || res.examTitle || 'نموذج وزاري'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right sm:text-left">
                        <span className="block font-mono font-bold text-sm text-slate-900">
                          {formatEn(score)} / {formatEn(total)}
                        </span>
                        <span className={`text-[10px] font-bold ${pct >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {toEnDigits(pct)}% نسبة النجاح
                        </span>
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        pct >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {pct >= 50 ? '✓' : '✕'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">سجل نتائج المنظومة محدث لحظياً</span>
            <button
              onClick={() => onNavigateIndex(10)}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>عرض سجل النتائج والتقارير الشامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
