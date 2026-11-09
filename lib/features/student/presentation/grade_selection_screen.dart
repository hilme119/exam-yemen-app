import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class GradeSelectionScreen extends ConsumerWidget {
  const GradeSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'اختر مسارك الدراسي',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          physics: const BouncingScrollPhysics(),
          children: [
            // Top Clean Header Badge (بدون دش كلام زائد)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.primaryAccent.withAlpha(15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primaryAccent.withAlpha(40), width: 1),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.school_rounded,
                    color: AppColors.primaryAccent,
                    size: 22,
                  ),
                  SizedBox(width: 10),
                  Text(
                    'اختر مرحلتك التعليمية لعرض المواد المتاحة',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Grade List Items
            _buildGradeCard(
              context: context,
              title: 'الصف التاسع الأساسي',
              tagText: 'الشهادة الأساسية',
              icon: Icons.school_rounded,
              accentColor: AppColors.curricula,
              gradient: AppColors.curriculaGradient,
              grade: 'grade9',
              stream: null,
            ),
            const SizedBox(height: 12),
            _buildGradeCard(
              context: context,
              title: 'الثالث الثانوي (القسم العلمي)',
              tagText: 'القسم العلمي',
              icon: Icons.science_rounded,
              accentColor: AppColors.primaryAccent,
              gradient: AppColors.curriculaGradient,
              grade: 'grade12',
              stream: 'scientific',
            ),
            const SizedBox(height: 12),
            _buildGradeCard(
              context: context,
              title: 'الثالث الثانوي (القسم الأدبي)',
              tagText: 'القسم الأدبي',
              icon: Icons.menu_book_rounded,
              accentColor: AppColors.competition,
              gradient: AppColors.competitionGradient,
              grade: 'grade12',
              stream: 'literary',
            ),
            const SizedBox(height: 12),
            _buildGradeCard(
              context: context,
              title: 'الثالث الثانوي - علمي (إنجليزي)',
              tagText: 'English Track',
              icon: Icons.biotech_rounded,
              accentColor: AppColors.services,
              gradient: AppColors.servicesGradient,
              grade: 'grade12_english',
              stream: 'scientific',
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildGradeCard({
    required BuildContext context,
    required String title,
    required String tagText,
    required IconData icon,
    required Color accentColor,
    required LinearGradient gradient,
    required String grade,
    String? stream,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: accentColor.withAlpha(45),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            context.push(
              '/student_subject_selection',
              extra: {'grade': grade, 'stream': stream},
            );
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // Icon with gradient background
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: gradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: accentColor.withAlpha(35),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 14),

                // Title
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),

                // Tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: accentColor.withAlpha(15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: accentColor.withAlpha(35), width: 1),
                  ),
                  child: Text(
                    tagText,
                    style: TextStyle(
                      color: accentColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Arrow
                const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: AppColors.textSecondary,
                  size: 14,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
