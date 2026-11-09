import React from 'react';
import { 
  Menu, 
  RefreshCw, 
  LogOut,
  ShieldCheck,
  Database,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenMobileSidebar: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  currentUserEmail?: string | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileSidebar,
  onRefreshData,
  isRefreshing = false,
  currentUserEmail,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-6 backdrop-blur-md">
      {/* Right side: Mobile Menu + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            مشرف معتمد
          </span>
        </div>
      </div>

      {/* Left side: Project Badge + Actions */}
      <div className="flex items-center gap-3">
        {/* Cloud Connection Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>السحابة متصلة</span>
        </div>

        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="تحديث البيانات من Firebase"
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        )}

        {currentUserEmail && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="max-w-[140px] truncate">{currentUserEmail}</span>
          </div>
        )}

        <button
          onClick={onLogout}
          title="تسجيل الخروج"
          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition-all shadow-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </header>
  );
};
