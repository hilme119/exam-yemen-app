import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/number_formatter.dart';
import '../providers/competition_provider.dart';

class CompetitionsSubjectsScreen extends ConsumerStatefulWidget {
  final String semesterId;
  final String semesterName;

  const CompetitionsSubjectsScreen({
    super.key,
    required this.semesterId,
    required this.semesterName,
  });

  @override
  ConsumerState<CompetitionsSubjectsScreen> createState() =>
      _CompetitionsSubjectsScreenState();
}

class _CompetitionsSubjectsScreenState
    extends ConsumerState<CompetitionsSubjectsScreen> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final subjectsAsync =
        ref.watch(competitionSubjectsProvider(widget.semesterId));

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
          widget.semesterName,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: subjectsAsync.when(
        data: (subjects) {
          if (subjects.isEmpty) {
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
                        Icons.category_outlined,
                        size: 56,
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'لا توجد مواد مسابقات مضافة',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'سيتم إضافة مواد وتحديات جديدة لهذا المسار قريباً.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          final filtered = subjects.where((s) {
            if (_searchQuery.trim().isEmpty) return true;
            return s.name.toLowerCase().contains(_searchQuery.trim().toLowerCase());
          }).toList();

          return Column(
            children: [
              // Hero Banner
              Container(
                width: double.infinity,
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFB45309), Color(0xFFD97706)],
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
                        color: Colors.white.withAlpha(45),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withAlpha(60)),
                      ),
                      child: const Icon(
                        Icons.bolt_rounded,
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
                            widget.semesterName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'اختر المادة للدخول في تحدي السرعة والدقة',
                            style: TextStyle(
                              color: Colors.white.withAlpha(220),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(35),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${NumberFormatter.toEnDigits(subjects.length)} مواد',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

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
                      hintText: 'ابحث عن مادة...',
                      hintStyle: const TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 13,
                      ),
                      prefixIcon: const Icon(
                        Icons.search_rounded,
                        color: AppColors.champagneGold,
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

              // Subjects List
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text(
                          'لا توجد نتائج بحث مطابقة لـ "$_searchQuery"',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        physics: const BouncingScrollPhysics(),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final subject = filtered[index];
                          final styling = _getSubjectStyling(subject.name);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.border),
                              boxShadow: AppColors.cardShadow,
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () {
                                  context.push(
                                    '/student_competitions_exams',
                                    extra: {
                                      'subjectId': subject.id,
                                      'subjectName': subject.name,
                                      'semesterName': widget.semesterName,
                                    },
                                  );
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Row(
                                    children: [
                                      // Icon Avatar
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: styling.color.withAlpha(22),
                                          borderRadius:
                                              BorderRadius.circular(16),
                                          border: Border.all(
                                            color: styling.color.withAlpha(50),
                                          ),
                                        ),
                                        child: Icon(
                                          styling.icon,
                                          size: 26,
                                          color: styling.color,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      // Subject info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              subject.name,
                                              style: const TextStyle(
                                                color: AppColors.textPrimary,
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            const Text(
                                              'تحديات تنافسية مع بنك أسئلة متجدد',
                                              style: TextStyle(
                                                color: AppColors.textSecondary,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Start challenge pill
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: styling.color.withAlpha(15),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              'دخول',
                                              style: TextStyle(
                                                color: styling.color,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Icon(
                                              Icons.arrow_forward_rounded,
                                              color: styling.color,
                                              size: 14,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.champagneGold),
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

  _SubjectStyling _getSubjectStyling(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('رياضيات') ||
        lower.contains('جبر') ||
        lower.contains('تفاضل') ||
        lower.contains('هندسة')) {
      return _SubjectStyling(
        icon: Icons.calculate_rounded,
        color: AppColors.primaryAccent,
      );
    } else if (lower.contains('فيزياء')) {
      return _SubjectStyling(
        icon: Icons.electric_bolt_rounded,
        color: const Color(0xFF7C3AED),
      );
    } else if (lower.contains('كيمياء')) {
      return _SubjectStyling(
        icon: Icons.science_rounded,
        color: AppColors.emeraldMint,
      );
    } else if (lower.contains('أحياء') || lower.contains('احياء')) {
      return _SubjectStyling(
        icon: Icons.biotech_rounded,
        color: const Color(0xFF059669),
      );
    } else if (lower.contains('قرآن') ||
        lower.contains('اسلامية') ||
        lower.contains('إسلامية')) {
      return _SubjectStyling(
        icon: Icons.menu_book_rounded,
        color: AppColors.champagneGold,
      );
    } else if (lower.contains('عربي') || lower.contains('لغة عربية')) {
      return _SubjectStyling(
        icon: Icons.translate_rounded,
        color: const Color(0xFF0284C7),
      );
    } else if (lower.contains('إنجليزي') ||
        lower.contains('انجليزي') ||
        lower.contains('english')) {
      return _SubjectStyling(
        icon: Icons.language_rounded,
        color: const Color(0xFF0D9488),
      );
    } else {
      return _SubjectStyling(
        icon: Icons.quiz_rounded,
        color: AppColors.primaryAccent,
      );
    }
  }
}

class _SubjectStyling {
  final IconData icon;
  final Color color;

  _SubjectStyling({
    required this.icon,
    required this.color,
  });
}
