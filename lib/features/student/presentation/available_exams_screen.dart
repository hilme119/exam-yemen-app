import 'package:flutter/material.dart';
import '../../../core/utils/error_handler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/models/subject_model.dart';
import '../providers/exam_provider.dart';
import '../../../core/services/offline_exam_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/result_provider.dart';
import '../../../core/providers/download_provider.dart';
import '../../../domain/models/exam_model.dart';
import '../../../domain/models/result_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/number_formatter.dart';

class AvailableExamsScreen extends ConsumerStatefulWidget {
  final SubjectModel subject;
  final String academicYear;
  final bool isPdf;

  const AvailableExamsScreen({
    super.key,
    required this.subject,
    required this.academicYear,
    this.isPdf = false,
  });

  @override
  ConsumerState<AvailableExamsScreen> createState() =>
      _AvailableExamsScreenState();
}

class _AvailableExamsScreenState extends ConsumerState<AvailableExamsScreen> {
  late String _selectedYear;

  @override
  void initState() {
    super.initState();
    // Default to the provided year or 'الكل'
    _selectedYear = widget.academicYear.isEmpty ? 'الكل' : widget.academicYear;
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(examsProvider(widget.subject.id));
    final resultsAsync = ref.watch(userResultsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.isPdf ? 'نماذج PDF • ${widget.subject.name}' : 'نماذج ${widget.subject.name}',
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: AppColors.textPrimary,
            size: 20,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 800),
            child: examsAsync.when(
              data: (exams) {
                // Collect all unique academic years from this subject's exams
                final yearsSet = <String>{};
                for (final e in exams) {
                  if (e.academicYear.trim().isNotEmpty) {
                    yearsSet.add(e.academicYear.trim());
                  }
                }
                final sortedYears = yearsSet.toList()..sort((a, b) => b.compareTo(a));
                final filterYears = ['الكل', ...sortedYears];

                // Filter exams by selected year and PDF flag
                final filteredExams = exams.where((e) {
                  final matchesPdf = e.isPdf == widget.isPdf;
                  final matchesYear = _selectedYear == 'الكل' || e.academicYear == _selectedYear;
                  return matchesPdf && matchesYear;
                }).toList();

                return Column(
                  children: [
                    // Header Summary Banner
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.border, width: 1),
                          boxShadow: AppColors.cardShadow,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.primaryAccent.withAlpha(20),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(
                                Icons.assignment_turned_in_rounded,
                                color: AppColors.primaryAccent,
                                size: 26,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.subject.name,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '${NumberFormatter.formatNumber(filteredExams.length)} نموذج وزاري متوفر • محدث لحظياً',
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.emeraldMint.withAlpha(20),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                widget.isPdf ? 'ملفات PDF' : 'مؤتمت ذكي',
                                style: const TextStyle(
                                  color: AppColors.emeraldMint,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Horizontal Filter Chips for Academic Years
                    if (filterYears.length > 1) ...[
                      SizedBox(
                        height: 44,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          itemCount: filterYears.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 8),
                          itemBuilder: (context, idx) {
                            final year = filterYears[idx];
                            final isSelected = _selectedYear == year;
                            return GestureDetector(
                              onTap: () => setState(() => _selectedYear = year),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.primaryAccent : AppColors.surface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isSelected ? AppColors.primaryAccent : AppColors.border,
                                    width: 1.2,
                                  ),
                                  boxShadow: isSelected ? AppColors.floatingShadow : AppColors.cardShadow,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  year == 'الكل' ? 'جميع الأعوام' : NumberFormatter.toEnDigits(year),
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : AppColors.textPrimary,
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Exams List Content
                    Expanded(
                      child: filteredExams.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(32.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryAccent.withAlpha(15),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.assignment_late_rounded,
                                        color: AppColors.primaryAccent,
                                        size: 48,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    const Text(
                                      'لا توجد نماذج لهذا العام المختار',
                                      style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    const Text(
                                      'اختر "جميع الأعوام" أو عاماً دراسياً آخر لعرض النماذج المتاحة.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: () async {
                                ref.invalidate(examsProvider(widget.subject.id));
                                await ref.read(examsProvider(widget.subject.id).future);
                              },
                              color: AppColors.primaryAccent,
                              backgroundColor: AppColors.surface,
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20.0,
                                  vertical: 6.0,
                                ),
                                physics: const AlwaysScrollableScrollPhysics(
                                  parent: BouncingScrollPhysics(),
                                ),
                                itemCount: filteredExams.length,
                                itemBuilder: (context, index) {
                                  final exam = filteredExams[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 14.0),
                                    child: _ExamCardItem(
                                      key: ValueKey('exam_${exam.id}'),
                                      exam: exam,
                                      subject: widget.subject,
                                      results: resultsAsync.value ?? [],
                                    ),
                                  );
                                },
                              ),
                            ),
                    ),
                  ],
                );
              },
              loading: () => const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      color: AppColors.primaryAccent,
                      strokeWidth: 3,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'جاري تحميل نماذج الاختبارات الوزارية...',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              error: (e, st) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.cloud_off_rounded,
                        color: AppColors.error,
                        size: 52,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'تعذر تحميل النماذج',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ErrorHandler.getErrorMessage(e),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        onPressed: () => ref.invalidate(examsProvider(widget.subject.id)),
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text('إعادة المحاولة'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryAccent,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ExamCardItem extends ConsumerWidget {
  final ExamModel exam;
  final SubjectModel subject;
  final List<dynamic> results;

  const _ExamCardItem({
    super.key,
    required this.exam,
    required this.subject,
    required this.results,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offlineService = ref.watch(offlineExamServiceProvider);

    // Check completion & score safely
    ResultModel? pastResult;
    bool isDone = false;
    for (final r in results) {
      if (r is ResultModel && r.examId == exam.id) {
        isDone = true;
        pastResult = r;
        break;
      }
    }

    final isDownloaded = offlineService.isExamDownloaded(exam.id);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDone ? AppColors.emeraldMint.withAlpha(60) : AppColors.border,
          width: 1.2,
        ),
        boxShadow: AppColors.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Icon + Title + Academic Year
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: isDone
                        ? AppColors.emeraldMint.withAlpha(25)
                        : AppColors.primaryAccent.withAlpha(25),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDone
                          ? AppColors.emeraldMint.withAlpha(60)
                          : AppColors.primaryAccent.withAlpha(60),
                      width: 1.2,
                    ),
                  ),
                  child: Icon(
                    isDone ? Icons.check_circle_rounded : Icons.assignment_rounded,
                    color: isDone ? AppColors.emeraldMint : AppColors.primaryAccent,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exam.title.isNotEmpty ? exam.title : 'نموذج وزاري',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppColors.border, width: 1),
                            ),
                            child: Text(
                              'العام: ${NumberFormatter.toEnDigits(exam.academicYear)}',
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (exam.questionsCount != null && (exam.questionsCount ?? 0) > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppColors.border, width: 1),
                              ),
                              child: Text(
                                '${NumberFormatter.formatNumber(exam.questionsCount)} سؤال',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // If exam was solved previously, show luxury emerald score pill
            if (isDone && pastResult != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.emeraldMint.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.emeraldMint.withAlpha(40), width: 1),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      color: AppColors.emeraldMint,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'تم الحل سابقاً • النتيجة: ${NumberFormatter.toEnDigits(pastResult.score)}/${NumberFormatter.toEnDigits(pastResult.totalQuestions)}',
                      style: const TextStyle(
                        color: AppColors.emeraldMint,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      NumberFormatter.formatPercentage(
                        (pastResult.totalQuestions > 0)
                            ? (pastResult.score / pastResult.totalQuestions) * 100.0
                            : 0.0,
                      ),
                      style: const TextStyle(
                        color: AppColors.emeraldMint,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Actions Row: Download + Play Button
            Row(
              children: [
                // Offline Download Action
                if (exam.isPdf && exam.pdfUrl != null) ...[
                  Consumer(
                    builder: (context, ref, child) {
                      final isDownloading = ref.watch(
                        downloadProvider.select((s) => s.containsKey(exam.id)),
                      );
                      if (isDownloading) {
                        return Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border, width: 1),
                          ),
                          child: const Center(
                            child: SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primaryAccent,
                              ),
                            ),
                          ),
                        );
                      }
                      return Container(
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border, width: 1),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.download_rounded, color: AppColors.primaryAccent, size: 22),
                          tooltip: 'تحميل كملف PDF',
                          onPressed: () {
                            final user = ref.read(authStateProvider).value;
                            if (user != null && user.email.startsWith('guest_')) {
                              _showGuestWarningDialog(context);
                              return;
                            }
                            ref.read(downloadProvider.notifier).startDownload(
                              exam.id,
                              exam.pdfUrl!,
                              'exam_${exam.id}.pdf',
                              () async {
                                final examToSave = _createExamToSave(exam, subject);
                                await offlineService.downloadExam(examToSave, []);
                                if (context.mounted) {
                                  _showCustomSnackBar(context, 'تم تحميل ${exam.title} بنجاح!', AppColors.emeraldMint);
                                }
                              },
                              (err) {
                                if (context.mounted) {
                                  _showCustomSnackBar(context, err, AppColors.error);
                                }
                              },
                            );
                            _showCustomSnackBar(context, 'تم بدء التحميل في الخلفية...', AppColors.primaryAccent);
                          },
                        ),
                      );
                    },
                  ),
                ] else ...[
                  Container(
                    decoration: BoxDecoration(
                      color: isDownloaded ? AppColors.emeraldMint.withAlpha(20) : AppColors.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDownloaded ? AppColors.emeraldMint.withAlpha(50) : AppColors.border,
                        width: 1,
                      ),
                    ),
                    child: IconButton(
                      icon: Icon(
                        isDownloaded ? Icons.download_done_rounded : Icons.cloud_download_rounded,
                        color: isDownloaded ? AppColors.emeraldMint : AppColors.textSecondary,
                        size: 22,
                      ),
                      tooltip: isDownloaded ? 'محفوظ للعمل أوفلاين' : 'تحميل النموذج بدون إنترنت',
                      onPressed: () async {
                        final user = ref.read(authStateProvider).value;
                        if (user != null && user.email.startsWith('guest_')) {
                          _showGuestWarningDialog(context);
                          return;
                        }
                        if (isDownloaded) {
                          _showCustomSnackBar(context, 'النموذج محفوظ بالفعل على جهازك.', AppColors.emeraldMint);
                          return;
                        }
                        _showCustomSnackBar(context, 'جاري حفظ النموذج والأسئلة أوفلاين...', AppColors.primaryAccent);
                        try {
                          final questions = await ref.read(questionsProvider(exam.id).future);
                          final examToSave = _createExamToSave(exam, subject);
                          await offlineService.downloadExam(examToSave, questions);
                          if (context.mounted) {
                            _showCustomSnackBar(context, 'تم حفظ ${exam.title} بنجاح للعمل بدون إنترنت!', AppColors.emeraldMint);
                          }
                        } catch (err) {
                          if (context.mounted) {
                            _showCustomSnackBar(context, 'تعذر تحميل النموذج، يرجى المحاولة لاحقاً', AppColors.error);
                          }
                        }
                      },
                    ),
                  ),
                ],

                const Spacer(),

                // Play / Open Button
                if (exam.isPdf) ...[
                  ElevatedButton.icon(
                    icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                    label: const Text(
                      'عرض النموذج',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                    onPressed: () {
                      context.push('/pdf_viewer', extra: exam.pdfUrl);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                  ),
                ] else ...[
                  ElevatedButton.icon(
                    icon: const Icon(Icons.play_arrow_rounded, size: 20),
                    label: Text(
                      isDone ? 'إعادة الاختبار' : 'بدء الاختبار',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                    onPressed: () {
                      final user = ref.read(authStateProvider).value;
                      if (user != null && user.email.startsWith('guest_')) {
                        _showGuestWarningDialog(context);
                        return;
                      }
                      context.push('/student_exam_player', extra: exam);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDone ? AppColors.emeraldMint : AppColors.primaryAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
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

  static ExamModel _createExamToSave(ExamModel exam, SubjectModel subject) {
    String gradeName = 'الصف التاسع الأساسي';
    if (subject.grade == 'grade12') {
      gradeName = subject.stream == 'scientific' ? 'ثالث ثانوي علمي' : 'ثالث ثانوي أدبي';
    }
    return ExamModel(
      id: exam.id,
      subjectId: exam.subjectId,
      title: exam.title,
      academicYear: exam.academicYear,
      isPdf: exam.isPdf,
      pdfUrl: exam.pdfUrl,
      subjectName: subject.name,
      gradeName: gradeName,
      questionsCount: exam.questionsCount,
    );
  }

  static void _showCustomSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.info_outline_rounded, color: color, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  static void _showGuestWarningDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: const BorderSide(color: AppColors.border, width: 1.2),
            ),
            title: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: AppColors.champagneGold, size: 26),
                SizedBox(width: 10),
                Text(
                  'تنبيه حساب الزائر',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            content: const Text(
              'أنت مسجل كزائر حالياً. لا يمكنك أداء الاختبارات أو حفظها أوفلاين إلا بعد تسجيل الدخول بحساب طالب لحفظ درجاتك ونقاطك.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'إلغاء',
                  style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  Navigator.pop(context);
                  context.go('/login');
                },
                child: const Text(
                  'تسجيل الدخول',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
