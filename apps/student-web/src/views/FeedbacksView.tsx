import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Volume2,
  Sparkles,
  HelpCircle,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { QuestionFeedbackModel, StudentUser } from '../types';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  Timestamp,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL
} from '../services/firebase';
import { toEnDigits, formatTimer } from '../utils/numberFormatter';

interface FeedbacksViewProps {
  currentUser: StudentUser | null;
  onOpenAuth: () => void;
  onGoHome: () => void;
  prefilledQuestion?: {
    examId: string;
    examName: string;
    questionId: string;
    questionNumber: number;
    questionText: string;
  } | null;
}

export const FeedbacksView: React.FC<FeedbacksViewProps> = ({
  currentUser,
  onOpenAuth,
  onGoHome,
  prefilledQuestion,
}) => {
  const [feedbacks, setFeedbacks] = useState<QuestionFeedbackModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(!!prefilledQuestion);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Form State
  const [noteText, setNoteText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [currentUser]);

  useEffect(() => {
    if (prefilledQuestion) {
      setIsModalOpen(true);
    }
  }, [prefilledQuestion]);

  const fetchFeedbacks = async () => {
    if (!currentUser || currentUser.isGuest) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'question_feedbacks'),
        where('userId', '==', currentUser.id)
      );
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt || Date.now())
      })) as QuestionFeedbackModel[];

      // Sort newest first
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      setFeedbacks(list);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Image selection handler
  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Audio Recording Handlers
  const startRecording = async () => {
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
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('تعذر الوصول إلى الميكروفون. يرجى منح الإذن من إعدادات المتصفح.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelAudio = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!noteText.trim() && !imageFile && !audioBlob) {
      alert('يرجى كتابة نص الملاحظة أو إرفاق صورة أو تسجيل صوتي');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = '';
      let uploadedAudioUrl = '';

      const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Upload image if selected
      if (imageFile) {
        const imgRef = storageRef(storage, `feedbacks/${feedbackId}_image_${imageFile.name}`);
        const snap = await uploadBytes(imgRef, imageFile);
        uploadedImageUrl = await getDownloadURL(snap.ref);
      }

      // Upload audio if recorded
      if (audioBlob) {
        const audRef = storageRef(storage, `feedbacks/${feedbackId}_voice.webm`);
        const snap = await uploadBytes(audRef, audioBlob);
        uploadedAudioUrl = await getDownloadURL(snap.ref);
      }

      const feedbackDoc: QuestionFeedbackModel = {
        id: feedbackId,
        userId: currentUser.id,
        userName: currentUser.name || 'طالب',
        examId: prefilledQuestion?.examId || 'general',
        examName: prefilledQuestion?.examName || 'ملاحظة عامة',
        questionId: prefilledQuestion?.questionId || 'general',
        questionNumber: prefilledQuestion?.questionNumber || 0,
        questionText: prefilledQuestion?.questionText || '',
        note: noteText.trim(),
        imageUrl: uploadedImageUrl,
        audioUrl: uploadedAudioUrl,
        createdAt: Timestamp.now(),
        status: 'pending',
        isReadByAdmin: false,
        isReadByStudent: true,
      };

      await setDoc(doc(db, 'question_feedbacks', feedbackId), feedbackDoc);

      // Reset form
      setNoteText('');
      setImageFile(null);
      setImagePreview(null);
      setAudioBlob(null);
      setAudioPreviewUrl(null);
      setIsModalOpen(false);

      // Refresh list
      fetchFeedbacks();
      alert('تم إرسال ملاحظتك بنجاح، وستتم مراجعتها من قبل الإدارة قريباً.');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (statusFilter === 'pending') return fb.status === 'pending';
    if (statusFilter === 'resolved') return fb.status === 'resolved';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">ملاحظاتي واعتراضاتي</h1>
            <p className="text-xs text-slate-400">
              أرسل استفساراتك واعتراضاتك على الأسئلة وتلقى الردود المباشرة من إدارة المنظمة
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!currentUser || currentUser.isGuest) {
              onOpenAuth();
            } else {
              setIsModalOpen(true);
            }
          }}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>إرسال ملاحظة جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          الكل ({toEnDigits(feedbacks.length)})
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'resolved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          تم الرد ({toEnDigits(feedbacks.filter((f) => f.status === 'resolved').length)})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          قيد المراجعة ({toEnDigits(feedbacks.filter((f) => f.status === 'pending').length)})
        </button>
      </div>

      {/* Feedbacks List */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري استرجاع ملاحظاتك...</span>
        </div>
      ) : !currentUser || currentUser.isGuest ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-soft max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800">سجل الدخول لعرض ملاحظاتك</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            سجل الدخول بحسابك لمتابعة ردود المعلمين والإدارة على استفساراتك واعتراضاتك السابقة.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            تسجيل الدخول الآن
          </button>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft max-w-md mx-auto">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-800">لا توجد ملاحظات مرسلة بعد</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            يمكنك إرسال أي استفسار أو اعتراض على سؤال وزاري مع إرفاق صورة أو رسالة صوتية.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            إرسال ملاحظة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((fb) => {
            const dateStr =
              fb.createdAt instanceof Date
                ? fb.createdAt.toLocaleDateString('ar-YE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'مؤخراً';

            const isResolved = fb.status === 'resolved';

            return (
              <div
                key={fb.id}
                className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-soft space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم الرد والاعتماد</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>قيد مراجعة الإدارة</span>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">{dateStr}</span>
                  </div>

                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {fb.examName}
                  </span>
                </div>

                {/* If related to specific question */}
                {fb.questionText && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-500 block mb-1">
                      السؤال رقم ({toEnDigits(fb.questionNumber)}):
                    </span>
                    <p className="line-clamp-2">{fb.questionText}</p>
                  </div>
                )}

                {/* Student Note */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">ملاحظتك:</span>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">{fb.note}</p>
                </div>

                {/* Attached Image & Audio */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {fb.imageUrl && (
                    <button
                      onClick={() => setPreviewImageUrl(fb.imageUrl!)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>عرض الصورة المرفقة</span>
                    </button>
                  )}

                  {fb.audioUrl && (
                    <div className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <audio src={fb.audioUrl} controls className="h-7 w-48" />
                    </div>
                  )}
                </div>

                {/* Admin Reply Box */}
                {isResolved && fb.adminReply && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-black text-emerald-800 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>رد المعلم / إدارة المنصة:</span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-emerald-950 leading-relaxed">
                      {fb.adminReply}
                    </p>

                    {/* Admin attachments if any */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {fb.adminReplyImageUrl && (
                        <button
                          onClick={() => setPreviewImageUrl(fb.adminReplyImageUrl!)}
                          className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>صورة توضيحية من الإدارة</span>
                        </button>
                      )}
                      {fb.adminReplyAudioUrl && (
                        <div className="flex items-center gap-2 p-1 pr-2 rounded-xl bg-white border border-emerald-300">
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <audio src={fb.adminReplyAudioUrl} controls className="h-7 w-44" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">إرسال ملاحظة أو اعتراض جديد</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {prefilledQuestion && (
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 font-medium">
                <span className="font-bold block mb-0.5">
                  بخصوص: {prefilledQuestion.examName} (سؤال {toEnDigits(prefilledQuestion.questionNumber)})
                </span>
                <p className="line-clamp-2 text-slate-600">{prefilledQuestion.questionText}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  تفاصيل الملاحظة أو الاعتراض:
                </label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="اكتب ملاحظتك بالتفصيل هنا..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Attachments Actions (Image & Voice) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Image input */}
                  <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>إرفاق صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectImage}
                      className="hidden"
                    />
                  </label>

                  {/* Voice recording button */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <Mic className="w-4 h-4 text-rose-500" />
                      <span>تسجيل صوتي</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2 animate-pulse"
                    >
                      <Square className="w-4 h-4" />
                      <span>إيقاف التسجيل ({toEnDigits(recordingSeconds)}ث)</span>
                    </button>
                  )}
                </div>

                {/* Image Preview if selected */}
                {imagePreview && (
                  <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="h-20 w-auto object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Audio Preview if recorded */}
                {audioPreviewUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-2xl bg-blue-50 border border-blue-200">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <audio src={audioPreviewUrl} controls className="h-7 w-48" />
                    <button
                      type="button"
                      onClick={cancelAudio}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>إرسال الملاحظة الآن</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={previewImageUrl}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
          />
        </div>
      )}
    </div>
  );
};
