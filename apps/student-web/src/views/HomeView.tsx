import React from 'react';
import {
  FileText,
  GraduationCap,
  Award,
  BookOpen,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Trophy,
  History,
  Zap,
  Target
} from 'lucide-react';
import { StudentUser, GradeModel } from '../types';
import { formatNumber } from '../utils/numberFormatter';

interface HomeViewProps {
  currentUser: StudentUser | null;
  grades?: GradeModel[];
  selectedGrade: string;
  onChangeGrade: (grade: string) => void;
  selectedStream: string;
  onChangeStream: (stream: string) => void;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenAuth: () => void;
  totalExamsCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  grades = [],
  selectedGrade,
  onChangeGrade,
  selectedStream,
  onChangeStream,
  onNavigate,
  onOpenAuth,
  totalExamsCount
}) => {
  const currentGradeObj = grades.find((g) => g.id === selectedGrade);
  const gradeLabel = currentGradeObj
    ? `${currentGradeObj.name}${selectedStream ? ` (${selectedStream})` : ''}`
    : selectedGrade === 'grade9'
    ? 'الصف التاسع الأساسي'
    : selectedStream === 'scientific'
    ? 'ثالث ثانوي علمي'
    : 'ثالث ثانوي أدبي';

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/15">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>منصة الامتحانات المؤتمتة والقبول الموحد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              أهلاً بك، {currentUser ? currentUser.name : 'طالبنا العزيز'} 👋
            </h1>
            <p className="text-blue-100/90 text-sm sm:text-base max-w-xl leading-relaxed">
              تدرّب على آلاف نماذج الامتحانات الوزارية المؤتمتة لجميع المحافظات بنمط البابل شيت، مع إحصائيات فورية وتفسير نموذجي لكل سؤال.
            </p>
          </div>

          {/* Quick Level / Points Badge */}
          <div className="flex md:flex-col items-center justify-between md:justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[180px]">
            <div>
              <span className="text-xs text-blue-200 font-medium block">رصيد نقاط التحدي</span>
              <span className="text-2xl font-black text-amber-300">
                {formatNumber(currentUser?.points || 150)}
              </span>
            </div>
            <div className="md:mt-3 px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-300/30">
              مستوى الصدارة 🏅
            </div>
          </div>
        </div>

        {/* Grade / Stream Selector Switcher */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
            <Target className="w-4 h-4 text-blue-300" />
            <span>المرحلة الدراسية الحالية:</span>
            <span className="text-white bg-white/20 px-2.5 py-1 rounded-lg">{gradeLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {grades.length > 0 ? (
              grades.map((grade) => {
                if (grade.hasStreams && grade.streams && grade.streams.length > 0) {
                  return grade.streams.map((stream) => {
                    const isSelected = selectedGrade === grade.id && selectedStream === stream;
                    return (
                      <button
                        key={`${grade.id}_${stream}`}
                        onClick={() => {
                          onChangeGrade(grade.id);
                          onChangeStream(stream);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-white text-blue-900 shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {grade.name} ({stream})
                      </button>
                    );
                  });
                }
                const isSelected = selectedGrade === grade.id;
                return (
                  <button
                    key={grade.id}
                    onClick={() => {
                      onChangeGrade(grade.id);
                      onChangeStream('');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-blue-900 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {grade.name}
                  </button>
                );
              })
            ) : (
              <>
                <button
                  onClick={() => onChangeGrade('grade9')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedGrade === 'grade9'
                      ? 'bg-white text-blue-900 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  الصف التاسع
                </button>
                <button
                  onClick={() => {
                    onChangeGrade('grade12');
                    onChangeStream('scientific');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedGrade === 'grade12' && selectedStream === 'scientific'
                      ? 'bg-white text-blue-900 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  ثالث ثانوي - علمي
                </button>
                <button
                  onClick={() => {
                    onChangeGrade('grade12');
                    onChangeStream('literary');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedGrade === 'grade12' && selectedStream === 'literary'
                      ? 'bg-white text-blue-900 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  ثالث ثانوي - أدبي
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Main Educational Portals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">الأقسام التعليمية الرئيسية</h2>
            <p className="text-xs text-slate-500">اختر القسم للبدء بالتدريب وحل النماذج</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Curricula Exams */}
          <div
            onClick={() => onNavigate('curricula')}
            className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-blue-500/50 shadow-soft hover:shadow-floating transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
              الامتحانات المؤتمتة
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              نماذج وزارية مؤتمتة لجميع المواد مع التصحيح الفوري والشرح النموذجي.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 pt-2 border-t border-slate-100">
              <span>تصفح النماذج</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Universities Admission */}
          <div
            onClick={() => onNavigate('admission')}
            className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-emerald-500/50 shadow-soft hover:shadow-floating transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-emerald-600 transition-colors">
              قبول الجامعات
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              اختبارات المفاضلة والقبول لكليات الطب والهندسة والحاسوب بالجامعات اليمنية.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 pt-2 border-t border-slate-100">
              <span>استكشاف الكليات</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Competitions */}
          <div
            onClick={() => onNavigate('competition')}
            className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-amber-500/50 shadow-soft hover:shadow-floating transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-amber-600 transition-colors">
              المسابقات والتحديات
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              تحديات تنافسية مباشرة، احصد النقاط وتصدر قائمة الشرف على مستوى الجمهورية.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 pt-2 border-t border-slate-100">
              <span>بدء التحدي</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: PDF Library */}
          <div
            onClick={() => onNavigate('library')}
            className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-purple-500/50 shadow-soft hover:shadow-floating transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-purple-600 transition-colors">
              المكتبة والملازم PDF
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              ملخصات مركزة ونماذج وزارية مصورة بصيغة PDF جاهزة للتصفح والتحميل المباشر.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-purple-600 pt-2 border-t border-slate-100">
              <span>فتح المكتبة</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Quick Actions & Features Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Results & Mistakes Training */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">ميزة التدريب الذكي على الأخطاء</h3>
                <p className="text-xs text-slate-500">طوّر مستواك بإعادة حل الأسئلة التي تعثرت بها فقط</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>سجل الاختبارات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                🎯
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">إعادة حل الأسئلة الخاطئة</span>
                <span className="text-[11px] text-slate-500">يقوم النظام بفرز الأسئلة وتجهيز جلسة تدريب مكثفة بدون تكرار ما أتقنته.</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              انتقل للاختبارات السابقة
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
              <span className="text-lg font-black text-blue-600 block">36+</span>
              <span className="text-[11px] text-slate-600 font-semibold">نموذج وزاري لكل مادة</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-lg font-black text-emerald-600 block">10,000+</span>
              <span className="text-[11px] text-slate-600 font-semibold">سؤال مؤتمت مع الشرح</span>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
              <span className="text-lg font-black text-purple-600 block">100%</span>
              <span className="text-[11px] text-slate-600 font-semibold">مطابق للمنهج اليمني</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Teaser Card */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-amber-600/20 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-extrabold text-lg text-white">لوحة الصدارة</h3>
            <p className="text-xs text-amber-100 leading-relaxed">
              شاهد تصنيف الطلاب المتميزين وتنافس مع زملائك على المراكز الأولى في حل الاختبارات.
            </p>
          </div>

          <button
            onClick={() => onNavigate('leaderboard')}
            className="mt-6 w-full py-2.5 rounded-xl bg-white text-amber-800 font-bold text-xs hover:bg-amber-50 transition-colors shadow-sm"
          >
            عرض لوحة الصدارة الآن
          </button>
        </div>
      </div>
    </div>
  );
};

