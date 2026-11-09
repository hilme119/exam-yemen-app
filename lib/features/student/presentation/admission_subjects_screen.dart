import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/error_handler.dart';
import '../providers/admission_provider.dart';
import '../../../core/theme/app_colors.dart';

class AdmissionSubjectsScreen extends ConsumerWidget {
  final String majorId;
  final String majorName;

  const AdmissionSubjectsScreen({
    super.key,
    required this.majorId,
    required this.majorName,
  });

  IconData _getSubjectIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('english') || lower.contains('إنجليزي') || lower.contains('انجليزي')) {
      return Icons.translate_rounded;
    } else if (lower.contains('رياضيات') || lower.contains('جبر') || lower.contains('تفاضل')) {
      return Icons.calculate_rounded;
    } else if (lower.contains('كيمياء')) {
      return Icons.science_rounded;
    } else if (lower.contains('فيزياء')) {
      return Icons.bolt_rounded;
    } else if (lower.contains('أحياء') || lower.contains('احياء')) {
      return Icons.biotech_rounded;
    } else if (lower.contains('عربي') || lower.contains('لغة عربية')) {
      return Icons.history_edu_rounded;
    }
    return Icons.menu_book_rounded;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(admissionSubjectsProvider(majorId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'مواد قبول $majorName',
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 18,
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
                // Top Header Pill
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
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.admission.withAlpha(20),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.assignment_turned_in_rounded,
                            color: AppColors.admission,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'اختبارات المفاضلة لـ $majorName',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 3),
                              const Text(
                                'اختر المادة لعرض نماذج اختبارات القبول والمفاضلة المعتمدة.',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Subjects Grid
                Expanded(
                  child: subjectsAsync.when(
                    data: (subjects) {
                      if (subjects.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: AppColors.admission.withAlpha(15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.menu_book_rounded,
                                    size: 48,
                                    color: AppColors.admission,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'لا توجد مواد قبول لهذا التخصص حالياً',
                                  style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'سيتم تحديث النماذج والمواد قريباً.',
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

                      return RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(admissionSubjectsProvider(majorId));
                          await ref.read(admissionSubjectsProvider(majorId).future);
                        },
                        color: AppColors.admission,
                        backgroundColor: AppColors.surface,
                        child: GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 14,
                            mainAxisSpacing: 14,
                            childAspectRatio: 0.95,
                          ),
                          itemCount: subjects.length,
                          itemBuilder: (context, index) {
                            final subject = subjects[index];
                            final icon = _getSubjectIcon(subject.name);
                            final colors = [
                              AppColors.admission,
                              AppColors.primaryAccent,
                              AppColors.champagneGold,
                              AppColors.curricula,
                              AppColors.services,
                            ];
                            final color = colors[index % colors.length];

                            return Container(
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(color: AppColors.border, width: 1.2),
                                boxShadow: AppColors.cardShadow,
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: () {
                                    context.push(
                                      '/student_admission_exams',
                                      extra: {
                                        'subjectId': subject.id,
                                        'subjectName': subject.name,
                                      },
                                    );
                                  },
                                  borderRadius: BorderRadius.circular(22),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          width: 56,
                                          height: 56,
                                          decoration: BoxDecoration(
                                            color: color.withAlpha(22),
                                            borderRadius: BorderRadius.circular(18),
                                            border: Border.all(
                                              color: color.withAlpha(50),
                                              width: 1.2,
                                            ),
                                          ),
                                          child: Icon(icon, color: color, size: 28),
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          subject.name,
                                          textAlign: TextAlign.center,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: AppColors.textPrimary,
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: color.withAlpha(15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'نماذج قبول',
                                            style: TextStyle(
                                              color: color,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                            ),
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
                      );
                    },
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.admission),
                    ),
                    error: (error, stackTrace) => Center(
                      child: Text(
                        'حدث خطأ: ${ErrorHandler.getErrorMessage(error)}',
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
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
