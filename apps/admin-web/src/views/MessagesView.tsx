import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  Search, 
  Sparkles, 
  CheckCheck, 
  Trash2,
  Mail,
  ShieldCheck,
  Image as ImageIcon,
  Mic,
  Square,
  Volume2,
  ZoomIn,
  X,
  Upload
} from 'lucide-react';
import { db, collection, doc, updateDoc, deleteDoc, onSnapshot } from '../services/firebase';
import { SupportMessage, UserModel } from '../types';
import { uploadMediaFile } from '../services/uploadService';

interface MessagesViewProps {
  users?: UserModel[];
}

export const MessagesView: React.FC<MessagesViewProps> = ({ users = [] }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'replied'>('all');
  const [isSending, setIsSending] = useState(false);

  // Attachments State
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyAudio, setReplyAudio] = useState<Blob | File | null>(null);
  const [replyAudioPreview, setReplyAudioPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Image zoom modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const items: SupportMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        const matchedUser = users.find(u => u.id === data.userId);
        const resolvedName = data.userName || data.studentName || matchedUser?.name || (data.userId ? `طالب (${data.userId.slice(0, 6)})` : 'طالب المنصة');
        return {
          id: d.id,
          userId: data.userId || d.id,
          userName: resolvedName,
          userEmail: data.userEmail || data.studentEmail || matchedUser?.email || '',
          studentName: resolvedName,
          studentEmail: data.userEmail || data.studentEmail || matchedUser?.email || '',
          subject: data.subject || 'استفسار طالب',
          message: data.message || '',
          imageUrl: data.imageUrl,
          audioUrl: data.audioUrl,
          adminReply: data.adminReply,
          adminReplyImageUrl: data.adminReplyImageUrl,
          adminReplyAudioUrl: data.adminReplyAudioUrl,
          isRead: data.isRead ?? false,
          createdAt: data.createdAt || new Date(),
          repliedAt: data.repliedAt,
        };
      });

      // Sort newest first
      items.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return tB - tA;
      });

      setMessages(items);
      if (items.length > 0 && !activeMessageId) {
        setActiveMessageId(items[0].id);
      }
    }, (err) => console.warn('Messages Firestore sync:', err));

    return () => unsub();
  }, [activeMessageId, users]);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setReplyAudio(audioBlob);
        setReplyAudioPreview(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('يرجى منح الإذن للوصول إلى الميكروفون لبدء التسجيل الصوتي.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const name = m.userName || m.studentName || '';
    const email = m.userEmail || m.studentEmail || '';
    const msg = m.message || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'unread') return matchesSearch && !m.isRead;
    if (filterType === 'replied') return matchesSearch && !!m.adminReply;
    return matchesSearch;
  });

  const activeMsg = messages.find((m) => m.id === activeMessageId);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !replyImage && !replyAudio) || !activeMsg) return;

    setIsSending(true);
    try {
      let replyImageUrl: string | undefined;
      let replyAudioUrl: string | undefined;

      if (replyImage) {
        replyImageUrl = await uploadMediaFile(replyImage, replyImage.name);
      }

      if (replyAudio) {
        const audioName = replyAudio instanceof File ? replyAudio.name : `admin_msg_voice_${Date.now()}.webm`;
        replyAudioUrl = await uploadMediaFile(replyAudio, audioName);
      }

      const updateData: any = {
        adminReply: replyText.trim() || 'تم استلام رسالتك ومعالجتها.',
        repliedAt: new Date(),
        isRead: true,
        isReadByStudent: false,
      };

      if (replyImageUrl) updateData.adminReplyImageUrl = replyImageUrl;
      if (replyAudioUrl) updateData.adminReplyAudioUrl = replyAudioUrl;

      await updateDoc(doc(db, 'messages', activeMsg.id), updateData);
      
      setReplyText('');
      setReplyImage(null);
      setReplyAudio(null);
      setReplyAudioPreview(null);
    } catch (err) {
      console.error('Error replying to message:', err);
      alert('حدث خطأ أثناء إرسال الرد');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm('هل تريد حذف هذه المحادثة نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'messages', msgId));
        if (activeMessageId === msgId) {
          setActiveMessageId(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-teal-950/40 via-slate-900/80 to-cyan-950/40 border border-teal-500/20 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>مركز الدعم والتواصل الحي مع الطلاب</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              رسائل ومحادثات الطلاب المباشرة
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              استقبال استفسارات الطلاب وأسئلتهم، ومعاينة الصور والتسجيلات الصوتية المرفقة، والرد الفوري عليها كتابياً وبصوت أو صورة مباشرة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="block text-2xl font-black text-white font-mono">{messages.length}</span>
              <span className="text-xs text-slate-400">إجمالي الرسائل</span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center">
              <span className="block text-2xl font-black text-amber-400 font-mono">{unreadCount}</span>
              <span className="text-xs text-slate-400">غير مقروء</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="luxury-glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Messages List Sidebar (5 cols) */}
        <div className="lg:col-span-5 border-l border-white/10 p-5 flex flex-col space-y-4 bg-slate-950/40">
          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الرسائل أو أسماء الطلاب..."
                className="luxury-input w-full pr-10 pl-3 py-2.5 text-xs placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'all' ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الكل ({messages.length})
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'unread' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                غير مقروء ({unreadCount})
              </button>
              <button
                onClick={() => setFilterType('replied')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'replied' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                مجاب عليها
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
            {filteredMessages.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                لا توجد رسائل مطابقة للبحث أو الفلتر
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isSelected = activeMessageId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveMessageId(m.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500/40 text-white shadow-lg'
                        : 'bg-slate-900/50 border-white/5 hover:border-white/10 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-teal-400">
                          {((m.userName || m.studentName || 'ط')[0]).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {m.userName || m.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {m.userEmail || m.studentEmail || 'طالب'}
                          </span>
                        </div>
                      </div>

                      {!m.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {m.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <span>{m.subject || 'استفسار عام'}</span>
                        {m.imageUrl && <span>📸</span>}
                        {m.audioUrl && <span>🎙️</span>}
                      </span>
                      {m.adminReply && (
                        <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" />
                          تم الرد
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation Thread & Reply Panel (7 cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-6 bg-slate-950/20">
          {activeMsg ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-base">
                    {((activeMsg.userName || activeMsg.studentName || 'ط')[0]).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {activeMsg.userName || activeMsg.studentName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {activeMsg.userEmail || activeMsg.studentEmail} • {activeMsg.subject}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMessage(activeMsg.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="حذف المحادثة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] p-2">
                {/* Student message bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tr-none bg-slate-900 border border-white/10 text-slate-200 text-sm max-w-lg leading-relaxed shadow-md space-y-2">
                    <p>{activeMsg.message}</p>

                    {/* Student Image */}
                    {activeMsg.imageUrl && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] text-teal-400 block mb-1 font-bold">📸 صورة مرفقة:</span>
                        <div 
                          onClick={() => setPreviewImageUrl(activeMsg.imageUrl!)}
                          className="relative cursor-pointer group rounded-xl overflow-hidden border border-white/20 w-44 h-28 bg-slate-800"
                        >
                          <img 
                            src={activeMsg.imageUrl} 
                            alt="مرفق الطالب" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            <ZoomIn className="w-4 h-4 ml-1" />
                            <span>تكبير</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Student Audio */}
                    {activeMsg.audioUrl && (
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        <span className="text-[10px] text-teal-400 flex items-center gap-1 font-bold">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>تسجيل صوتي من الطالب:</span>
                        </span>
                        <audio controls src={activeMsg.audioUrl} className="w-full h-8 rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Reply bubble if exists */}
                {activeMsg.adminReply && (
                  <div className="flex items-start justify-end gap-3">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-gradient-to-l from-teal-900/60 to-emerald-900/60 border border-teal-500/30 text-white text-sm max-w-lg leading-relaxed shadow-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-teal-300 font-bold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>رد إدارة المنظومة:</span>
                      </div>
                      <p>{activeMsg.adminReply}</p>

                      {/* Admin Attached Image */}
                      {activeMsg.adminReplyImageUrl && (
                        <div className="pt-2 border-t border-teal-500/30">
                          <span className="text-[10px] text-teal-200 block mb-1 font-bold">📸 صورة توضيحية من الإدارة:</span>
                          <div 
                            onClick={() => setPreviewImageUrl(activeMsg.adminReplyImageUrl!)}
                            className="relative cursor-pointer group rounded-xl overflow-hidden border border-white/20 w-44 h-28 bg-slate-800"
                          >
                            <img 
                              src={activeMsg.adminReplyImageUrl} 
                              alt="صورة الإدارة" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                              <ZoomIn className="w-4 h-4 ml-1" />
                              <span>تكبير</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Attached Audio */}
                      {activeMsg.adminReplyAudioUrl && (
                        <div className="pt-2 border-t border-teal-500/30 space-y-1">
                          <span className="text-[10px] text-teal-200 flex items-center gap-1 font-bold">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>تسجيل صوتي من الإدارة:</span>
                          </span>
                          <audio controls src={activeMsg.adminReplyAudioUrl} className="w-full h-8 rounded-lg" />
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 text-xs font-bold border border-teal-500/30">
                      EY
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-white/10 space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك المباشر للطالب هنا..."
                    className="luxury-input w-full p-4 text-xs resize-none"
                  />
                </div>

                {/* Media Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Photo picker */}
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white cursor-pointer text-xs font-bold transition-colors">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>{replyImage ? 'تغيير الصورة' : 'إرفاق صورة'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setReplyImage(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {replyImage && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs">
                      <span className="truncate max-w-[120px]">{replyImage.name}</span>
                      <button type="button" onClick={() => setReplyImage(null)} className="text-rose-400 hover:text-rose-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Mic Recorder */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-emerald-400 cursor-pointer text-xs font-bold transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تسجيل صوتي</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white animate-pulse text-xs font-bold shadow-lg"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>إيقاف ({recordingSeconds} ث)</span>
                    </button>
                  )}

                  {/* Audio File Upload */}
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white cursor-pointer text-xs font-bold transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>رفع ملف صوتي</span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setReplyAudio(file);
                          setReplyAudioPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>

                  {/* Audio preview player */}
                  {replyAudioPreview && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-teal-500/30 rounded-xl">
                      <audio controls src={replyAudioPreview} className="h-7 w-44" />
                      <button
                        type="button"
                        onClick={() => {
                          setReplyAudio(null);
                          setReplyAudioPreview(null);
                        }}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    سيصل هذا الرد ومرفقاته فوراً إلى تطبيق الطالب على الموبايل.
                  </span>

                  <button
                    type="submit"
                    disabled={isSending || isRecording}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>إرسال الرد والمرفقات</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-32 text-center text-slate-500 text-sm">
              اختر محادثة من القائمة لعرض تفاصيلها والرد عليها
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="معاينة الصورة" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
