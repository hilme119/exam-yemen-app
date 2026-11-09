import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Smartphone, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  History,
  Trash2,
  Radio
} from 'lucide-react';
import { db, collection, setDoc, doc, onSnapshot, deleteDoc, orderBy, query } from '../services/firebase';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  topic: string;
  timestamp: any;
}

export const NotificationsView: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<string>('all_students');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [notificationsHistory, setNotificationsHistory] = useState<NotificationLog[]>([]);

  // Listen to notifications collection in Firestore
  useEffect(() => {
    const q = query(collection(db, 'notifications'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(d => ({
        id: d.id,
        title: d.data().title || '',
        body: d.data().body || '',
        topic: d.data().topic || 'all_students',
        timestamp: d.data().timestamp || new Date(),
      }));
      // Sort newest first
      logs.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
      setNotificationsHistory(logs);
    }, (err) => console.warn('Notifications sync:', err));

    return () => unsubscribe();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    try {
      const notifId = 'notif_' + Date.now();
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        title: title.trim(),
        body: body.trim(),
        topic: targetAudience,
        timestamp: new Date(),
      });

      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
      setTitle('');
      setBody('');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('حدث خطأ أثناء إرسال الإشعار إلى Firebase');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('هل تريد حذف هذا الإشعار من السجل؟')) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getTopicLabel = (topic: string) => {
    switch (topic) {
      case 'all_students': return 'جميع الطلاب';
      case 'scientific': return 'الثالث الثانوي (علمي)';
      case 'literary': return 'الثالث الثانوي (أدبي)';
      case 'grade9': return 'الصف التاسع الأساسي';
      default: return topic;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-rose-950/30 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>خدمة البث والتنبيهات المباشرة (FCM Push)</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              مركز الإشعارات والتنبيهات الفورية
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              إرسال إشعارات فورية تصل إلى شاشات هواتف جميع الطلاب المسجلين بالمنظومة في عموم المحافظات لتنبيههم بالنماذج الجديدة أو النتائج.
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bell className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column: 7 Cols */}
        <div className="lg:col-span-7 luxury-glass-panel rounded-3xl p-6 md:p-8 space-y-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Send className="w-5 h-5 text-amber-400" />
              <span>إنشاء وبث إشعار جماعي</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              FCM Cloud Ready
            </span>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-5">
            {/* Target Audience */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">الفئة المستهدفة من الطلاب:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { id: 'all_students', label: 'جميع الطلاب' },
                  { id: 'scientific', label: 'ثالث ثانوي علمي' },
                  { id: 'literary', label: 'ثالث ثانوي أدبي' },
                  { id: 'grade9', label: 'الصف التاسع' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      targetAudience === aud.id
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">عنوان الإشعار (يظهر كعنوان رئيسي بالهاتف):</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تم رفع نماذج مادة الفيزياء لعام 2024!"
                className="luxury-input w-full px-4 py-3 text-sm font-semibold"
                required
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نص وتفاصيل الإشعار:</label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب الرسالة التي ستصل للطلاب، مثل: بإمكانكم الآن خوض الاختبار المؤتمت والتمرن على الأسئلة الوزارية وحساب نسبتكم فوراً..."
                className="luxury-input w-full p-4 text-sm resize-none"
                required
              />
            </div>

            {sentSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم إرسال وحفظ الإشعار بنجاح في Firebase وسيبدأ بالظهور لهواتف الطلاب!</span>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>بث الإشعار الفوري الآن</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column: 5 Cols */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Smartphone className="w-4 h-4" />
            <span>معاينة حية لشاشة قفل هاتف الطالب</span>
          </div>

          <div className="w-full max-w-sm rounded-[36px] border-4 border-slate-700 bg-slate-950 p-4 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-2">
              <span>09:41</span>
              <div className="w-16 h-4 bg-slate-800 rounded-full mx-auto" />
              <span>Yemen 4G</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                    EY
                  </div>
                  <span className="text-xs font-bold text-white">اختبارات اليمن</span>
                </div>
                <span className="text-[10px] text-slate-400">الآن</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  {title || 'عنوان الإشعار يظهر هنا...'}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                  {body || 'نص الرسالة والتفاصيل تظهر هنا على شاشة قفل هاتف الطالب فور البث.'}
                </p>
              </div>
            </div>

            <div className="text-center pt-8">
              <span className="text-3xl font-light text-slate-200">09:41</span>
              <p className="text-[11px] text-slate-500">الثلاثاء، 3 نوفمبر</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications History Table */}
      <div className="luxury-glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">سجل الإشعارات المرسلة سابقاً ({notificationsHistory.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">عنوان الإشعار</th>
                <th className="px-5 py-3">نص الرسالة</th>
                <th className="px-5 py-3 text-center">الفئة المستهدفة</th>
                <th className="px-5 py-3 text-center">تاريخ الإرسال</th>
                <th className="px-5 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {notificationsHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-xs">
                    لم يتم بث أي إشعارات سابقة حتى الآن
                  </td>
                </tr>
              ) : (
                notificationsHistory.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white max-w-[200px] truncate">
                      {n.title}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300 max-w-sm truncate">
                      {n.body}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {getTopicLabel(n.topic)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-slate-400 font-mono">
                      {n.timestamp?.seconds 
                        ? new Date(n.timestamp.seconds * 1000).toLocaleDateString('ar-YE') 
                        : 'اليوم'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteLog(n.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
