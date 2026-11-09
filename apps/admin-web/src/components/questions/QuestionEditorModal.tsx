import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Eye, 
  CheckCircle2, 
  Sigma,
  Smartphone,
  Type,
  Trash2,
  Check
} from 'lucide-react';
import { Question, QuestionType } from '../../types';
import { MathRenderer } from '../common/MathRenderer';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  initialQuestion?: Question | null;
  examTitle?: string;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion,
  examTitle,
}) => {
  const [text, setText] = useState('');
  const [type, setType] = useState<QuestionType>('mcq');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [optionsImageUrls, setOptionsImageUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [optionsFonts, setOptionsFonts] = useState<(string | null)[]>([null, null, null, null]);
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState('');

  useEffect(() => {
    if (initialQuestion) {
      setText(initialQuestion.text || '');
      setType(initialQuestion.type || 'mcq');
      setOptions(initialQuestion.options && initialQuestion.options.length ? [...initialQuestion.options] : ['', '', '', '']);
      setOptionsImageUrls(initialQuestion.optionsImageUrls || [null, null, null, null]);
      setOptionsFonts(initialQuestion.optionsFontFamilies || [null, null, null, null]);
      setFontFamily(initialQuestion.fontFamily || null);
      setCorrectAnswerIndex(initialQuestion.correctAnswerIndex ?? 0);
      setExplanation(initialQuestion.explanation || '');
      setQuestionImageUrl(initialQuestion.questionImageUrl || '');
    } else {
      setText('');
      setType('mcq');
      setOptions(['', '', '', '']);
      setOptionsImageUrls([null, null, null, null]);
      setOptionsFonts([null, null, null, null]);
      setFontFamily(null);
      setCorrectAnswerIndex(0);
      setExplanation('');
      setQuestionImageUrl('');
    }
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleOptionImageChange = (idx: number, val: string) => {
    const updated = [...optionsImageUrls];
    updated[idx] = val.trim() ? val.trim() : null;
    setOptionsImageUrls(updated);
  };

  const handleOptionFontChange = (idx: number, val: string | null) => {
    const updated = [...optionsFonts];
    updated[idx] = val;
    setOptionsFonts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const actualOptions = type === 'trueFalse' ? ['صح', 'خطأ'] : options;

    const questionToSave: Question = {
      id: initialQuestion ? initialQuestion.id : 'q_' + Date.now(),
      text: text.trim(),
      type,
      options: actualOptions,
      optionsImageUrls: type === 'trueFalse' ? undefined : optionsImageUrls,
      optionsFontFamilies: type === 'trueFalse' ? undefined : optionsFonts,
      fontFamily: fontFamily || undefined,
      correctAnswerIndex,
      explanation: explanation.trim() || undefined,
      questionImageUrl: questionImageUrl.trim() || undefined,
    };

    onSave(questionToSave);
    onClose();
  };

  const insertMath = (snippet: string) => {
    setText((prev) => prev + ' ' + snippet + ' ');
  };

  const activeOptions = type === 'trueFalse' ? ['صح', 'خطأ'] : options;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
      <div className="bg-white relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialQuestion ? 'تعديل بيانات السؤال' : 'محرر الأسئلة الوزارية الذكي'}
              </h3>
              {examTitle && (
                <p className="text-xs text-blue-600 font-semibold">{examTitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Screen */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
          {/* Form Editor (Right / Main) */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Question Type Selection */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">نوع السؤال الوزاري:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('mcq');
                    setCorrectAnswerIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'mcq'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  اختيار من متعدد (4 خيارات)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('trueFalse');
                    setCorrectAnswerIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'trueFalse'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  صح وخطأ (خياران)
                </button>
              </div>
            </div>

            {/* Question Text & Math Shortcuts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  نص السؤال (يدعم صيغ KaTeX الرياضية):
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xs">
                  <span className="text-[11px] text-slate-400">إدراج معادلة:</span>
                  <button
                    type="button"
                    onClick={() => insertMath('$\\frac{a}{b}$')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 text-[11px] font-mono border border-slate-200"
                  >
                    كسر
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMath('$\\sqrt{x}$')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 text-[11px] font-mono border border-slate-200"
                  >
                    جذر
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMath('$x^2$')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 text-[11px] font-mono border border-slate-200"
                  >
                    أس
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMath('$\\int_{a}^{b} f(x) dx$')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 text-[11px] font-mono border border-slate-200"
                  >
                    تكامل
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب نص السؤال هنا... يمكن كتابة صيغ رياضية محاطة بعلامة الدولار مثل $x^2 + 5 = 0$"
                className={`calm-input w-full p-3.5 text-xs text-slate-900 resize-none ${
                  fontFamily === 'Aldhabi' ? 'font-aldhabi text-xl leading-relaxed' : 'font-medium'
                }`}
                required
              />
            </div>

            {/* Question Image & Font Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  رابط صورة السؤال (اختياري)
                </label>
                <input
                  type="url"
                  value={questionImageUrl}
                  onChange={(e) => setQuestionImageUrl(e.target.value)}
                  placeholder="https://.../question-chart.png"
                  className="calm-input w-full px-3.5 py-2 text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-600" />
                  الخط المخصص للسؤال
                </label>
                <select
                  value={fontFamily || ''}
                  onChange={(e) => setFontFamily(e.target.value || null)}
                  className="calm-input w-full px-3.5 py-2 text-xs text-slate-900 font-medium"
                >
                  <option value="">خط القاهرة الافتراضي (Cairo)</option>
                  <option value="Aldhabi">خط ديواني (Amiri / Aldhabi)</option>
                </select>
              </div>
            </div>

            {/* Options List with Correct Answer Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                خيارات الإجابة (انقر على الحرف لتحديد الإجابة الصحيحة):
              </label>

              {type === 'trueFalse' ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {[0, 1].map((idx) => {
                    const label = idx === 0 ? 'صح' : 'خطأ';
                    const isCorrect = correctAnswerIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setCorrectAnswerIndex(idx)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-800' : 'text-slate-800'}`}>{label}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isCorrect
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isCorrect && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[0, 1, 2, 3].map((idx) => {
                    const isCorrect = correctAnswerIndex === idx;
                    const letters = ['أ', 'ب', 'ج', 'د'];
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setCorrectAnswerIndex(idx)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border font-bold text-xs shrink-0 transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'
                            }`}
                            title="تحديد كإجابة صحيحة"
                          >
                            {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : letters[idx]}
                          </button>

                          <input
                            type="text"
                            value={options[idx] || ''}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`نص الخيار (${letters[idx]})...`}
                            className={`calm-input flex-1 px-3 py-1.5 text-xs text-slate-900 ${
                              optionsFonts[idx] === 'Aldhabi' ? 'font-aldhabi text-lg' : ''
                            }`}
                            required
                          />

                          <select
                            value={optionsFonts[idx] || ''}
                            onChange={(e) => handleOptionFontChange(idx, e.target.value || null)}
                            className="calm-input px-2 py-1.5 text-[11px] text-slate-700 w-24 shrink-0 font-medium"
                          >
                            <option value="">عادي</option>
                            <option value="Aldhabi">ديواني</option>
                          </select>
                        </div>

                        {/* Optional image for this option */}
                        <div className="pr-9">
                          <input
                            type="url"
                            value={optionsImageUrls[idx] || ''}
                            onChange={(e) => handleOptionImageChange(idx, e.target.value)}
                            placeholder={`رابط صورة توضيحية للخيار (${letters[idx]}) - اختياري`}
                            className="calm-input w-full px-2.5 py-1 text-[11px] font-mono text-slate-600"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                التعليل / توضيح طريقة الحل للطلاب بعد انتهاء الاختبار (اختياري):
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="اشرح للطالب لماذا هذا الخيار هو الصحيح وكيف تم الوصول إليه..."
                className="calm-input w-full p-2.5 text-xs text-slate-900 resize-none font-medium"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ السؤال في النموذج</span>
              </button>
            </div>
          </form>

          {/* Live Mobile Simulator Preview (Left Side) */}
          <div className="w-full lg:w-[360px] p-6 bg-slate-50/80 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>معاينة حية في تطبيق الطالب</span>
            </div>

            <div className="mobile-simulator-frame p-4 flex flex-col justify-between text-right bg-white">
              {/* Mobile Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-slate-100">
                <span>09:41</span>
                <span>اختبار اليمن الذكي</span>
                <span>100% 🔋</span>
              </div>

              {/* Mobile Question Card */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>سؤال تجريبي #1</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">درجة واحدة</span>
                </div>

                <div className={`text-slate-900 text-sm leading-relaxed ${fontFamily === 'Aldhabi' ? 'font-aldhabi text-xl' : 'font-medium'}`}>
                  {text ? <MathRenderer content={text} /> : <span className="text-slate-400 italic">اكتب نص السؤال لتظهر المعاينة هنا...</span>}
                </div>

                {questionImageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={questionImageUrl} alt="Question preview" className="w-full h-24 object-contain" />
                  </div>
                )}

                {/* Simulated Options */}
                <div className="space-y-1.5 pt-1">
                  {activeOptions.map((opt, i) => {
                    const isCorrect = correctAnswerIndex === i;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {i + 1}
                          </span>
                          <span className={optionsFonts[i] === 'Aldhabi' ? 'font-aldhabi text-base' : ''}>
                            {opt || `خيار ${i + 1}`}
                          </span>
                        </div>
                        {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                      </div>
                    );
                  })}
                </div>

                {explanation && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                    <span className="font-bold block">💡 التعليل النموذجي:</span>
                    <p className="text-amber-900">{explanation}</p>
                  </div>
                )}
              </div>

              {/* Mobile Bottom Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button type="button" className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">
                  التالي
                </button>
                <span className="text-slate-400">1 من 50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
