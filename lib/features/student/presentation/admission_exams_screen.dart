import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/number_formatter.dart';
import '../providers/admission_provider.dart';
import '../../../core/providers/download_provider.dart';
import '../../../core/services/offline_exam_service.dart';
import '../../../domain/models/exam_model.dart';
import '../../../domain/models/admission_models.dart';
import '../../../domain/models/question_model.dart';
import '../../auth/providers/auth_provider.dart';

class AdmissionExamsScreen extends ConsumerStatefulWidget {
  final String subjectId;
  final String subjectName;

  const AdmissionExamsScreen({
    super.key,
    required this.subjectId,
    required this.subjectName,
  });

  @override
  ConsumerState<AdmissionExamsScreen> createState() =>
      _AdmissionExamsScreenState();
}

class _AdmissionExamsScreenState extends ConsumerState<AdmissionExamsScreen> {
  String _searchQuery = '';
  String _selectedYear = 'الكل';
  String _selectedType = 'all'; // 'all', 'interactive', 'pdf'
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showGuestWarningDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.lock_outline_rounded, color: AppColors.champagneGold, size: 28),
            SizedBox(width: 10),
            Text(
              'تسجيل الدخول مطلوب',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: const Text(
          'لا يمكنك تحميل الاختبارات أو حفظها للعمل بدون إنترنت كزائر. يرجى إنشاء حساب أو تسجيل الدخول للاستمتاع بهذه الميزة.',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text(
              'إلغاء',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              context.pop();
              ref.read(authStateProvider.notifier).logout();
              context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryAccent,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: const Text(
              'تسجيل الدخول',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  void _showCustomSnackBar(String message, Color color) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: color,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(admissionExamsProvider(widget.subjectId));

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
        title: Text(
          'نماذج اختبارات القبول',
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: examsAsync.when(
        data: (allExams) {
          if (allExams.isEmpty) {
            return _buildEmptyState(
              icon: Icons.assignment_outlined,
              title: 'لا توجد نماذج مضافة حالياً',
              subtitle: 'سيتم إضافة نماذج اختبارات القبول لهذه المادة قريباً.',
            );
          }

          // Extract available years
          final yearsSet = <String>{};
          for (final exam in allExams) {
            if (exam.academicYear != null && exam.academicYear!.trim().isNotEmpty) {
              yearsSet.add(exam.academicYear!.trim());
            }
          }
          final sortedYears = yearsSet.toList()..sort((a, b) => b.compareTo(a));

          // Filter by Type, Year, and Search
          final filteredExams = allExams.where((exam) {
            // Type filter
            if (_selectedType == 'interactive' && exam.isPdf) return false;
            if (_selectedType == 'pdf' && !exam.isPdf) return false;

            // Year filter
            if (_selectedYear != 'الكل') {
              final examYear = exam.academicYear?.trim() ?? '';
              if (examYear != _selectedYear) return false;
            }

            // Search query
            if (_searchQuery.trim().isNotEmpty) {
              final query = _searchQuery.trim().toLowerCase();
              final title = exam.title.toLowerCase();
              final year = (exam.academicYear ?? '').toLowerCase();
              if (!title.contains(query) && !year.contains(query)) return false;
            }

            return true;
          }).toList();

          return Column(
            children: [
              // Top Luxury Header
              _buildTopHeroBanner(allExams.length),

              // Search Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                    boxShadow: AppColors.cardShadow,
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: InputDecoration(
                      hintText: 'ابحث عن نموذج أو عام دراسي...',
                      hintStyle: const TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 13,
                      ),
                      prefixIcon: const Icon(
                        Icons.search_rounded,
                        color: AppColors.primaryAccent,
                        size: 22,
                      ),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
              ),

              // Type Selector Chips (All, Interactive, PDF)
              _buildTypeFilterRow(),

              // Year Filter Chips
              if (sortedYears.isNotEmpty) _buildYearChips(sortedYears),

              const SizedBox(height: 6),

              // Exams List
              Expanded(
                child: filteredExams.isEmpty
                    ? _buildEmptyFilteredState()
                    : RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(admissionExamsProvider(widget.subjectId));
                          await ref.read(admissionExamsProvider(widget.subjectId).future);
                        },
                        color: AppColors.primaryAccent,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          itemCount: filteredExams.length,
                          itemBuilder: (context, index) {
                            final exam = filteredExams[index];
                            return _buildExamCard(exam);
                          },
                        ),
                      ),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryAccent),
        ),
        error: (error, stackTrace) => Center(
          child: Text(
            'حدث خطأ: ${ErrorHandler.getErrorMessage(error)}',
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
    );
  }

  Widget _buildTopHeroBanner(int totalCount) {
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
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(25),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withAlpha(40)),
            ),
            child: const Icon(
              Icons.account_balance_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.subjectName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'نماذج مفاضلة سابقة واختبارات قبول إلكترونية',
                  style: TextStyle(
                    color: Colors.white.withAlpha(190),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.emeraldMint.withAlpha(40),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.emeraldMint.withAlpha(80)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.folder_open_rounded,
                  color: AppColors.emeraldMint,
                  size: 15,
                ),
                const SizedBox(width: 6),
                Text(
                  '${NumberFormatter.toEnDigits(totalCount)} نموذج',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeFilterRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          _buildTypeChip('all', 'جميع النماذج', Icons.apps_rounded),
          const SizedBox(width: 8),
          _buildTypeChip('interactive', 'اختبارات تفاعلية', Icons.touch_app_rounded),
          const SizedBox(width: 8),
          _buildTypeChip('pdf', 'ملفات PDF مصورة', Icons.picture_as_pdf_rounded),
        ],
      ),
    );
  }

  Widget _buildTypeChip(String typeKey, String label, IconData icon) {
    final isSelected = _selectedType == typeKey;
    return InkWell(
      onTap: () => setState(() => _selectedType = typeKey),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryAccent : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primaryAccent : AppColors.border,
          ),
          boxShadow: isSelected ? AppColors.cardShadow : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildYearChips(List<String> years) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          _buildYearChip('الكل'),
          ...years.map((year) => _buildYearChip(year)),
        ],
      ),
    );
  }

  Widget _buildYearChip(String year) {
    final isSelected = _selectedYear == year;
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: ChoiceChip(
        label: Text(
          year == 'الكل' ? 'كل الأعوام' : NumberFormatter.toEnDigits(year),
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) setState(() => _selectedYear = year);
        },
        selectedColor: const Color(0xFF0F172A),
        backgroundColor: Colors.white,
        side: BorderSide(
          color: isSelected ? const Color(0xFF0F172A) : AppColors.border,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        showCheckmark: false,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
    );
  }

  Widget _buildExamCard(AdmissionExamModel exam) {
    final offlineService = ref.watch(offlineExamServiceProvider);
    final isDownloaded = offlineService.isExamDownloaded(exam.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: AppColors.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Icon Avatar
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: exam.isPdf
                        ? const Color(0xFFEF4444).withAlpha(20)
                        : AppColors.primaryAccent.withAlpha(20),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: exam.isPdf
                          ? const Color(0xFFEF4444).withAlpha(50)
                          : AppColors.primaryAccent.withAlpha(50),
                    ),
                  ),
                  child: Icon(
                    exam.isPdf
                        ? Icons.picture_as_pdf_rounded
                        : Icons.assignment_rounded,
                    color: exam.isPdf
                        ? const Color(0xFFEF4444)
                        : AppColors.primaryAccent,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exam.title,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          if (exam.academicYear != null &&
                              exam.academicYear!.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceLight,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Text(
                                NumberFormatter.toEnDigits(exam.academicYear),
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: exam.isPdf
                                  ? const Color(0xFFEF4444).withAlpha(15)
                                  : AppColors.emeraldMint.withAlpha(15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              exam.isPdf ? 'ملف PDF' : 'تفاعلي',
                              style: TextStyle(
                                color: exam.isPdf
                                    ? const Color(0xFFDC2626)
                                    : AppColors.emeraldMint,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (isDownloaded)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.emeraldMint.withAlpha(15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.offline_pin_rounded,
                                    color: AppColors.emeraldMint,
                                    size: 12,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    'محفوظ بدون نت',
                                    style: TextStyle(
                                      color: AppColors.emeraldMint,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Offline Action Button
                _buildDownloadActionButton(exam, isDownloaded, offlineService),
              ],
            ),
            const SizedBox(height: 14),
            // Primary Launch Button
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: () {
                  if (exam.isPdf && exam.pdfUrl != null) {
                    context.push('/pdf_viewer', extra: exam.pdfUrl);
                  } else {
                    context.push('/student_exam_player', extra: exam);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: exam.isPdf
                      ? const Color(0xFF0F172A)
                      : AppColors.primaryAccent,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      exam.isPdf
                          ? Icons.remove_red_eye_rounded
                          : Icons.play_arrow_rounded,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      exam.isPdf ? 'فتح وتصفح النموذج' : 'بدء الاختبار الآن',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDownloadActionButton(
    AdmissionExamModel exam,
    bool isDownloaded,
    OfflineExamService offlineService,
  ) {
    if (exam.isPdf) {
      return Consumer(
        builder: (context, ref, child) {
          final downloadState = ref.watch(downloadProvider)[exam.id];
          final isCurrentlyDownloading = downloadState?.isDownloading ?? false;
          final dlProgress = downloadState?.progress ?? 0.0;

          if (isCurrentlyDownloading) {
            return Container(
              width: 40,
              height: 40,
              padding: const EdgeInsets.all(6),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: dlProgress > 0 ? dlProgress : null,
                    color: AppColors.primaryAccent,
                    strokeWidth: 2.5,
                  ),
                  Text(
                    dlProgress > 0
                        ? '${NumberFormatter.toEnDigits((dlProgress * 100).toInt())}%'
                        : '',
                    style: const TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            );
          }

          if (isDownloaded) {
            return Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.emeraldMint.withAlpha(20),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: AppColors.emeraldMint,
                size: 22,
              ),
            );
          }

          return IconButton(
            icon: const Icon(
              Icons.arrow_downward_rounded,
              color: AppColors.primaryAccent,
              size: 22,
            ),
            tooltip: 'تحميل كملف PDF للعمل بدون إنترنت',
            onPressed: () {
              final user = ref.read(authStateProvider).value;
              if (user != null && user.email.startsWith('guest_')) {
                _showGuestWarningDialog();
                return;
              }
              if (exam.pdfUrl == null) {
                _showCustomSnackBar('رابط الملف غير متوفر', Colors.redAccent);
                return;
              }
              ref.read(downloadProvider.notifier).startDownload(
                exam.id,
                exam.pdfUrl!,
                'admission_exam_${exam.id}.pdf',
                () async {
                  final examToSave = ExamModel(
                    id: exam.id,
                    subjectId: exam.subjectId,
                    title: exam.title,
                    academicYear: exam.academicYear ?? 'عام غير محدد',
                    isPdf: true,
                    pdfUrl: exam.pdfUrl,
                    subjectName: widget.subjectName,
                    gradeName: 'اختبار قبول',
                  );
                  await offlineService.downloadExam(examToSave, []);
                  if (mounted) {
                    setState(() {});
                    _showCustomSnackBar(
                      'تم تحميل ${exam.title} بنجاح!',
                      AppColors.emeraldMint,
                    );
                  }
                },
                (err) {
                  if (mounted) {
                    _showCustomSnackBar(err, Colors.redAccent);
                  }
                },
              );
              _showCustomSnackBar('تم بدء التحميل...', AppColors.primaryAccent);
            },
          );
        },
      );
    } else {
      return IconButton(
        icon: Icon(
          isDownloaded
              ? Icons.check_circle_rounded
              : Icons.arrow_downward_rounded,
          color: isDownloaded ? AppColors.emeraldMint : AppColors.primaryAccent,
          size: 22,
        ),
        tooltip: isDownloaded ? 'محفوظ' : 'تحميل النموذج للعمل بدون إنترنت',
        onPressed: isDownloaded
            ? null
            : () async {
                final user = ref.read(authStateProvider).value;
                if (user != null && user.email.startsWith('guest_')) {
                  _showGuestWarningDialog();
                  return;
                }

                try {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('جاري تنزيل أسئلة النموذج...'),
                      duration: Duration(seconds: 1),
                    ),
                  );
                  final snapshot = await FirebaseFirestore.instance
                      .collection('exams')
                      .doc(exam.id)
                      .collection('questions')
                      .get();
                  final questionsList = snapshot.docs
                      .map((doc) => QuestionModel.fromJson(doc.data()))
                      .toList();

                  final examToSave = ExamModel(
                    id: exam.id,
                    subjectId: exam.subjectId,
                    title: exam.title,
                    academicYear: exam.academicYear ?? 'عام غير محدد',
                    isPdf: false,
                    subjectName: widget.subjectName,
                    gradeName: 'اختبار قبول',
                  );

                  await offlineService.downloadExam(examToSave, questionsList);
                  if (mounted) {
                    setState(() {});
                    _showCustomSnackBar(
                      'تم حفظ ${exam.title} للعمل بدون إنترنت!',
                      AppColors.emeraldMint,
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    _showCustomSnackBar('فشل التحميل: $e', Colors.redAccent);
                  }
                }
              },
      );
    }
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
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
              child: Icon(icon, size: 56, color: AppColors.textTertiary),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
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

  Widget _buildEmptyFilteredState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.filter_alt_off_rounded,
              size: 48,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            const Text(
              'لا توجد نماذج مطابقة للفلتر',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'جرّب تغيير خيارات البحث أو الفلتر أعلاه.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _searchController.clear();
                  _searchQuery = '';
                  _selectedYear = 'الكل';
                  _selectedType = 'all';
                });
              },
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('إعادة تعيين الفلاتر'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primaryAccent,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
