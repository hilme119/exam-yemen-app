import React, { useState, useRef } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  MessageSquare, 
  Clock, 
  Search, 
  Filter,
  Send,
  Star,
  Sparkles,
  ChevronDown,
  Check,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  Volume2,
  ZoomIn,
  X,
  Upload,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide
} from 'lucide-react';
import { QuestionFeedback, UserModel } from '../types';
import { MathRenderer } from '../components/common/MathRenderer';
import { db, doc, updateDoc } from '../services/firebase';
import { formatFirestoreDate, formatEnNumber, toEnDigits } from '../utils/formatters';
import { uploadMediaFile } from '../services/uploadService';

interface FeedbacksViewProps {
  feedbacks: QuestionFeedback[];
  users?: UserModel[];
  onResolveFeedback: (
    feedbackId: string, 
    replyMessage?: string, 
    replyImageUrl?: string, 
    replyAudioUrl?: string
  ) => void;
  onRejectFeedback: (feedbackId: string) => void;
  onEditQuestion: (questionId: string) => void;
}

export const FeedbacksView: React.FC<FeedbacksViewProps> = ({
  feedbacks,
  users = [],
  onResolveFeedback,
  onRejectFeedback,
  onEditQuestion,
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'resolved' | 'starred' | 'all'>('pending');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);

  // Attachments State
  const [replyImageMap, setReplyImageMap] = useState<Record<string, File | null>>({});
  const [replyAudioMap, setReplyAudioMap] = useState<Record<string, Blob | File | null>>({});
  const [replyAudioPreviewMap, setReplyAudioPreviewMap] = useState<Record<string, string | null>>({});
  const [isRecordingMap, setIsRecordingMap] = useState<Record<string, boolean>>({});
  const [recordingSecondsMap, setRecordingSecondsMap] = useState<Record<string, number>>({});
  const [isUploadingMap, setIsUploadingMap] = useState<Record<string, boolean>>({});
  
  // Full-screen image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const toggleStar = async (fb: QuestionFeedback) => {
    const newStar = !fb.isStarred;
    try {
      await updateDoc(doc(db, 'question_feedbacks', fb.id), { isStarred: newStar });
    } catch (e) {
      console.error('Error toggling star:', e);
    }
  };

  const cannedReplies = [
    'تم مراجعة السؤال وتصحيح الإجابة في بنك الأسئلة فوراً. شكراً لملاحظتك القيمة!',
    'السؤال سليم علمياً ومطابق للمنهج والكتاب المدرسي الوزاري المعتمد.',
    'تم تحديث نص السؤال والخيارات لتكون أكثر وضوحاً ودقة. بالتوفيق لك دائماً.',
  ];

  // Voice recording handlers
  const startRecording = async (fbId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setReplyAudioMap(prev => ({ ...prev, [fbId]: audioBlob }));
        setReplyAudioPreviewMap(prev => ({ ...prev, [fbId]: audioUrl }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingMap(prev => ({ ...prev, [fbId]: true }));
      setRecordingSecondsMap(prev => ({ ...prev, [fbId]: 0 }));

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSecondsMap(prev => ({ ...prev, [fbId]: (prev[fbId] || 0) + 1 }));
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('يرجى منح الإذن للوصول إلى الميكروفون لبدء التسجيل الصوتي.');
    }
  };

  const stopRecording = (fbId: string) => {
    if (mediaRecorderRef.current && isRecordingMap[fbId]) {
      mediaRecorderRef.current.stop();
      setIsRecordingMap(prev => ({ ...prev, [fbId]: false }));
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioFileChange = (fbId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const audioUrl = URL.createObjectURL(file);
      setReplyAudioMap(prev => ({ ...prev, [fbId]: file }));
      setReplyAudioPreviewMap(prev => ({ ...prev, [fbId]: audioUrl }));
    }
  };

  const handleImageFileChange = (fbId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReplyImageMap(prev => ({ ...prev, [fbId]: file }));
    }
  };

  const handleSendReply = async (fbId: string) => {
    const text = replyTextMap[fbId]?.trim() || 'تمت المراجعة والتأكد من السؤال بنجاح.';
    setIsUploadingMap(prev => ({ ...prev, [fbId]: true }));

    try {
      let replyImageUrl: string | undefined;
      let replyAudioUrl: string | undefined;

      const attachedImage = replyImageMap[fbId];
      if (attachedImage) {
        replyImageUrl = await uploadMediaFile(attachedImage, attachedImage.name);
      }

      const attachedAudio = replyAudioMap[fbId];
      if (attachedAudio) {
        const audioName = attachedAudio instanceof File ? attachedAudio.name : `admin_voice_${Date.now()}.webm`;
        replyAudioUrl = await uploadMediaFile(attachedAudio, audioName);
      }

      onResolveFeedback(fbId, text, replyImageUrl, replyAudioUrl);
      setExpandedReplyId(null);
      // Clean up local attachments
      setReplyImageMap(prev => ({ ...prev, [fbId]: null }));
      setReplyAudioMap(prev => ({ ...prev, [fbId]: null }));
      setReplyAudioPreviewMap(prev => ({ ...prev, [fbId]: null }));
    } catch (err) {
      console.error('Error sending reply with media:', err);
      alert('حدث خطأ أثناء رفع المرفقات وإرسال الرد');
    } finally {
      setIsUploadingMap(prev => ({ ...prev, [fbId]: false }));
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const student = f.userName || f.studentName || '';
    const exam = f.examName || f.examTitle || '';
    const note = f.note || f.userComment || f.message || '';
    const qText = f.questionText || '';
    const subject = f.subjectName || '';

    const matchesSearch = 
      student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.toLowerCase().includes(searchQuery.toLowerCase());

    const isPending = f.status === 'pending' || (!f.status && !f.isReadByAdmin);
    const isResolved = f.status === 'resolved' || (f.status !== 'rejected' && f.isReadByAdmin && !isPending);

    if (filterStatus === 'pending') return matchesSearch && isPending;
    if (filterStatus === 'resolved') return matchesSearch && isResolved;
    if (filterStatus === 'starred') return matchesSearch && !!f.isStarred;
    return matchesSearch;
  });

  const getFeedbackTimestamp = (f: QuestionFeedback): number => {
    const c = f.createdAt;
    if (!c) return 0;
    if (typeof c === 'object') {
      if (typeof c.toDate === 'function') return c.toDate().getTime();
      if (c.seconds) return c.seconds * 1000;
    }
    const d = new Date(c);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    const tA = getFeedbackTimestamp(a);
    const tB = getFeedbackTimestamp(b);
    return sortOrder === 'newest' ? tB - tA : tA - tB;
  });

  const pendingCount = feedbacks.filter(f => f.status === 'pending' || (!f.status && !f.isReadByAdmin)).length;
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved' || (f.isReadByAdmin && f.status !== 'rejected' && f.status !== 'pending')).length;
  const starredCount = feedbacks.filter(f => f.isStarred).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="calm-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>مركز تدقيق الملاحظات وجودة الأسئلة الوزارية</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            صندوق ملاحظات واعتراضات الطلاب
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            مراجعة بلاغات الطلاب الحية الواردة من تطبيق الموبايل، والاطلاع على الصور والتسجيلات الصوتية المرفقة، والرد المباشر كتابياً وبصورة أو تسجيل صوتي لتصحيح النماذج لحظياً.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <span className="block text-2xl font-bold text-rose-600 font-mono">
              {formatEnNumber(pendingCount)}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">اعتراض قيد المراجعة</span>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <span className="block text-2xl font-bold text-emerald-600 font-mono">
              {formatEnNumber(resolvedCount)}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">تم الرد والتصحيح</span>
          </div>
        </div>
      </div>

      {/* Search & Status Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterStatus === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>قيد المراجعة ({formatEnNumber(pendingCount)})</span>
          </button>

          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterStatus === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تمت المراجعة ({formatEnNumber(resolvedCount)})</span>
          </button>

          <button
            onClick={() => setFilterStatus('starred')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterStatus === 'starred'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>المميزة بنجمة ({formatEnNumber(starredCount)})</span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>الكل ({formatEnNumber(feedbacks.length)})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* Sort Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
            <button
              onClick={() => setSortOrder('newest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial ${
                sortOrder === 'newest'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="ترتيب الملاحظات من الأحدث إلى الأقدم"
            >
              <ArrowDownWideNarrow className="w-3.5 h-3.5" />
              <span>الأحدث أولاً</span>
            </button>

            <button
              onClick={() => setSortOrder('oldest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial ${
                sortOrder === 'oldest'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="ترتيب الملاحظات من الأقدم إلى الأحدث"
            >
              <ArrowUpNarrowWide className="w-3.5 h-3.5" />
              <span>الأقدم أولاً</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الطالب، المادة، نص السؤال..."
              className="calm-input pr-10 text-xs w-full py-2.5"
            />
          </div>
        </div>
      </div>

      {/* Feedbacks Cards List */}
      <div className="space-y-4">
        {sortedFeedbacks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">لا توجد ملاحظات مطابقة للتصفية الحالية</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              صندوق الملاحظات نظيف ومكتمل. ستظهر أي بلاغات أو اعتراضات جديدة من الطلاب هنا فور إرسالها.
            </p>
          </div>
        ) : (
          sortedFeedbacks.map((fb) => {
            const isExpanded = expandedReplyId === fb.id;
            const isPending = fb.status === 'pending' || (!fb.status && !fb.isReadByAdmin);
            const isResolved = fb.status === 'resolved' || (fb.status !== 'rejected' && fb.isReadByAdmin && !isPending);
            const objectionText = fb.note || fb.userComment || fb.message || 'لا يوجد نص مرفق مع البلاغ';
            const studentName = fb.userName || fb.studentName || 'طالب المنصة';
            const dateStr = formatFirestoreDate(fb.createdAt);
            const isRecording = isRecordingMap[fb.id] || false;
            const recSeconds = recordingSecondsMap[fb.id] || 0;
            const audioPreview = replyAudioPreviewMap[fb.id];
            const attachedImg = replyImageMap[fb.id];
            const isUploading = isUploadingMap[fb.id] || false;

            return (
              <div 
                key={fb.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isPending 
                    ? 'bg-white border-rose-200/80 shadow-xs' 
                    : 'bg-white border-slate-200/80'
                }`}
              >
                {/* Card Top Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStar(fb)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        fb.isStarred ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'
                      }`}
                      title="تمييز بنجمة"
                    >
                      <Star className={`w-4 h-4 ${fb.isStarred ? 'fill-amber-400' : ''}`} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{studentName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">• {dateStr}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {fb.subjectName && (
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {fb.subjectName}
                          </span>
                        )}
                        {fb.examName && (
                          <span className="text-slate-600 font-medium">
                            • نموذج: <strong className="text-slate-800">{fb.examName}</strong>
                          </span>
                        )}
                        {fb.gradeName && (
                          <span className="text-slate-500 font-medium">
                            • الصف: <strong className="text-slate-700">{fb.gradeName}</strong>
                          </span>
                        )}
                        {fb.questionNumber !== undefined && (
                          <span className="text-slate-500 font-mono font-medium">
                            • سؤال رقم: #{toEnDigits(fb.questionNumber)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                    isPending
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isPending ? '⚠️ قيد المراجعة' : '✓ تم الرد والاعتماد'}
                  </span>
                </div>

                {/* Question & Objection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Question preview */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 block">نص السؤال المعترض عليه:</span>
                    <div className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {fb.questionText ? (
                        <MathRenderer content={fb.questionText} />
                      ) : (
                        <span className="text-slate-400 italic">انقر على زر "فتح محرر السؤال" بالأسفل لمعاينة السؤال بالكامل</span>
                      )}
                    </div>
                  </div>

                  {/* Student note & student attachments */}
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2.5">
                    <span className="text-[11px] font-bold text-rose-700 block">ملاحظة واعتراض الطالب:</span>
                    <p className="text-xs text-slate-900 leading-relaxed font-bold">
                      "{objectionText}"
                    </p>

                    {/* Student Attached Image (if present) */}
                    {fb.imageUrl && (
                      <div className="mt-2 pt-2 border-t border-rose-200/60">
                        <span className="text-[10px] font-bold text-rose-800 block mb-1">
                          📸 صورة مرفقة من الطالب:
                        </span>
                        <div 
                          onClick={() => setPreviewImageUrl(fb.imageUrl!)}
                          className="relative cursor-pointer group rounded-lg overflow-hidden border border-rose-300 w-36 h-24 bg-white"
                        >
                          <img 
                            src={fb.imageUrl} 
                            alt="مرفق الطالب" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            <ZoomIn className="w-4 h-4 ml-1" />
                            <span>تكبير</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Student Attached Voice Recording (if present) */}
                    {fb.audioUrl && (
                      <div className="mt-2 pt-2 border-t border-rose-200/60 space-y-1">
                        <span className="text-[10px] font-bold text-rose-800 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>تسجيل صوتي من الطالب:</span>
                        </span>
                        <audio 
                          controls 
                          src={fb.audioUrl} 
                          className="w-full h-8 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Reply Display (if already exists) */}
                {fb.adminReply && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                    <span className="font-bold block text-emerald-800">رد إدارة المنظومة المرسل للطالب:</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{fb.adminReply}</p>

                    {/* Admin Attached Reply Image */}
                    {fb.adminReplyImageUrl && (
                      <div className="mt-2 pt-2 border-t border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-800 block mb-1">
                          📸 صورة مرفقة من الإدارة:
                        </span>
                        <div 
                          onClick={() => setPreviewImageUrl(fb.adminReplyImageUrl!)}
                          className="relative cursor-pointer group rounded-lg overflow-hidden border border-emerald-300 w-36 h-24 bg-white"
                        >
                          <img 
                            src={fb.adminReplyImageUrl} 
                            alt="صورة رد الإدارة" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            <ZoomIn className="w-4 h-4 ml-1" />
                            <span>تكبير</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Attached Reply Audio */}
                    {fb.adminReplyAudioUrl && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تسجيل صوتي من الإدارة:</span>
                        </span>
                        <audio 
                          controls 
                          src={fb.adminReplyAudioUrl} 
                          className="w-full h-8 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Expandable Reply Box (With Voice Recording & Photo Attachment) */}
                {isExpanded && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">صياغة رد تفصيلي للطالب:</span>
                    
                    {/* Canned replies pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {cannedReplies.map((canned, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => setReplyTextMap(prev => ({ ...prev, [fb.id]: canned }))}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 text-[11px] font-medium transition-colors"
                        >
                          {canned.slice(0, 35)}...
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={replyTextMap[fb.id] || ''}
                      onChange={(e) => setReplyTextMap(prev => ({ ...prev, [fb.id]: e.target.value }))}
                      placeholder="اكتب ردك التوضيحي للطالب هنا..."
                      className="calm-input w-full p-2.5 text-xs font-medium"
                    />

                    {/* Media Attachments Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
                      {/* Attach Image Input */}
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer text-[11px] font-bold transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{attachedImg ? 'تغيير الصورة' : 'إرفاق صورة'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageFileChange(fb.id, e)}
                        />
                      </label>

                      {/* Attached Image Preview pill */}
                      {attachedImg && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px]">
                          <span className="truncate max-w-[120px]">{attachedImg.name}</span>
                          <button 
                            type="button"
                            onClick={() => setReplyImageMap(prev => ({ ...prev, [fb.id]: null }))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Voice Recording Controls */}
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={() => startRecording(fb.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-[11px] font-bold transition-colors"
                        >
                          <Mic className="w-3.5 h-3.5 text-emerald-600" />
                          <span>بدء تسجيل صوتي</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => stopRecording(fb.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white animate-pulse text-[11px] font-bold shadow-xs"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>إيقاف التسجيل ({recSeconds} ثانية)</span>
                        </button>
                      )}

                      {/* Attach Audio File Option */}
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer text-[11px] font-bold transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>رفع ملف صوتي</span>
                        <input 
                          type="file" 
                          accept="audio/*" 
                          className="hidden" 
                          onChange={(e) => handleAudioFileChange(fb.id, e)}
                        />
                      </label>

                      {/* Audio Player Preview */}
                      {audioPreview && (
                        <div className="flex items-center gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <audio controls src={audioPreview} className="h-7 w-48" />
                          <button
                            type="button"
                            onClick={() => {
                              setReplyAudioMap(prev => ({ ...prev, [fb.id]: null }));
                              setReplyAudioPreviewMap(prev => ({ ...prev, [fb.id]: null }));
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="حذف التسجيل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setExpandedReplyId(null)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-semibold"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleSendReply(fb.id)}
                        disabled={isUploading || isRecording}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        {isUploading ? (
                          <span>جاري رفع المرفقات والإرسال...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال الرد وتأكيد المعالجة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onEditQuestion(fb.questionId)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>فتح محرر السؤال وتعديله الآن</span>
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isPending && (
                      <>
                        <button
                          onClick={() => onRejectFeedback(fb.id)}
                          className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                        >
                          تجاهل (السؤال صحيح)
                        </button>

                        <button
                          onClick={() => setExpandedReplyId(isExpanded ? null : fb.id)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>كتابة رد للطالب</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        <button
                          onClick={() => onResolveFeedback(fb.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأكيد التصحيح</span>
                        </button>
                      </>
                    )}

                    {isResolved && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedReplyId(isExpanded ? null : fb.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>تعديل أو إرسال رد إضافي</span>
                        </button>
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تمت معالجة البلاغ</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fullscreen Image Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors z-10"
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
