import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  User, 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle,
  X,
  UserCheck,
  UserX,
  Calendar,
  GraduationCap,
  MapPin,
  ArrowUpDown,
  Clock,
  KeyRound
} from 'lucide-react';
import { UserModel } from '../types';
import { formatEnNumber, formatFirestoreDate, toEnDigits } from '../utils/formatters';

interface UsersViewProps {
  users: UserModel[];
  onUpdateRole: (userId: string, newRole: 'admin' | 'student') => Promise<void>;
  onSendDirectMessage: (userId: string, messageText: string, subject: string) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  onUpdateRole,
  onSendDirectMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Direct Message Modal
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<UserModel | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Helper to extract timestamp for sorting
  const getTimestamp = (u: UserModel): number => {
    if (!u.createdAt) return 0;
    if (typeof u.createdAt === 'object') {
      if (typeof u.createdAt.toDate === 'function') return u.createdAt.toDate().getTime();
      if (u.createdAt.seconds) return u.createdAt.seconds * 1000;
    }
    const t = new Date(u.createdAt).getTime();
    return isNaN(t) ? 0 : t;
  };

  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter((u) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = 
          !query ||
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.id && u.id.toLowerCase().includes(query)) ||
          (u.grade && u.grade.toLowerCase().includes(query));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return getTimestamp(b) - getTimestamp(a);
        }
        if (sortBy === 'oldest') {
          return getTimestamp(a) - getTimestamp(b);
        }
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '', 'ar');
        }
        return 0;
      });
  }, [users, searchQuery, roleFilter, sortBy]);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const studentCount = users.filter(u => u.role === 'student').length;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForMessage || !messageContent.trim()) return;

    setIsSending(true);
    try {
      await onSendDirectMessage(
        selectedUserForMessage.id, 
        messageContent.trim(), 
        messageSubject.trim() || 'رسالة من إدارة اختبارات اليمن'
      );
      alert('تم إرسال الرسالة بنجاح إلى حساب الطالب');
      setSelectedUserForMessage(null);
      setMessageSubject('');
      setMessageContent('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال الرسالة');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Calm SaaS Header Card */}
      <div className="calm-panel p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>إدارة الحسابات والصلاحيات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            دليل الطلاب والمستخدمين
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            استعراض حسابات الطلاب المسجلين بالمنصة، إدارة الصلاحيات الإدارية، إرسال رسائل وتنبيهات مباشرة، وترتيب الطلاب حسب الأحدث انضماماً.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[110px]">
            <span className="block text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatEnNumber(users.length)}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الحسابات</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 px-5 py-3.5 rounded-2xl border border-blue-200/70 dark:border-blue-800/50 text-center min-w-[110px]">
            <span className="block text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatEnNumber(studentCount)}
            </span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">الطلاب</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 px-5 py-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-800/50 text-center min-w-[110px]">
            <span className="block text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatEnNumber(adminCount)}
            </span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">مشرف إداري</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="calm-panel p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، البريد، أو الصف الدراسي..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Filters & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل ({formatEnNumber(users.length)})
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === 'student'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الطلاب ({formatEnNumber(studentCount)})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              المشرفين ({formatEnNumber(adminCount)})
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="dark:bg-slate-900">الأحدث انضماماً أولاً (جديد)</option>
              <option value="oldest" className="dark:bg-slate-900">الأقدم انضماماً أولاً</option>
              <option value="name" className="dark:bg-slate-900">أبجدياً (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>عرض {formatEnNumber(filteredAndSortedUsers.length)} من أصل {formatEnNumber(users.length)} حساب</span>
        {sortBy === 'newest' && <span className="font-semibold text-blue-600 dark:text-blue-400">مرتب حسب الأحدث انضماماً</span>}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAndSortedUsers.map((u) => {
          const isAdmin = u.role === 'admin';
          const joinDateFormatted = formatFirestoreDate(u.createdAt);
          const studentGrade = u.grade || u.gradeLevel;

          return (
            <div
              key={u.id}
              className={`calm-panel p-5 flex flex-col justify-between transition-all hover:shadow-md min-w-0 ${
                isAdmin 
                  ? 'border-amber-300 dark:border-amber-700/60 bg-gradient-to-b from-amber-50/20 to-transparent' 
                  : 'hover:border-blue-400/60 dark:hover:border-blue-600/60'
              }`}
            >
              <div className="space-y-4 min-w-0">
                {/* User Top Row: Avatar, Name, Email, Role */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-base shadow-sm ${
                        isAdmin
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/60'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                      }`}
                    >
                      {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 
                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                        title={u.name || 'بدون اسم'}
                      >
                        {u.name || 'مستخدم مسجل'}
                      </h3>
                      <p 
                        className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5"
                        title={u.email}
                      >
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0 ${
                      isAdmin
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isAdmin ? 'مشرف إداري' : 'طالب'}
                  </span>
                </div>

                {/* Details Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  {/* Join Date (Newest first) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>تاريخ الانضمام:</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
                      {joinDateFormatted}
                    </span>
                  </div>

                  {/* Grade */}
                  {studentGrade && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                        <span>الصف الدراسي:</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={studentGrade}>
                        {studentGrade}
                      </span>
                    </div>
                  )}

                  {/* Governorate */}
                  {u.governorate && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>المحافظة:</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {u.governorate}
                      </span>
                    </div>
                  )}

                  {/* ID */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">المعرّف:</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {u.id.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedUserForMessage(u);
                    setMessageSubject(`إشعار بخصوص حسابك في نظام اختبارات اليمن`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/50 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-bold transition-colors inline-flex items-center gap-1.5 flex-1 justify-center border border-slate-200 dark:border-slate-700"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>مراسلة</span>
                </button>

                {isAdmin ? (
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من تخفيض رتبة "${u.name}" إلى طالب عادي؟`)) {
                        onUpdateRole(u.id, 'student');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-400 text-xs font-bold transition-colors inline-flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
                    title="تخفيض إلى طالب"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>تخفيض لمستخدم</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirm(`هل تريد ترقية "${u.name}" إلى مشرف إداري للنظام؟`)) {
                        onUpdateRole(u.id, 'admin');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 dark:text-amber-400 text-xs font-bold transition-colors inline-flex items-center gap-1 border border-amber-200 dark:border-amber-900/50"
                    title="ترقية إلى مشرف"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>ترقية لمشرف</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="calm-panel p-12 text-center max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">لا يوجد مستخدمون مطابقون</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تأكد من كتابة الاسم أو البريد بشكل صحيح أو تغيير معيار التصفية.
          </p>
        </div>
      )}

      {/* Direct Message Modal */}
      {selectedUserForMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="calm-panel p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">إرسال رسالة مباشرة للطالب</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    المستلم: {selectedUserForMessage.name} ({selectedUserForMessage.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForMessage(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان الرسالة / الموضوع
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  required
                  placeholder="مثال: تنبيه هام بخصوص موعد الاختبار التجريبي"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نص الرسالة
                </label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  required
                  placeholder="اكتب رسالتك للطالب هنا..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForMessage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50"
                >
                  {isSending ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
