import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/number_formatter.dart';
import '../../../domain/models/exam_model.dart';
import '../../../domain/models/question_model.dart';
import '../../../domain/models/result_model.dart';
import '../providers/result_provider.dart';

final examDetailsProvider =
    FutureProvider.family<Map<String, String>, String>((ref, examId) async {
  try {
    final examDoc =
        await FirebaseFirestore.instance.collection('exams').doc(examId).get();
    if (!examDoc.exists) {
      return {'subjectName': 'مادة غير محددة', 'examName': 'نموذج سابق'};
    }

    final examData = examDoc.data()!;
    final subjectId = examData['subjectId'] as String? ?? '';

    String subjectName = 'مادة تعليمية';
    if (subjectId.isNotEmpty) {
      final subjectDoc = await FirebaseFirestore.instance
          .collection('subjects')
          .doc(subjectId)
          .get();
      if (subjectDoc.exists) {
        subjectName = subjectDoc.data()!['name'] as String? ?? 'مادة تعليمية';
      }
    }

    return {
      'subjectName': subjectName,
      'examName': examData['title'] as String? ?? 'نموذج سابق',
    };
  } catch (e) {
    return {'subjectName': 'مادة تعليمية', 'examName': 'نموذج سابق'};
  }
});

class MyResultsScreen extends ConsumerStatefulWidget {
  const MyResultsScreen({super.key});

  @override
  ConsumerState<MyResultsScreen> createState() => _MyResultsScreenState();
}

class _MyResultsScreenState extends ConsumerState<MyResultsScreen> {
  String _filter = 'all'; // 'all', 'passed', 'failed'
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = ref.watch(userResultsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: AppColors.textPrimary,
              size: 16,
            ),
          ),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'سجل نتائجي واختباراتي',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: resultsAsync.when(
        data: (results) {
          if (results.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(
                        Icons.analytics_outlined,
                        size: 56,
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'لم تقم بإجراء أي اختبار بعد',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'ابدأ بحل النماذج الوزارية وتحديات المسابقات وستظهر نتائجك ومعدلاتك هنا تلقائياً.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // Compute overall stats
          final totalExams = results.length;
          int passedExams = 0;
          double totalPercentageSum = 0;

          for (final r in results) {
            final pct = r.totalQuestions > 0
                ? (r.score / r.totalQuestions) * 100
                : 0.0;
            totalPercentageSum += pct;
            if (pct >= 50) passedExams++;
          }

          final avgPercentage = totalExams > 0
              ? totalPercentageSum / totalExams
              : 0.0;

          // Filter results
          final sortedResults = List.of(results)
            ..sort((a, b) => b.dateTaken.compareTo(a.dateTaken));

          final filteredResults = sortedResults.where((r) {
            final pct = r.totalQuestions > 0
                ? (r.score / r.totalQuestions) * 100
                : 0.0;
            if (_filter == 'passed' && pct < 50) return false;
            if (_filter == 'failed' && pct >= 50) return false;

            if (_searchQuery.trim().isNotEmpty) {
              final q = _searchQuery.trim().toLowerCase();
              final sName = (r.subjectName ?? '').toLowerCase();
              final eName = (r.examName ?? '').toLowerCase();
              if (!sName.contains(q) && !eName.contains(q)) return false;
            }

            return true;
          }).toList();

          return Column(
            children: [
              // Top Stats Hero Card
              _buildStatsHeroCard(totalExams, avgPercentage, passedExams),

              // Search & Filter Row
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                          boxShadow: AppColors.cardShadow,
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) =>
                              setState(() => _searchQuery = val),
                          decoration: InputDecoration(
                            hintText: 'ابحث في نتائجك...',
                            hintStyle: const TextStyle(
                              color: AppColors.textTertiary,
                              fontSize: 12,
                            ),
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              size: 20,
                              color: AppColors.primaryAccent,
                            ),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(
                                      Icons.clear_rounded,
                                      size: 16,
                                    ),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip('all', 'الكل'),
                    const SizedBox(width: 6),
                    _buildFilterChip('passed', 'ناجح'),
                    const SizedBox(width: 6),
                    _buildFilterChip('failed', 'إعادة'),
                  ],
                ),
              ),

              // Results List
              Expanded(
                child: filteredResults.isEmpty
                    ? Center(
                        child: Text(
                          'لا توجد نتائج مطابقة للفلتر المحدد',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        physics: const BouncingScrollPhysics(),
                        itemCount: filteredResults.length,
                        itemBuilder: (context, index) {
                          final result = filteredResults[index];
                          return _buildResultCard(context, result);
                        },
                      ),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryAccent),
        ),
        error: (e, st) => Center(
          child: Text(
            'حدث خطأ: ${ErrorHandler.getErrorMessage(e)}',
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsHeroCard(int total, double avg, int passed) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: AppColors.floatingShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatMetric(
            title: 'إجمالي الاختبارات',
            value: NumberFormatter.toEnDigits(total),
            icon: Icons.assignment_turned_in_rounded,
            color: const Color(0xFF60A5FA),
          ),
          Container(
            height: 40,
            width: 1,
            color: Colors.white.withAlpha(30),
          ),
          _buildStatMetric(
            title: 'معدل الدرجات',
            value: '${NumberFormatter.toEnDigits(avg.round())}%',
            icon: Icons.percent_rounded,
            color: const Color(0xFF34D399),
          ),
          Container(
            height: 40,
            width: 1,
            color: Colors.white.withAlpha(30),
          ),
          _buildStatMetric(
            title: 'النماذج المجتازة',
            value: NumberFormatter.toEnDigits(passed),
            icon: Icons.emoji_events_rounded,
            color: const Color(0xFFFBBF24),
          ),
        ],
      ),
    );
  }

  Widget _buildStatMetric({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: TextStyle(
            color: Colors.white.withAlpha(180),
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _filter == key;
    return InkWell(
      onTap: () => setState(() => _filter = key),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryAccent : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primaryAccent : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildResultCard(BuildContext context, ResultModel result) {
    final percentage = result.totalQuestions > 0
        ? (result.score / result.totalQuestions) * 100
        : 0.0;
    final passed = percentage >= 50;
    final mistakesCount = result.totalQuestions - result.score;

    final badgeColor = passed ? AppColors.emeraldMint : const Color(0xFFEF4444);
    final badgeBg = badgeColor.withAlpha(18);

    final formattedDate =
        DateFormat('yyyy/MM/dd - hh:mm a').format(result.dateTaken);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border, width: 1.2),
        boxShadow: AppColors.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                // Percentage Badge Circle
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: badgeBg,
                    shape: BoxShape.circle,
                    border: Border.all(color: badgeColor.withAlpha(60), width: 2),
                  ),
                  child: Center(
                    child: Text(
                      '${NumberFormatter.toEnDigits(percentage.round())}%',
                      style: TextStyle(
                        color: badgeColor,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                // Exam info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status & Subject Row
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: badgeBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              passed ? 'اجتياز بنجاح ✓' : 'بحاجة لإعادة المحاولة',
                              style: TextStyle(
                                color: badgeColor,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Exam / Subject Title
                      if (result.subjectName != null &&
                          result.examName != null) ...[
                        Text(
                          '${result.subjectName} - ${result.examName}',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ] else ...[
                        Consumer(
                          builder: (context, ref, child) {
                            final detailsAsync =
                                ref.watch(examDetailsProvider(result.examId));
                            return detailsAsync.when(
                              data: (details) => Text(
                                '${details['subjectName']} - ${details['examName']}',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              loading: () => const Text('جاري جلب العنوان...'),
                              error: (_, _) => const Text('نموذج سابق'),
                            );
                          },
                        ),
                      ],
                      const SizedBox(height: 6),
                      // Score and Date
                      Row(
                        children: [
                          Text(
                            'النتيجة: ${NumberFormatter.toEnDigits(result.score)} / ${NumberFormatter.toEnDigits(result.totalQuestions)}',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(
                            Icons.access_time_rounded,
                            size: 13,
                            color: AppColors.textTertiary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            NumberFormatter.toEnDigits(formattedDate),
                            style: const TextStyle(
                              color: AppColors.textTertiary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 12),

            // Action Buttons Row: Review Answers & Retest Mistakes
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _openResultReview(context, result),
                    icon: const Icon(Icons.fact_check_rounded, size: 16),
                    label: const Text(
                      'مراجعة الإجابات والحلول',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryAccent,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                if (mistakesCount > 0) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _retestMistakes(context, result),
                      icon: const Icon(Icons.replay_rounded, size: 16, color: AppColors.champagneGold),
                      label: Text(
                        'حل الأخطاء (${NumberFormatter.toEnDigits(mistakesCount)})',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.champagneGold),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.champagneGold.withAlpha(120), width: 1.2),
                        backgroundColor: AppColors.champagneGold.withAlpha(12),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _retestMistakes(
    BuildContext context,
    ResultModel result,
  ) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppColors.floatingShadow,
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.primaryAccent),
              SizedBox(height: 16),
              Text(
                'جاري تجهيز الأسئلة الخاطئة للتدريب...',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  decoration: TextDecoration.none,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    try {
      final examDoc = await FirebaseFirestore.instance
          .collection('exams')
          .doc(result.examId)
          .get();

      if (!examDoc.exists) {
        if (context.mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('هذا الاختبار لم يعد متاحاً'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      final exam = ExamModel.fromJson({...examDoc.data()!, 'id': examDoc.id});

      final questionsSnapshot = await FirebaseFirestore.instance
          .collection('exams')
          .doc(result.examId)
          .collection('questions')
          .get();

      final questions = questionsSnapshot.docs
          .map((doc) => QuestionModel.fromJson({...doc.data(), 'id': doc.id}))
          .toList();

      final wrongQuestions = questions.where((q) {
        final studentAns = result.selectedAnswers[q.id];
        return studentAns == null || studentAns != q.correctAnswerIndex;
      }).toList();

      if (context.mounted) {
        Navigator.pop(context);

        if (wrongQuestions.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تهانينا! لقد أجبت على جميع الأسئلة بشكل صحيح سابقاً 🎉'),
              backgroundColor: AppColors.emeraldMint,
            ),
          );
          return;
        }

        context.push(
          '/student_exam_player',
          extra: {
            'exam': exam,
            'customQuestions': wrongQuestions,
            'customTitle': 'حل الأخطاء • ${exam.title}',
          },
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ: ${ErrorHandler.getErrorMessage(e)}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _openResultReview(
    BuildContext context,
    ResultModel result,
  ) async {
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppColors.floatingShadow,
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.primaryAccent),
              SizedBox(height: 16),
              Text(
                'جاري تحميل نموذج الإجابات...',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  decoration: TextDecoration.none,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    try {
      final examDoc = await FirebaseFirestore.instance
          .collection('exams')
          .doc(result.examId)
          .get();

      if (!examDoc.exists) {
        if (context.mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('هذا الاختبار لم يعد متاحاً'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      final exam = ExamModel.fromJson({...examDoc.data()!, 'id': examDoc.id});

      final questionsSnapshot = await FirebaseFirestore.instance
          .collection('exams')
          .doc(result.examId)
          .collection('questions')
          .get();

      final questions = questionsSnapshot.docs
          .map((doc) => QuestionModel.fromJson({...doc.data(), 'id': doc.id}))
          .toList();

      if (context.mounted) {
        Navigator.pop(context);

        if (questions.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('لا توجد أسئلة مسجلة في هذا الاختبار'),
              backgroundColor: Colors.orangeAccent,
            ),
          );
          return;
        }

        context.push(
          '/student_exam_result',
          extra: {
            'exam': exam,
            'questions': questions,
            'selectedAnswers': result.selectedAnswers,
          },
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'حدث خطأ في تحميل الاختبار: ${ErrorHandler.getErrorMessage(e)}',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}
