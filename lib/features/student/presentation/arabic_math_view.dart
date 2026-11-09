import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// A widget that renders mixed Arabic text with inline LaTeX math expressions.
/// Uses flutter_math_fork for native rendering instead of WebView.
///
/// Handles three LaTeX delimiter types:
/// - `$...$` inline math
/// - `\[...\]` display math
/// - `\(...\)` inline math (alternative)
///
/// Special handling for Arabic text inside `\text{}` blocks:
/// flutter_math_fork renders characters LTR, which reverses Arabic.
/// We pre-process by reversing the Arabic characters so the LTR
/// rendering produces the correct RTL visual output.
class ArabicMathView extends StatelessWidget {
  final String questionMath;
  final double height;
  final double fontSize;
  final Color textColor;
  final FontWeight fontWeight;
  final TextAlign textAlign;
  final String? fontFamily;

  const ArabicMathView({
    super.key,
    required this.questionMath,
    this.height = 220,
    this.fontSize = 24,
    this.textColor = Colors.white,
    this.fontWeight = FontWeight.bold,
    this.textAlign = TextAlign.center,
    this.fontFamily,
  });

  /// Regex to detect Arabic characters (standard Arabic block).
  static final _arabicRegex = RegExp(r'[\u0600-\u06FF]');

  /// Checks if a string contains any Arabic characters.
  static bool _containsArabic(String text) {
    return _arabicRegex.hasMatch(text);
  }

  @override
  Widget build(BuildContext context) {
    final segments = _parseMixedText(questionMath);

    final spans = <InlineSpan>[];
    for (final segment in segments) {
      if (segment.isMath) {
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: _buildMathWidget(segment.content, isDisplayMode: segment.isDisplayMode),
          ),
        );
      } else {
        spans.add(
          TextSpan(
            text: segment.content,
            style: TextStyle(
              fontFamily: fontFamily,
              fontSize: fontSize,
              color: textColor,
              fontWeight: fontWeight,
              height: 1.6,
            ),
          ),
        );
      }
    }

    return SizedBox(
      width: double.infinity,
      child: RichText(
        textAlign: textAlign,
        textDirection: TextDirection.rtl,
        text: TextSpan(children: spans),
      ),
    );
  }

  static String _preProcessLatex(String input) {
    String result = input;
    
    // 1. Swap "Variable \text{لو}" or "Variable لو" to "\text{لو} Variable"
    // Example: "أ \text{ لو}" -> "\text{لو} أ", "ب \text{ لو}" -> "\text{لو} ب"
    result = result.replaceAllMapped(
      RegExp(r'([أ-ي])\s*\\text\{\s*لو\s*\}'),
      (match) => '\\text{لو} ${match.group(1)}',
    );
    result = result.replaceAllMapped(
      RegExp(r'([أ-ي])\s+لو\b'),
      (match) => '\\text{لو} ${match.group(1)}',
    );

    // 2. Swap limit and its expression: "limit target" -> "target limit"
    // Since math renders LTR, swapping them ensures RTL reader reads "limit target"
    result = result.replaceAllMapped(
      RegExp(r'^(\\mathop\{\\text\{\s*نها\s*\}\}_\{[^}]+\}|\\lim_\{[^}]+\})\s*(.+)'),
      (match) => '${match.group(2)} ${match.group(1)}',
    );

    return result;
  }

  Widget _buildMathWidget(String latex, {required bool isDisplayMode}) {
    String cleanedLatex = _preProcessLatex(latex);

    // Step 1: Replace known Arabic math terms with Unicode Presentation Forms.
    // flutter_math_fork renders characters LTR, so Arabic words appear reversed.
    // We use pre-shaped Arabic characters (Presentation Forms B) written in
    // REVERSED order, so that LTR rendering produces correct RTL visual output
    // with proper letter joining/shaping.
    //
    // This matches the technique used in the admin questions_view.dart.
    cleanedLatex = _shapeArabicMath(cleanedLatex);

    // Step 2: For any remaining \text{Arabic} not caught by Step 1,
    // reverse the character order as a fallback.
    cleanedLatex = cleanedLatex.replaceAllMapped(RegExp(r'\\text\{([^}]+)\}'), (
      match,
    ) {
      String content = match.group(1)!;
      if (_containsArabic(content)) {
        String reversed = String.fromCharCodes(content.runes.toList().reversed);
        return '\\text{$reversed}';
      }
      return match.group(0)!;
    });

    // Clean up spacing commands
    cleanedLatex = cleanedLatex.replaceAll('\\;', '\\,');

    try {
      return Math.tex(
        cleanedLatex,
        textStyle: TextStyle(
          fontSize: fontSize + (isDisplayMode ? 2 : 0),
          color: textColor,
          fontWeight: fontWeight,
        ),
        mathStyle: isDisplayMode ? MathStyle.display : MathStyle.text,
        onErrorFallback: (error) {
          // Fallback: show readable text by stripping LaTeX commands
          return Text(
            _stripLatexToReadable(latex),
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontSize: fontSize,
              color: textColor,
              fontWeight: fontWeight,
              fontStyle: FontStyle.italic,
              height: 1.6,
            ),
          );
        },
      );
    } catch (e) {
      return Text(
        _stripLatexToReadable(latex),
        textDirection: TextDirection.rtl,
        style: TextStyle(
          fontSize: fontSize,
          color: textColor,
          fontWeight: fontWeight,
          fontStyle: FontStyle.italic,
          height: 1.6,
        ),
      );
    }
  }

  /// Replaces known Arabic math function names with Unicode Presentation Forms
  /// in reversed character order for correct display in flutter_math_fork's
  /// LTR rendering. Uses pre-shaped/joined Arabic characters for beautiful
  /// connected text.
  ///
  /// Handles both `\text{Arabic}` (from CSV) and bare Arabic words (from admin).
  ///
  /// The Unicode Presentation Forms B (U+FE70-U+FEFF) contain the
  /// isolated, initial, medial, and final forms of Arabic letters.
  /// By placing them in reversed order, LTR rendering produces correct
  /// RTL visual output.
  static String _shapeArabicMath(String input) {
    // Map of Arabic math terms → reversed Unicode Presentation Forms
    const replacements = {
      // 3-letter terms (longest first to avoid partial matches)
      'قتا': '\uFE8E\uFE98\uFEE3', // csc - قتا
      'جتا': '\uFE8E\uFE98\uFE9F', // cos - جتا
      'ظتا': '\uFE8E\uFE98\uFEE7', // cot - ظتا
      'لوس': '\uFEB2\uFEEE\uFEDD', // log x - لوس
      'نها': '\uFE8E\uFEEC\uFEE7', // limit - نها
      'صفر': '\uFEAE\uFED4\uFEBB', // zero - صفر
      // 2-letter terms
      'جا': '\uFE8E\uFE9F', // sin - جا
      'ظا': '\uFE8E\uFEE7', // tan - ظا
      'قا': '\uFE8E\uFEE3', // sec - قا
      'لو': '\uFEEE\uFEDD', // log - لو
      'دس': '\uFEB2\uFEAE', // dx - دس
    };

    String result = input;
    for (final entry in replacements.entries) {
      final arabic = entry.key;
      final shaped = entry.value;
      // Replace \text{Arabic} pattern (from CSV data)
      result = result.replaceAll('\\text{$arabic}', '\\text{$shaped}');
      // Also replace bare Arabic (from admin input or other sources)
      // but only if it's not already inside a \text{} block
      // (bare replacements will be caught by the regex fallback in Step 2)
    }
    return result;
  }

  /// Strips LaTeX commands to produce readable plain Arabic text as a fallback.
  static String _stripLatexToReadable(String latex) {
    return latex
        .replaceAllMapped(RegExp(r'\\text\{([^}]+)\}'), (m) => m.group(1) ?? '')
        .replaceAllMapped(
          RegExp(r'\\frac\{([^}]+)\}\{([^}]+)\}'),
          (m) => '(${m.group(1)}/${m.group(2)})',
        )
        .replaceAllMapped(
          RegExp(r'\\sqrt\{([^}]+)\}'),
          (m) => '√(${m.group(1)})',
        )
        .replaceAll('\\lim', 'نها')
        .replaceAll('\\int', '∫')
        .replaceAll('\\infty', '∞')
        .replaceAll('\\pi', 'π')
        .replaceAll('\\to', '→')
        .replaceAll('\\ge', '≥')
        .replaceAll('\\le', '≤')
        .replaceAll('\\neq', '≠')
        .replaceAll('\\cdot', '·')
        .replaceAll('\\,', ' ')
        .replaceAll(RegExp(r'\\[a-zA-Z]+'), '')
        .replaceAll(RegExp(r'[{}]'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  /// Parses text containing LaTeX math expressions into segments.
  /// Supports three delimiter types:
  /// - Display math: \[...\]
  /// - Inline math (parentheses): \(...\)
  /// - Inline math (dollar): $...$
  List<_TextSegment> _parseMixedText(String text) {
    final segments = <_TextSegment>[];

    // Unified regex matching all three math delimiter types:
    // 1. \[...\] display math
    // 2. \(...\) inline math
    // 3. $...$ inline math (non-greedy, single-line)
    final regex = RegExp(
      r'\\\[(.+?)\\\]' // \[...\]
      r'|'
      r'\\\((.+?)\\\)' // \(...\)
      r'|'
      r'\$(.+?)\$', // $...$
    );

    int lastEnd = 0;

    for (final match in regex.allMatches(text)) {
      // Add plain text before this math segment
      if (match.start > lastEnd) {
        final plainText = text.substring(lastEnd, match.start).trim();
        if (plainText.isNotEmpty) {
          segments.add(_TextSegment(plainText, isMath: false));
        }
      }

      // Check which group matched to determine math style
      final displayMath = match.group(1);
      final inlineMath1 = match.group(2);
      final inlineMath2 = match.group(3);

      if (displayMath != null && displayMath.trim().isNotEmpty) {
        segments.add(_TextSegment(displayMath.trim(), isMath: true, isDisplayMode: true));
      } else if (inlineMath1 != null && inlineMath1.trim().isNotEmpty) {
        segments.add(_TextSegment(inlineMath1.trim(), isMath: true, isDisplayMode: false));
      } else if (inlineMath2 != null && inlineMath2.trim().isNotEmpty) {
        segments.add(_TextSegment(inlineMath2.trim(), isMath: true, isDisplayMode: false));
      }

      lastEnd = match.end;
    }

    // Add remaining plain text
    if (lastEnd < text.length) {
      final remaining = text.substring(lastEnd).trim();
      if (remaining.isNotEmpty) {
        segments.add(_TextSegment(remaining, isMath: false));
      }
    }

    // If no segments were found (no math), treat entire text as plain
    if (segments.isEmpty) {
      segments.add(_TextSegment(text, isMath: false));
    }

    return segments;
  }
}

class _TextSegment {
  final String content;
  final bool isMath;
  final bool isDisplayMode;

  _TextSegment(this.content, {required this.isMath, this.isDisplayMode = false});
}
