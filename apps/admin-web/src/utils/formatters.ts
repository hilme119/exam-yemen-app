// Data normalization and English formatting helpers

export const toEnDigits = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '0';
  const str = String(val);
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return str.replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d).toString());
};

export const formatEnNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const formatted = new Intl.NumberFormat('en-US', { useGrouping: true }).format(num);
  return toEnDigits(formatted);
};

export const formatFirestoreDate = (val: any): string => {
  if (!val) return '—';
  try {
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') {
        const d = val.toDate();
        return toEnDigits(d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      }
      if (val.seconds) {
        const d = new Date(val.seconds * 1000);
        return toEnDigits(d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      }
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return toEnDigits(d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    }
  } catch (e) {
    // fallback
  }
  return '—';
};

export const normalizeGrade = (g: string | undefined | null, gradeName?: string): string => {
  if (!g) return '';
  const str = ((g || '') + ' ' + (gradeName || '')).toLowerCase();
  
  // English section must be separated first so it is not swallowed by 'ثانوي' or 'ثالث' or 'grade12'!
  if (g === '1773260017709' || str.includes('انجليزي') || str.includes('إنجليزي') || str.includes('english')) {
    if (str.includes('ثانوي') || str.includes('ثالث') || str.includes('grade12') || g === '1773260017709') {
      return 'grade12_english';
    }
  }

  // 9th Grade
  if (g === '1773261178965' || str.includes('grade9') || str.includes('تاسع') || str.includes('أساسي')) {
    return 'grade9';
  }

  // 3rd Secondary (Standard Arabic)
  if (g === '1773261239805' || str.includes('grade12') || str.includes('ثانوي') || str.includes('ثالث')) {
    return 'grade12';
  }

  return g;
};

export const getGradeDisplayName = (
  gradeId: string | undefined | null,
  grades: { id: string; name: string }[] = []
): string => {
  if (!gradeId) return 'عام';

  // 1. Direct ID match
  const direct = grades.find(g => g.id === gradeId);
  if (direct) return direct.name;

  // 2. Normalized match
  const norm = normalizeGrade(gradeId);
  if (norm === 'grade12_english') {
    const found = grades.find(g => g.id === '1773260017709' || g.name.includes('انجليزي') || g.name.includes('إنجليزي'));
    return found ? found.name : 'ثالث ثانوي قسم إنجليزي';
  }
  if (norm === 'grade9') {
    const found = grades.find(g => g.id === '1773261178965' || g.name.includes('تاسع') || g.name.includes('أساسي'));
    return found ? found.name : 'الصف التاسع الأساسي';
  }
  if (norm === 'grade12') {
    // Specifically NOT the English section
    const found = grades.find(g => (g.id === '1773261239805' || g.name.includes('ثانوي') || g.name.includes('ثالث')) && !g.name.includes('انجليزي') && !g.name.includes('إنجليزي'));
    return found ? found.name : 'الثالث الثانوي';
  }

  return gradeId;
};

export const normalizeStream = (s: string | undefined | null): string => {
  if (!s) return '';
  const lower = s.trim().toLowerCase();
  if (lower === 'عملي' || lower === 'علمي' || lower === 'scientific' || lower === 'science') return 'scientific';
  if (lower === 'أدبي' || lower === 'ادبي' || lower === 'literary') return 'literary';
  if (lower === 'انجليزي' || lower === 'إنجليزي' || lower === 'english') return 'english';
  if (lower === 'عام' || lower === 'general') return 'general';
  return lower;
};

export const getStreamDisplayName = (streamVal?: string | null): string => {
  if (!streamVal) return 'عام / مشترك';
  const norm = normalizeStream(streamVal);
  if (norm === 'scientific') return 'القسم العلمي';
  if (norm === 'literary') return 'القسم الأدبي';
  if (norm === 'english') return 'القسم الإنجليزي';
  return streamVal;
};

export const isSubjectMatchingGradeAndStream = (
  subjectGrade: string | undefined | null,
  subjectStream: string | undefined | null,
  selectedGradeId: string | null,
  selectedStreamVal: string | null,
  gradeName?: string
): boolean => {
  if (!selectedGradeId || selectedGradeId === 'all') return true;

  // Grade matching (either direct ID equality or normalized equality)
  const normSubjectGrade = normalizeGrade(subjectGrade);
  const normSelectedGrade = normalizeGrade(selectedGradeId, gradeName);
  const gradeMatches = subjectGrade === selectedGradeId || 
                       (normSubjectGrade && normSubjectGrade === normSelectedGrade) ||
                       (gradeName && subjectGrade === gradeName);

  if (!gradeMatches) return false;

  // Stream matching
  if (!selectedStreamVal || selectedStreamVal === 'all') {
    return true;
  }

  const targetStream = normalizeStream(selectedStreamVal);
  const normSubStream = normalizeStream(subjectStream);

  if (!normSubStream || normSubStream === 'general' || normSubStream === 'عام') {
    return true; // Common subject for all streams in this grade
  }

  return normSubStream === targetStream;
};

