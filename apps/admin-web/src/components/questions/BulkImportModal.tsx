import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  Download, 
  FileText, 
  Trash2, 
  Check, 
  Info,
  KeyRound,
  Filter,
  ArrowRight,
  Maximize2,
  HelpCircle,
  Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionType } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
  examTitle?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  examTitle,
}) => {
  const [step, setStep] = useState<'upload' | 'verify'>('upload');
  const [activeTab, setActiveTab] = useState<'excel' | 'yemen_exam' | 'json'>('excel');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Verification & Studio Filters
  const [filterType, setFilterType] = useState<'all' | 'trueFalse' | 'mcq' | 'unanswered'>('all');
  const [answerKeyInput, setAnswerKeyInput] = useState('');
  const [showAnswerKeyBar, setShowAnswerKeyBar] = useState(false);

  if (!isOpen) return null;

  // 1. Download sample Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'رقم السؤال': 1,
        'نوع السؤال': 'صح أو خطأ',
        'نص السؤال': 'وصف الله تعالى القرآن بالحكيم في بداية سورة لقمان',
        'الخيار 1': 'صح',
        'الخيار 2': 'خطأ',
        'الخيار 3': '',
        'الخيار 4': '',
        'الإجابة الصحيحة (1-4)': 1,
        'التعليل والتوضيح': '',
      },
      {
        'رقم السؤال': 17,
        'نوع السؤال': 'اختيار من متعدد',
        'نص السؤال': 'قال تعالى: (كَأَنَّ فِي أُذُنَيْهِ وَقْرًا فَبَشِّرْهُ بِعَذَاب...) ختام الآية:',
        'الخيار 1': 'واقع',
        'الخيار 2': 'أليم',
        'الخيار 3': 'السعير',
        'الخيار 4': 'عظيم',
        'الإجابة الصحيحة (1-4)': 2,
        'التعليل والتوضيح': 'في سورة لقمان: فبشره بعذاب أليم',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب_الأسئلة_الوزارية');
    XLSX.writeFile(wb, 'قالب_استيراد_النماذج_الوزارية.xlsx');
  };

  // Helper to normalize questions with strict zero-padded ID and order
  const normalizeQuestions = (list: any[]): Question[] => {
    return list.map((item, idx) => {
      const qNum = item.questionNumber || item.order || (idx + 1);
      const isTF = item.type === 'trueFalse' || (item.options && item.options.length === 2 && (item.options[0] === 'صح' || item.options[1] === 'خطأ'));
      
      let rawOptions: string[] = item.options || [];
      if (isTF && rawOptions.length === 0) {
        rawOptions = ['صح', 'خطأ'];
      }
      if (!isTF && rawOptions.length < 4) {
        while (rawOptions.length < 4) rawOptions.push(`خيار ${rawOptions.length + 1}`);
      }

      return {
        id: `q_${String(qNum).padStart(3, '0')}`,
        text: String(item.text || item.question || '').trim(),
        type: (isTF ? 'trueFalse' : 'mcq') as QuestionType,
        options: rawOptions,
        correctAnswerIndex: typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : 0,
        explanation: item.explanation || item.note || '',
      };
    });
  };

  // 2. Handle Excel / CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          let list: any[] = [];
          if (Array.isArray(json)) {
            list = json;
          } else if (json.questions) {
            list = json.questions;
          } else {
            // Might be a multi-model dict like {"P.53": [...], "P.25": [...]}
            const firstKey = Object.keys(json)[0];
            if (Array.isArray(json[firstKey])) {
              list = json[firstKey];
            }
          }
          const formatted = normalizeQuestions(list);
          setParsedQuestions(formatted);
          setStep('verify');
        } catch {
          setErrorMsg('فشل في قراءة ملف JSON، يرجى التأكد من صحة التنسيق.');
        }
      };
      reader.readAsText(file);
    } else {
      // Excel / CSV
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

          if (!rows || rows.length === 0) {
            setErrorMsg('الملف فارغ أو لا يحتوي على صفوف صالحة.');
            return;
          }

          const extracted: Question[] = rows.map((r, idx) => {
            const qNum = r['رقم السؤال'] || r['الرقم'] || r['#'] || (idx + 1);
            const questionText = r['نص السؤال'] || r['السؤال'] || r['Question'] || r['text'] || '';
            const opt1 = String(r['الخيار 1'] || r['الخيار الأول (أ)'] || r['الخيار أ'] || r['أ'] || r['A'] || '');
            const opt2 = String(r['الخيار 2'] || r['الخيار الثاني (ب)'] || r['الخيار ب'] || r['ب'] || r['B'] || '');
            const opt3 = String(r['الخيار 3'] || r['الخيار الثالث (ج)'] || r['الخيار ج'] || r['ج'] || r['C'] || '');
            const opt4 = String(r['الخيار 4'] || r['الخيار الرابع (د)'] || r['الخيار د'] || r['د'] || r['D'] || '');

            const correctRaw = r['الإجابة الصحيحة (1-4)'] || r['رقم الإجابة الصحيحة (1-4)'] || r['الإجابة'] || 1;
            let correctIdx = 0;
            if (typeof correctRaw === 'number') {
              correctIdx = Math.max(0, Math.min(3, correctRaw - 1));
            } else if (typeof correctRaw === 'string') {
              const t = correctRaw.trim();
              if (t === '1' || t === 'أ' || t === 'A' || t === 'صح' || t === 'ص') correctIdx = 0;
              else if (t === '2' || t === 'ب' || t === 'B' || t === 'خطأ' || t === 'خ') correctIdx = 1;
              else if (t === '3' || t === 'ج' || t === 'C') correctIdx = 2;
              else if (t === '4' || t === 'د' || t === 'D') correctIdx = 3;
            }

            const rawOptions = [opt1, opt2, opt3, opt4].filter(o => o.trim() !== '');
            const typeRaw = r['نوع السؤال'] || '';
            const isTF = typeRaw.includes('صح') || (rawOptions.length === 2 && (rawOptions[0] === 'صح' || rawOptions[1] === 'خطأ'));

            return {
              id: `q_${String(qNum).padStart(3, '0')}`,
              text: String(questionText).trim(),
              type: (isTF ? 'trueFalse' : 'mcq') as QuestionType,
              options: isTF ? ['صح', 'خطأ'] : (rawOptions.length > 0 ? rawOptions : ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4']),
              correctAnswerIndex: correctIdx,
              explanation: r['التعليل والتوضيح'] || r['التعليل'] || '',
            };
          }).filter(q => q.text.length > 0);

          setParsedQuestions(extracted);
          setStep('verify');
        } catch (err) {
          console.error(err);
          setErrorMsg('تعذر تحليل ملف الإكسل. يرجى استخدام القالب المعتمد.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // 3. Smart Yemeni Ministerial Exam Text Parser (Directly pastes PDF text)
  const handleParseYemeniExamText = () => {
    if (!rawText.trim()) return;
    setErrorMsg('');
    setIsProcessing(true);

    try {
      const clean = (t: string) => {
        return t
          .replace(/\xa0/g, ' ')
          .replace(/[ْٔ]/g, '')
          .replace(/َّم/g, 'ّ')
          .replace(/ِِر/g, 'ر')
          .replace(/ϼ/g, 'لا')
          .replace(/ဃَّم\s*َ?/g, 'الله')
          .replace(/هللا/g, 'الله')
          .replace(/أال/g, 'الأ')
          .replace(/إال/g, 'الإ')
          .replace(/آال/g, 'الآ')
          .replace(/أْٔا/g, 'أ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const questions: Question[] = [];

      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        const matchNum = line.match(/^(\d{1,2})$/);

        if (matchNum) {
          const qNum = parseInt(matchNum[1], 10);
          if (i + 1 < lines.length) {
            i++;
            const qTextRaw = lines[i];

            if (qNum <= 16 || qTextRaw.includes('( )') || qTextRaw.includes('.( )') || qTextRaw.includes('( )')) {
              let cleanQ = qTextRaw.replace(/^\.\s*\(\s*\)\s*/, '').replace(/^\(\s*\)\s*/, '');
              cleanQ = clean(cleanQ);

              questions.push({
                id: `q_${String(qNum).padStart(3, '0')}`,
                text: cleanQ,
                type: 'trueFalse',
                options: ['صح', 'خطأ'],
                correctAnswerIndex: 0,
                explanation: '',
              });
            } else {
              // MCQ
              const cleanQ = clean(qTextRaw);
              let options: string[] = [];

              if (i + 1 < lines.length) {
                i++;
                const optLine = lines[i];
                // Split by 1, 2, 3, 4
                const optMatches = optLine.split(/(?=[1234][^\d])/);
                const rawOpts = optMatches
                  .map(o => clean(o.replace(/^[1234]\s*/, '')))
                  .filter(Boolean);

                if (rawOpts.length >= 2) {
                  options = rawOpts.slice(0, 4);
                } else {
                  options = [clean(optLine), 'خيار 2', 'خيار 3', 'خيار 4'];
                }
              }

              while (options.length < 4) {
                options.push(`خيار ${options.length + 1}`);
              }

              questions.push({
                id: `q_${String(qNum).padStart(3, '0')}`,
                text: cleanQ,
                type: 'mcq',
                options,
                correctAnswerIndex: 0,
                explanation: '',
              });
            }
          }
        }
        i++;
      }

      if (questions.length === 0) {
        setErrorMsg('لم يتم العثور على أرقام أسئلة صريحة (1..50). تأكد من نسخ نص صفحات النموذج الوزاري كاملاً.');
      } else {
        // Sort strictly by question number
        questions.sort((a, b) => {
          const numA = parseInt(a.id.replace('q_', ''), 10) || 0;
          const numB = parseInt(b.id.replace('q_', ''), 10) || 0;
          return numA - numB;
        });
        setParsedQuestions(questions);
        setStep('verify');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('حدث خطأ أثناء تحليل نص النموذج الوزاري.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply Bulk Answer Key (e.g. "ص ص ص خ خ 2 1 3 4...")
  const handleApplyAnswerKey = () => {
    if (!answerKeyInput.trim()) return;
    
    // Split key by spaces, commas, or dashes
    const keys = answerKeyInput
      .replace(/[،,]/g, ' ')
      .split(/\s+/)
      .map(k => k.trim())
      .filter(Boolean);

    if (keys.length === 0) return;

    setParsedQuestions(prev => {
      return prev.map((q, idx) => {
        if (idx < keys.length) {
          const k = keys[idx];
          let cIdx = q.correctAnswerIndex;
          if (q.type === 'trueFalse') {
            if (k === 'ص' || k === 'صح' || k === '1' || k.toLowerCase() === 't') cIdx = 0;
            else if (k === 'خ' || k === 'خطأ' || k === '2' || k.toLowerCase() === 'f') cIdx = 1;
          } else {
            if (k === '1' || k === 'أ' || k.toUpperCase() === 'A') cIdx = 0;
            else if (k === '2' || k === 'ب' || k.toUpperCase() === 'B') cIdx = 1;
            else if (k === '3' || k === 'ج' || k.toUpperCase() === 'C') cIdx = 2;
            else if (k === '4' || k === 'د' || k.toUpperCase() === 'D') cIdx = 3;
          }
          return { ...q, correctAnswerIndex: cIdx };
        }
        return q;
      });
    });

    setAnswerKeyInput('');
    setShowAnswerKeyBar(false);
  };

  // In-place edits
  const handleToggleCorrectOption = (qIdx: number, optIdx: number) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], correctAnswerIndex: optIdx };
      return copy;
    });
  };

  const handleUpdateQuestionText = (qIdx: number, newText: string) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], text: newText };
      return copy;
    });
  };

  const handleUpdateOptionText = (qIdx: number, optIdx: number, newOpt: string) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = newOpt;
      copy[qIdx] = { ...copy[qIdx], options: newOpts };
      return copy;
    });
  };

  const handleRemoveQuestion = (qIdx: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== qIdx));
  };

  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) return;
    onImport(parsedQuestions);
    onClose();
  };

  // Filter questions for review
  const filteredQuestions = parsedQuestions.filter(q => {
    if (filterType === 'trueFalse') return q.type === 'trueFalse';
    if (filterType === 'mcq') return q.type === 'mcq';
    return true;
  });

  const trueFalseCount = parsedQuestions.filter(q => q.type === 'trueFalse').length;
  const mcqCount = parsedQuestions.filter(q => q.type === 'mcq').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div className={`bg-white rounded-3xl border border-slate-200 w-full transition-all flex flex-col overflow-hidden shadow-2xl ${
        step === 'verify' ? 'max-w-6xl h-[95vh]' : 'max-w-4xl max-h-[92vh]'
      }`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{step === 'verify' ? 'استوديو تدقيق ومراجعة النموذج' : 'استيراد الأسئلة الذكي للنموذج'}</span>
                {step === 'verify' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                    جاهز للمقارنة ({parsedQuestions.length} سؤال بالترتيب)
                  </span>
                )}
              </h3>
              {examTitle && <p className="text-xs text-blue-700 font-semibold mt-0.5">{examTitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'verify' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لرفع ملف آخر</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: UPLOAD / PASTE VIEW */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex items-center border-b border-slate-200 px-6 pt-3 gap-2 bg-slate-50/40">
              <button
                onClick={() => { setActiveTab('excel'); setErrorMsg(''); }}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'excel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ملف إكسل / CSV</span>
              </button>

              <button
                onClick={() => { setActiveTab('yemen_exam'); setErrorMsg(''); }}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'yemen_exam' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>نص النموذج الوزاري (نسخ مباشر من الـ PDF)</span>
              </button>

              <button
                onClick={() => { setActiveTab('json'); setErrorMsg(''); }}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'json' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileJson className="w-4 h-4" />
                <span>ملف JSON</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Excel Tab */}
              {activeTab === 'excel' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-900">قالب النماذج الوزارية المعتمد</h4>
                        <p className="text-[11px] text-blue-700 mt-0.5">حمّل قالب Excel المجهز بالترتيب الكامل للأسئلة وخياراتها</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل قالب Excel جاهز</span>
                    </button>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/20 group">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 group-hover:border-blue-300 group-hover:scale-105 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-all shadow-xs mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">اختر ملف الإكسل المستخرج للنموذج أو اسحبه إلى هنا</span>
                    <span className="text-xs text-slate-400 mt-1 font-mono">يدعم .xlsx و .xls و .csv</span>
                    {fileName && (
                      <span className="mt-3 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                        📄 {fileName}
                      </span>
                    )}
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Yemeni Exam Text Tab */}
              {activeTab === 'yemen_exam' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      المحلل الذكي للنماذج الوزارية (اليمن):
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      انسخ نص النموذج مباشرة من ملف الـ PDF والصقه هنا. يقوم النظام تلقائياً بفصل أسئلة الصح والخطأ (1..16) وأسئلة الاختيارات (17..50) مع ترقيمها الصارم تمهيداً لتدقيقها وتحديد الإجابات الصحيحة في الخطوة التالية.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={10}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="انسخ نص صفحات النموذج من ملف الـ PDF والصقه هنا مباشرة..."
                      className="calm-input w-full p-4 text-xs text-slate-900 font-sans leading-relaxed"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleParseYemeniExamText}
                    disabled={isProcessing || !rawText.trim()}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>تحليل وفك النموذج بالترتيب الكامل (#1 إلى #50)</span>
                  </button>
                </div>
              )}

              {/* JSON Tab */}
              {activeTab === 'json' && (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/20 group">
                    <FileJson className="w-12 h-12 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                    <span className="text-sm font-bold text-slate-800">اختر ملف JSON للأسئلة</span>
                    <span className="text-xs text-slate-400 mt-1 font-mono">يدعم الملف المستخرج extracted_models_quran.json</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: FULLSCREEN VERIFICATION & INSPECTION STUDIO */}
        {step === 'verify' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Studio Control & Filter Bar */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الأسئلة ({parsedQuestions.length})
                </button>
                <button
                  onClick={() => setFilterType('trueFalse')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === 'trueFalse' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  صح / خطأ ({trueFalseCount})
                </button>
                <button
                  onClick={() => setFilterType('mcq')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === 'mcq' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  اختيارات ({mcqCount})
                </button>
              </div>

              {/* Bulk Answer Key Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnswerKeyBar(!showAnswerKeyBar)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>تطبيق مفتاح الإجابات دفعة واحدة</span>
                </button>
              </div>
            </div>

            {/* Expandable Answer Key Quick Bar */}
            {showAnswerKeyBar && (
              <div className="p-4 bg-amber-50/90 border-b border-amber-200 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
                <div className="flex-1 w-full">
                  <span className="text-xs font-bold text-amber-900 block mb-1">
                    الصق سلسلة الإجابات الصحيحة مفصولة بمسافات (مثال: ص ص ص خ 1 2 2 3 4...):
                  </span>
                  <input
                    type="text"
                    value={answerKeyInput}
                    onChange={(e) => setAnswerKeyInput(e.target.value)}
                    placeholder="ص ص ص خ ص خ ص ص خ 1 2 3 2 4 1..."
                    className="calm-input w-full py-1.5 text-xs font-mono"
                  />
                </div>
                <button
                  onClick={handleApplyAnswerKey}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0"
                >
                  تطبيق فوري للإجابات
                </button>
              </div>
            )}

            {/* Quick Jump Ribbon */}
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">انتقال سريع:</span>
              {parsedQuestions.map((q, idx) => {
                const qNum = idx + 1;
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      const el = document.getElementById(`q_card_${idx}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold font-mono shrink-0 transition-all ${
                      q.correctAnswerIndex !== undefined
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-300'
                    }`}
                    title={`سؤال #${qNum}`}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>

            {/* Questions List (Strict Chronological Order 1..50) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {filteredQuestions.map((q, idx) => {
                const actualIndex = parsedQuestions.findIndex(item => item.id === q.id);
                const qNum = actualIndex + 1;

                return (
                  <div
                    key={q.id || actualIndex}
                    id={`q_card_${actualIndex}`}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 transition-all hover:border-blue-300"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black font-mono flex items-center justify-center text-sm shadow-xs">
                          #{qNum}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          q.type === 'trueFalse' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {q.type === 'trueFalse' ? 'صح / خطأ' : 'اختيار من متعدد'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {q.id}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(actualIndex)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف هذا السؤال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question Text Editor Input */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500">نص السؤال:</span>
                      <textarea
                        rows={2}
                        value={q.text}
                        onChange={(e) => handleUpdateQuestionText(actualIndex, e.target.value)}
                        className="calm-input w-full p-2.5 text-xs font-semibold text-slate-900 resize-none leading-relaxed"
                      />
                    </div>

                    {/* Interactive Options - Click to Set Correct Answer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          الخيارات (انقر على أي خيار لتعيينه كإجابة صحيحة باللون الأخضر):
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ✓ الإجابة المحددة حالياً: الخيار رقم ({q.correctAnswerIndex + 1})
                        </span>
                      </div>

                      <div className={`grid gap-2 ${q.type === 'trueFalse' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.correctAnswerIndex;
                          const label = q.type === 'trueFalse' ? (oIdx === 0 ? 'صح' : 'خطأ') : `(${oIdx + 1})`;

                          return (
                            <div
                              key={oIdx}
                              onClick={() => handleToggleCorrectOption(actualIndex, oIdx)}
                              className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {isCorrect ? '✓' : label}
                              </div>

                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateOptionText(actualIndex, oIdx, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent border-0 text-xs font-medium w-full focus:outline-hidden"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {parsedQuestions.length > 0 ? (
                <>إجمالي الأسئلة المستخرجة: <strong className="text-blue-700 font-mono text-sm">{parsedQuestions.length}</strong> سؤال مرتب بالتسلسل الوزاري الصارم.</>
              ) : (
                'اختر ملفاً أو الصق نص صفحات النموذج'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              إلغاء
            </button>

            {step === 'verify' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedQuestions.length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وحفظ النموذج في السحابة ({parsedQuestions.length} سؤال)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
