// Normalization helpers for Student Web

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

export const normalizeStream = (s: string | undefined | null): string => {
  if (!s) return '';
  const lower = s.trim().toLowerCase();
  if (lower === 'عملي' || lower === 'علمي' || lower === 'scientific' || lower === 'science') return 'scientific';
  if (lower === 'أدبي' || lower === 'ادبي' || lower === 'literary') return 'literary';
  if (lower === 'انجليزي' || lower === 'إنجليزي' || lower === 'english') return 'english';
  if (lower === 'عام' || lower === 'general') return 'general';
  return lower;
};

export const getGradeDisplayName = (
  gradeId: string | undefined | null,
  grades: { id: string; name: string }[] = []
): string => {
  if (!gradeId) return 'عام';

  const direct = grades.find(g => g.id === gradeId);
  if (direct) return direct.name;

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
    const found = grades.find(g => (g.id === '1773261239805' || g.name.includes('ثانوي') || g.name.includes('ثالث')) && !g.name.includes('انجليزي') && !g.name.includes('إنجليزي'));
    return found ? found.name : 'الثالث الثانوي';
  }

  return gradeId;
};

export const getStreamDisplayName = (streamVal?: string | null): string => {
  if (!streamVal) return 'عام / مشترك';
  const norm = normalizeStream(streamVal);
  if (norm === 'scientific') return 'القسم العلمي';
  if (norm === 'literary') return 'القسم الأدبي';
  if (norm === 'english') return 'القسم الإنجليزي';
  return streamVal;
};

