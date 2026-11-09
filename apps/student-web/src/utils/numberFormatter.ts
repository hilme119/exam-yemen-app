/**
 * Converts any string with Arabic/Indic digits (٠-٩) to standard English digits (0-9)
 */
export function toEnDigits(val: any): string {
  if (val === null || val === undefined) return '0';
  const str = String(val);
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(arabic[i], english[i]);
  }
  return result;
}

/**
 * Formats a number with comma separators using English digits (e.g. 1,250)
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  const formatted = new Intl.NumberFormat('en-US').format(Number(num));
  return toEnDigits(formatted);
}

/**
 * Formats seconds into MM:SS
 */
export function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  return toEnDigits(`${mStr}:${sStr}`);
}

/**
 * Formats percentage (e.g. 88%)
 */
export function formatPercentage(pct: number): string {
  return `${toEnDigits(Math.round(pct))}%`;
}

