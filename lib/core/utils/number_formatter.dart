import 'package:intl/intl.dart';

/// English digits and number formatting utilities for ExamYemen
class NumberFormatter {
  NumberFormatter._();

  /// Converts any string with Arabic/Indic digits (٠-٩) to standard English digits (0-9)
  static String toEnDigits(dynamic val) {
    if (val == null) return '0';
    final str = val.toString();
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    var result = str;
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(arabic[i], english[i]);
    }
    return result;
  }

  /// Alias for toEnDigits for code readability
  static String formatEnglishDigits(dynamic val) => toEnDigits(val);

  /// Formats an integer or double with commas using English digits (e.g. 1,250)
  static String formatNumber(num? number) {
    if (number == null) return '0';
    final formatter = NumberFormat('#,##0', 'en_US');
    return toEnDigits(formatter.format(number));
  }

  /// Formats minutes/seconds into MM:SS (e.g. 45:00)
  static String formatTimer(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    final mStr = minutes.toString().padLeft(2, '0');
    final sStr = seconds.toString().padLeft(2, '0');
    return toEnDigits('$mStr:$sStr');
  }

  /// Formats percentage (e.g. 88%)
  static String formatPercentage(double pct) {
    return '${toEnDigits(pct.round())}%';
  }
}
