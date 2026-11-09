import 'package:flutter/material.dart';
import '../../../core/utils/error_handler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../domain/models/subject_model.dart';
import '../providers/subject_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/number_formatter.dart';

class SubjectSelectionScreen extends ConsumerStatefulWidget {
  final String? grade;
  final String? stream;
  final bool isForMaterials;
  final bool isPdf;

  const SubjectSelectionScreen({
    super.key,
    this.grade,
    this.stream,
    this.isForMaterials = false,
    this.isPdf = false,
  });

  @override
  ConsumerState<SubjectSelectionScreen> createState() =>
      _SubjectSelectionScreenState();
}

class _SubjectSelectionScreenState
    extends ConsumerState<SubjectSelectionScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  IconData _getSubjectIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('english') || lower.contains('إنجليزي') || lower.contains('انجليزي')) {
      return Icons.translate_rounded;
    } else if (lower.contains('رياضيات') || lower.contains('جبر') || lower.contains('تفاضل') || lower.contains('هندسة')) {
      return Icons.calculate_rounded;
    } else if (lower.contains('كيمياء')) {
      return Icons.science_rounded;
    } else if (lower.contains('فيزياء')) {
      return Icons.bolt_rounded;
    } else if (lower.contains('أحياء') || lower.contains('احياء')) {
      return Icons.biotech_rounded;
    } else if (lower.contains('قرآن') || lower.contains('قران')) {
      return Icons.menu_book_rounded;
    } else if (lower.contains('إسلامية') || lower.contains('اسلامية')) {
      return Icons.auto_stories_rounded;
    } else if (lower.contains('عربي') || lower.contains('لغة عربية')) {
      return Icons.history_edu_rounded;
    } else if (lower.contains('اجتماعيات') || lower.contains('تاريخ')) {
      return Icons.account_balance_rounded;
    } else if (lower.contains('جغراف')) {
      return Icons.public_rounded;
    } else if (lower.contains('فلسفة') || lower.contains('منطق')) {
      return Icons.psychology_rounded;
    }
    return Icons.school_rounded;
  }

  String _getGradeLabel() {
    if (widget.grade == 'grade9' || widget.grade == 'grade9_english') {
      return 'الصف التاسع الأساسي';
    } else if (widget.stream == 'scientific') {
      return 'الثالث الثانوي (علمي)';
    } else if (widget.stream == 'literary') {
      return 'الثالث الثانوي (أدبي)';
    } else if (widget.grade == 'grade12' || widget.grade == 'grade12_english') {
      return 'الثالث الثانوي العام';
    }
    return 'جميع المواد الدراسية';
  }

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(subjectsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.isForMaterials ? 'مناهج وملازم المواد' : 'مواد الامتحانات الوزارية',
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
            child: Column(
              children: [
                // Header Grade Banner & Search Box
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                  child: Column(
                    children: [
                      // Grade Context Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border, width: 1),
                          boxShadow: AppColors.cardShadow,
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.primaryAccent.withAlpha(20),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.school_rounded,
                                color: AppColors.primaryAccent,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _getGradeLabel(),
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.emeraldMint.withAlpha(20),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                widget.isForMaterials ? 'مكتبة وملخصات' : 'نماذج مؤتمتة',
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
                      const SizedBox(height: 12),

                      // Quick Instant Search Bar
                      Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border, width: 1),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() => _searchQuery = val.trim()),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          decoration: InputDecoration(
                            hintText: 'ابحث عن مادة (مثلاً: لغة عربية، كيمياء...)...',
                            hintStyle: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              color: AppColors.primaryAccent,
                              size: 20,
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
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Subjects List Content
                Expanded(
                  child: subjectsAsync.when(
                    data: (subjects) {
                      var filtered = subjects;
                      if (widget.grade != null) {
                        filtered = filtered
                            .where((s) => s.grade == widget.grade)
                            .toList();
                      }
                      if (widget.stream != null && widget.stream != 'All') {
                        filtered = filtered
                            .where(
                              (s) =>
                                  s.stream == widget.stream ||
                                  s.stream == null,
                            )
                            .toList();
                      }
                      if (_searchQuery.isNotEmpty) {
                        filtered = filtered
                            .where((s) => s.name.toLowerCase().contains(_searchQuery.toLowerCase()))
                            .toList();
                      }

                      if (filtered.isEmpty) {
                        return _buildEmptyState();
                      }

                      return RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(subjectsProvider);
                          await ref.read(subjectsProvider.future);
                        },
                        color: AppColors.primaryAccent,
                        backgroundColor: AppColors.surface,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20.0, vertical: 10.0),
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final subject = filtered[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12.0),
                              child: _buildSubjectCard(context, subject, index),
                            );
                          },
                        ),
                      );
                    },
                    loading: () => _buildLoadingState(),
                    error: (e, st) => _buildErrorState(e),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
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
                Icons.search_off_rounded,
                color: AppColors.primaryAccent,
                size: 48,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'لا توجد مواد مطابقة للبحث',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'يرجى التأكد من كتابة اسم المادة أو تفقد اتصال الإنترنت.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            color: AppColors.primaryAccent,
            strokeWidth: 3,
          ),
          SizedBox(height: 16),
          Text(
            'جاري مزامنة المواد من السحابة...',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(Object e) {
    return Center(
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
              'تعذر جلب المواد الدراسية',
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
              onPressed: () => ref.invalidate(subjectsProvider),
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
    );
  }

  Widget _buildSubjectCard(
      BuildContext context, SubjectModel subject, int index) {
    final icon = _getSubjectIcon(subject.name);
    final accentColors = [
      AppColors.primaryAccent,
      AppColors.curricula,
      AppColors.champagneGold,
      AppColors.emeraldMint,
      AppColors.competition,
      AppColors.services,
    ];
    final color = accentColors[index % accentColors.length];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border, width: 1.2),
        boxShadow: AppColors.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (widget.isForMaterials) {
              context.push(
                '/student_materials_list',
                extra: {
                  'subjectId': subject.id,
                  'subjectName': subject.name,
                },
              );
            } else {
              // 2-CLICK UX JUMP: Direct navigation to available exams with all years!
              context.push(
                '/student_available_exams',
                extra: {
                  'subject': subject,
                  'academicYear': 'الكل',
                  'isPdf': widget.isPdf,
                },
              );
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
            child: Row(
              children: [
                // Subject Icon with vibrant luxury box
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: color.withAlpha(22),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: color.withAlpha(50), width: 1.2),
                  ),
                  child: Icon(icon, color: color, size: 26),
                ),
                const SizedBox(width: 14),

                // Subject Title & Meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subject.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: color.withAlpha(15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              widget.isForMaterials ? 'كتب وملازم' : 'نماذج واختبارات',
                              style: TextStyle(
                                color: color,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'محدث لعام ${NumberFormatter.toEnDigits("2024-2025")}',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Action Arrow
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.border, width: 1),
                  ),
                  child: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: AppColors.textSecondary,
                    size: 13,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
