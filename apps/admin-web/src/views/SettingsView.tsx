import React, { useState } from 'react';
import { 
  Settings, 
  Smartphone, 
  Download, 
  AlertTriangle, 
  Sparkles, 
  Save, 
  Check, 
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsViewProps {
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
}) => {
  const [latestVersion, setLatestVersion] = useState(config.latestVersion || '1.0.0');
  const [downloadUrl, setDownloadUrl] = useState(
    config.downloadUrl || 'https://play.google.com/store/apps/details?id=com.examyemen.app'
  );
  const [releaseNotes, setReleaseNotes] = useState(
    config.releaseNotes || 'تحسينات في سرعة استعراض النماذج الوزارية وإصلاحات عامة'
  );
  const [forceUpdate, setForceUpdate] = useState(config.forceUpdate ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig({
        latestVersion: latestVersion.trim(),
        downloadUrl: downloadUrl.trim(),
        releaseNotes: releaseNotes.trim(),
        forceUpdate,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>إدارة إصدارات تطبيق الموبايل</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              إعدادات التطبيق والتحديث الإجباري
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              تتحكم هذه الشاشة مباشرة في الوثيقة <code className="text-cyan-400 font-mono">settings/app_config</code> في فايربيس لإشعار مستخدمي التطبيق بالتحديثات الجديدة أو فرض التحديث الإجباري عند إطلاق نماذج جديدة.
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Smartphone className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="luxury-glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
          {/* Latest Version & Download URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                رقم أحدث إصدار معتمد (latestVersion):
              </label>
              <input
                type="text"
                value={latestVersion}
                onChange={(e) => setLatestVersion(e.target.value)}
                required
                placeholder="1.0.0"
                className="luxury-input w-full px-4 py-3 text-sm font-mono"
                dir="ltr"
              />
              <span className="text-[11px] text-slate-500">
                عندما يفتح الطالب إصداراً أقل من هذا الرقم، سيظهر له تنبيه التحديث.
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                رابط تنزيل التحديث (downloadUrl):
              </label>
              <input
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                required
                placeholder="https://play.google.com/..."
                className="luxury-input w-full px-4 py-3 text-sm font-mono"
                dir="ltr"
              />
              <span className="text-[11px] text-slate-500">
                رابط متجر Google Play أو الرابط المباشر لملف الـ APK.
              </span>
            </div>
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              ملاحظات التحديث والمميزات الجديدة (releaseNotes):
            </label>
            <textarea
              rows={4}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="اكتب ما تم إضافته في هذا التحديث ليظهر للطلاب في نافذة التحديث..."
              className="luxury-input w-full p-4 text-sm resize-none"
            />
          </div>

          {/* Force Update Toggle */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                forceUpdate ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">فرض التحديث الإجباري (forceUpdate)</h4>
                <p className="text-xs text-slate-400">
                  إذا تم تفعيله، لن يتمكن الطالب من استخدام التطبيق القديم حتى يضغط على زر التحديث.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={forceUpdate}
                onChange={(e) => setForceUpdate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                تم حفظ التكوين في Firestore بنجاح!
              </span>
            ) : <div />}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>حفظ الإعدادات في فايربيس</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
