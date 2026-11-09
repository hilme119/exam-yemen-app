import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Gamepad2, 
  Calendar, 
  FileText, 
  FileCheck2, 
  BarChart3, 
  AlertCircle, 
  Users, 
  Bell, 
  Mail, 
  Video, 
  Settings, 
  ChevronLeft,
  Sparkles,
  Zap,
  CheckCircle2,
  CloudOff,
  Trophy
} from 'lucide-react';

export type NavItemIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

interface SidebarProps {
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  unreadFeedbacksCount?: number;
  unreadMessagesCount?: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isFirebaseConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedIndex,
  onSelectIndex,
  unreadFeedbacksCount = 0,
  unreadMessagesCount = 0,
  isMobileOpen,
  onCloseMobile,
  isFirebaseConnected = true,
}) => {
  const sections = [
    {
      label: 'الرئيسية والمؤشرات',
      items: [
        { index: 0, title: 'لوحة القيادة', icon: LayoutDashboard },
      ]
    },
    {
      label: 'المناهج والامتحانات',
      items: [
        { index: 13, title: 'الصفوف والمراحل الدراسية', icon: GraduationCap },
        { index: 1, title: 'المواد الدراسية', icon: BookOpen },
        { index: 4, title: 'الأعوام الدراسية', icon: Calendar },
        { index: 5, title: 'بنك الاختبارات المؤتمتة', icon: Zap },
        { index: 6, title: 'نماذج الـ PDF الرسمية', icon: FileCheck2 },
        { index: 12, title: 'المكتبة والملازم الرقمية', icon: Video },
      ]
    },
    {
      label: 'الجامعات والمسابقات',
      items: [
        { index: 2, title: 'اختبارات قبول الجامعات', icon: GraduationCap },
        { index: 3, title: 'المسابقات والتحديات', icon: Gamepad2 },
        { index: 15, title: 'لوحة الصدارة', icon: Trophy },
        { index: 7, title: 'سجل النتائج والتقارير', icon: BarChart3 },
      ]
    },
    {
      label: 'مركز الطلاب والمتابعة',
      items: [
        { 
          index: 8, 
          title: 'صندوق الاعتراضات', 
          icon: AlertCircle, 
          badge: unreadFeedbacksCount,
          badgeColor: 'bg-rose-500 text-white' 
        },
        { 
          index: 11, 
          title: 'رسائل الطلاب', 
          icon: Mail, 
          badge: unreadMessagesCount,
          badgeColor: 'bg-amber-500 text-white' 
        },
        { index: 10, title: 'مركز الإشعارات (FCM)', icon: Bell },
        { index: 9, title: 'إدارة المستخدمين', icon: Users },
      ]
    },
    {
      label: 'النظام',
      items: [
        { index: 14, title: 'إعدادات المنصة والصيانة', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Modern Calm Sidebar */}
      <aside 
        className={`z-50 w-64 xl:w-72 shrink-0 bg-white border-l border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isMobileOpen 
            ? 'fixed inset-y-0 right-0 flex shadow-2xl translate-x-0' 
            : 'fixed inset-y-0 right-0 hidden lg:flex translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                <GraduationCap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    اختبارات اليمن
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    الإدارة
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">لوحة التحكم المركزية</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 mb-2">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === item.index;
                  return (
                    <button
                      key={item.index}
                      onClick={() => {
                        onSelectIndex(item.index);
                        onCloseMobile();
                      }}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold border-r-4 border-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>{item.title}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Cloud Sync Status Footer */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-slate-700 font-medium">سحابة Firebase</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                متصلة
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
