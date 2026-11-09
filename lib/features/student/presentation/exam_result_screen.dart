import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/number_formatter.dart';
import '../../../domain/models/exam_model.dart';
import '../../../domain/models/question_model.dart';
import '../../../domain/models/competition_models.dart';
import 'arabic_math_view.dart';

class ExamResultScreen extends ConsumerStatefulWidget {
  final BaseExam exam;
  final List<QuestionModel> questions;
  final Map<String, int> selectedAnswers;

  const ExamResultScreen({
    super.key,
    required this.exam,
    required this.questions,
    required this.selectedAnswers,
  });

  @override
  ConsumerState<ExamResultScreen> createState() => _ExamResultScreenState();
}

class _ExamResultScreenState extends ConsumerState<ExamResultScreen> {
  String _filter = 'all'; // 'all', 'wrong', 'correct'

  @override
  Widget build(BuildContext context) {
    // Classify correct and wrong questions
    final correctQuestions = widget.questions.where((q) {
      return widget.selectedAnswers[q.id] == q.correctAnswerIndex;
    }).toList();

    final wrongQuestions = widget.questions.where((q) {
      return widget.selectedAnswers[q.id] != q.correctAnswerIndex;
    }).toList();

    final int score = correctQuestions.length;
    final int totalQuestions = widget.questions.length;
    final double percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0.0;
    final bool passed = percentage >= 50.0;

    int earnedPoints = 0;
    if (widget.exam is CompetitionExamModel) {
      final compExam = widget.exam as CompetitionExamModel;
      if (compExam.rewardPoints != null &&
          compExam.rewardPoints! > 0 &&
          totalQuestions > 0) {
        earnedPoints = (score / totalQuestions * compExam.rewardPoints!).round();
      }
    }

    final Color primaryColor = passed ? AppColors.emeraldMint : const Color(0xFFE11D48);

    // Filter displayed questions based on tab
    final displayedQuestions = widget.questions.where((q) {
      final isCorrect = widget.selectedAnswers[q.id] == q.correctAnswerIndex;
      if (_filter == 'wrong') return !isCorrect;
      if (_filter == 'correct') return isCorrect;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'تقرير نتيجة الاختبار',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
            tooltip: 'إغلاق والعودة',
            onPressed: () => context.go('/student_dashboard'),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ===== 1. Ultra-Luxurious Score & Performance Card =====
                    _buildPerformanceCard(
                      score: score,
                      total: totalQuestions,
                      percentage: percentage,
                      passed: passed,
                      primaryColor: primaryColor,
                      earnedPoints: earnedPoints,
                      wrongCount: wrongQuestions.length,
                    ),

                    // ===== 2. Retest Mistakes Banner (Hero Call to Action) =====
                    if (wrongQuestions.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _buildRetestMistakesBanner(wrongQuestions),
                    ] else ...[
                      const SizedBox(height: 16),
                      _buildFullScoreBanner(),
                    ],

                    const SizedBox(height: 24),

                    // ===== 3. Review Header & Filter Chips =====
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryAccent.withAlpha(20),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.fact_check_rounded,
                            color: AppColors.primaryAccent,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'مراجعة وتفسير الإجابات',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Filter Chips Row
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          _buildFilterTab(
                            key: 'all',
                            label: 'جميع الأسئلة',
                            count: totalQuestions,
                            color: AppColors.primaryAccent,
                          ),
                          const SizedBox(width: 8),
                          _buildFilterTab(
                            key: 'wrong',
                            label: 'الأسئلة الخاطئة',
                            count: wrongQuestions.length,
                            color: const Color(0xFFE11D48),
                            isUrgent: wrongQuestions.isNotEmpty,
                          ),
                          const SizedBox(width: 8),
                          _buildFilterTab(
                            key: 'correct',
                            label: 'الأسئلة الصحيحة',
                            count: correctQuestions.length,
                            color: AppColors.emeraldMint,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ===== 4. Detailed Questions Review List =====
                    if (displayedQuestions.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              _filter == 'wrong'
                                  ? Icons.celebration_rounded
                                  : Icons.inbox_rounded,
                              size: 48,
                              color: _filter == 'wrong'
                                  ? AppColors.tertiaryAccent
                                  : AppColors.textTertiary,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _filter == 'wrong'
                                  ? 'رائع! لا توجد أسئلة خاطئة في هذا الاختبار'
                                  : 'لا توجد أسئلة في هذا التبويب',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ...displayedQuestions.asMap().entries.map((entry) {
                        final originalIndex = widget.questions.indexOf(entry.value);
                        return _buildQuestionReviewCard(
                          question: entry.value,
                          index: originalIndex >= 0 ? originalIndex : entry.key,
                        );
                      }),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // ===== 5. Bottom Floating Action Bar =====
            _buildBottomActionBar(wrongQuestions),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceCard({
    required int score,
    required int total,
    required double percentage,
    required bool passed,
    required Color primaryColor,
    required int earnedPoints,
    required int wrongCount,
  }) {
    String motivationTitle;
    String motivationSub;
    IconData heroIcon;

    if (percentage >= 90) {
      motivationTitle = 'مبارك لك النجاح والتميّز الاستثنائي! 🏆';
      motivationSub = 'أداء باهر يُظهر فهمك المتعمق وإتقانك للمادة.';
      heroIcon = Icons.military_tech_rounded;
    } else if (percentage >= 75) {
      motivationTitle = 'مستوى ممتاز ورائع جداً! 🌟';
      motivationSub = 'أنت على بُعد خطوات بسيطة من الدرجة الكاملة.';
      heroIcon = Icons.workspace_premium_rounded;
    } else if (percentage >= 50) {
      motivationTitle = 'اجتياز بنجاح! أحسنت ومستواك في تقدم 👍';
      motivationSub = 'استمر في حل النماذج لتثبيت المعلومات والمفاهيم.';
      heroIcon = Icons.thumb_up_alt_rounded;
    } else {
      motivationTitle = 'لا تيأس.. كل خطأ هو فرصة للتعلّم! 💡';
      motivationSub = 'أعد حل الأسئلة الخاطئة الآن لترسيخ الفهم ومعرفة الحل النموذجي.';
      heroIcon = Icons.auto_awesome_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.glassBorder, width: 1.2),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        children: [
          // Icon & Motivation Text
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryColor.withAlpha(20),
              border: Border.all(color: primaryColor.withAlpha(80), width: 2),
            ),
            child: Icon(heroIcon, size: 48, color: primaryColor),
          ),
          const SizedBox(height: 14),
          Text(
            motivationTitle,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            motivationSub,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 20),

          // Big Score & Percentage Row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                NumberFormatter.toEnDigits(score),
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: primaryColor,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              Text(
                ' / ${NumberFormatter.toEnDigits(total)}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textTertiary,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: primaryColor.withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: primaryColor.withAlpha(50)),
                ),
                child: Text(
                  '${NumberFormatter.toEnDigits(percentage.round())}%',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: primaryColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Detailed 3-Box Stats Row
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.emeraldMint.withAlpha(15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.emeraldMint.withAlpha(40)),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_rounded, color: AppColors.emeraldMint, size: 16),
                          SizedBox(width: 4),
                          Text('إجابات صحيحة', style: TextStyle(color: AppColors.emeraldMint, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        NumberFormatter.toEnDigits(score),
                        style: const TextStyle(color: AppColors.emeraldMint, fontSize: 20, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE11D48).withAlpha(15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE11D48).withAlpha(40)),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.cancel_rounded, color: Color(0xFFE11D48), size: 16),
                          SizedBox(width: 4),
                          Text('إجابات خاطئة', style: TextStyle(color: Color(0xFFE11D48), fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        NumberFormatter.toEnDigits(wrongCount),
                        style: const TextStyle(color: Color(0xFFE11D48), fontSize: 20, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.format_list_numbered_rounded, color: AppColors.textSecondary, size: 16),
                          SizedBox(width: 4),
                          Text('كل الأسئلة', style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        NumberFormatter.toEnDigits(total),
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Competition Points Badge
          if (earnedPoints > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.tertiaryAccent.withAlpha(20),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.tertiaryAccent.withAlpha(60)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.stars_rounded, color: AppColors.tertiaryAccent, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    '+${NumberFormatter.formatNumber(earnedPoints)} نقطة في لوحة الصدارة!',
                    style: const TextStyle(
                      color: Color(0xFFB45309),
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRetestMistakesBanner(List<QuestionModel> wrongQuestions) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE11D48).withAlpha(80),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(35),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.replay_circle_filled_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'إعادة حل الأسئلة الخاطئة',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(40),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${NumberFormatter.toEnDigits(wrongQuestions.length)} أسئلة',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  'أعد حل الأسئلة التي تعثرت فيها فقط لضمان الدرجة الكاملة 100%',
                  style: TextStyle(
                    color: Colors.white.withAlpha(220),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              context.push(
                '/student_exam_player',
                extra: {
                  'exam': widget.exam,
                  'customQuestions': wrongQuestions,
                  'customTitle': 'إعادة الأخطاء • ${widget.exam.title}',
                },
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFFBE123C),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              elevation: 0,
            ),
            child: const Text(
              'ابدأ الآن',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFullScoreBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.emeraldMint.withAlpha(20),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.emeraldMint.withAlpha(80)),
      ),
      child: const Row(
        children: [
          Icon(Icons.stars_rounded, color: AppColors.emeraldMint, size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'علامة كاملة 100%! لا توجد أخطاء 🎉',
                  style: TextStyle(
                    color: AppColors.emeraldMint,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'لقد أجبت على كافة الأسئلة بشكل صحيح تماماً. أداء باهر ومتقن!',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab({
    required String key,
    required String label,
    required int count,
    required Color color,
    bool isUrgent = false,
  }) {
    final isSelected = _filter == key;
    return InkWell(
      onTap: () => setState(() => _filter = key),
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? color : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected ? AppColors.floatingShadow : AppColors.cardShadow,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withAlpha(40)
                    : color.withAlpha(20),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                NumberFormatter.toEnDigits(count),
                style: TextStyle(
                  color: isSelected ? Colors.white : color,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionReviewCard({
    required QuestionModel question,
    required int index,
  }) {
    final selectedIdx = widget.selectedAnswers[question.id];
    final isCorrect = selectedIdx == question.correctAnswerIndex;
    final cardColor = isCorrect ? AppColors.emeraldMint : const Color(0xFFE11D48);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isCorrect ? AppColors.emeraldMint.withAlpha(50) : const Color(0xFFE11D48).withAlpha(50),
          width: 1.2,
        ),
        boxShadow: AppColors.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question Header (Number + Status Badge)
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    'السؤال رقم ${NumberFormatter.toEnDigits(index + 1)}',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: cardColor.withAlpha(18),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: cardColor.withAlpha(60)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                        color: cardColor,
                        size: 15,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة',
                        style: TextStyle(
                          color: cardColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Question Text
            _buildMixedText(
              question.text,
              fontSize: 15,
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontFamily: question.fontFamily,
              textAlign: RegExp(r'[\u0600-\u06FF]').hasMatch(question.text)
                  ? TextAlign.right
                  : TextAlign.left,
            ),

            // Question Image if available
            if (question.questionImageUrl != null && question.questionImageUrl!.isNotEmpty) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(
                  question.questionImageUrl!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            ],

            const SizedBox(height: 16),
            const Divider(color: AppColors.divider, thickness: 1),
            const SizedBox(height: 12),

            // If Wrong: Show Student's Wrong Answer
            if (!isCorrect) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFECDD3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.close_rounded, color: Color(0xFFE11D48), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'إجابتك المختارة:',
                            style: TextStyle(
                              color: Color(0xFF9F1239),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          _buildMixedText(
                            (selectedIdx != null && selectedIdx < question.options.length)
                                ? question.options[selectedIdx]
                                : 'لم تقم بالإجابة على هذا السؤال',
                            fontSize: 13,
                            color: const Color(0xFF881337),
                            fontWeight: FontWeight.w700,
                            fontFamily: question.fontFamily,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],

            // Correct Answer Pill
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF059669), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isCorrect ? 'إجابتك الصحيحة النموذجية:' : 'الإجابة الصحيحة النموذجية:',
                          style: const TextStyle(
                            color: Color(0xFF065F46),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        _buildMixedText(
                          (question.correctAnswerIndex < question.options.length)
                              ? question.options[question.correctAnswerIndex]
                              : 'الإجابة الأولى',
                          fontSize: 13,
                          color: const Color(0xFF047857),
                          fontWeight: FontWeight.w700,
                          fontFamily: question.fontFamily,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ===== Explanation / التفسير والشرح النموذجي =====
            if (question.explanation != null && question.explanation!.trim().isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF), // Soft Blue
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lightbulb_rounded, color: Color(0xFF2563EB), size: 18),
                        SizedBox(width: 6),
                        Text(
                          'التفسير والشرح النموذجي:',
                          style: TextStyle(
                            color: Color(0xFF1E40AF),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    _buildMixedText(
                      question.explanation!,
                      fontSize: 13,
                      color: const Color(0xFF1E3A8A),
                      fontWeight: FontWeight.w600,
                      textAlign: TextAlign.right,
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBottomActionBar(List<QuestionModel> wrongQuestions) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 14.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
        boxShadow: AppColors.floatingShadow,
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Row(
        children: [
          // Home Button
          OutlinedButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/student_dashboard');
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textPrimary,
              side: const BorderSide(color: AppColors.border, width: 1.2),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.home_rounded, size: 18),
                SizedBox(width: 6),
                Text('الرئيسية', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Restart Full Exam Button
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                HapticFeedback.mediumImpact();
                context.push('/student_exam_player', extra: widget.exam);
              },
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text(
                'إعادة الاختبار بالكامل',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMixedText(
    String text, {
    required double fontSize,
    required Color color,
    required FontWeight fontWeight,
    String? fontFamily,
    TextAlign textAlign = TextAlign.right,
  }) {
    if (!text.contains('\$') &&
        !text.contains('\\[') &&
        !text.contains('\\(')) {
      return SizedBox(
        width: double.infinity,
        child: Text(
          text,
          textAlign: textAlign,
          textDirection: TextDirection.rtl,
          style: TextStyle(
            fontFamily: fontFamily,
            fontSize: fontSize,
            color: color,
            fontWeight: fontWeight,
            height: 1.5,
          ),
        ),
      );
    }

    return ArabicMathView(
      questionMath: text,
      fontSize: fontSize,
      textColor: color,
      fontWeight: fontWeight,
      textAlign: textAlign,
      fontFamily: fontFamily,
    );
  }
}
