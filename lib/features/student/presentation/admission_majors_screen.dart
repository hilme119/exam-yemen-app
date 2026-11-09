import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/error_handler.dart';
import '../providers/admission_provider.dart';
import '../../../core/theme/app_colors.dart';

class AdmissionMajorsScreen extends ConsumerStatefulWidget {
  final String universityId;
  final String universityName;

  const AdmissionMajorsScreen({
    super.key,
    required this.universityId,
    required this.universityName,
  });

  @override
  ConsumerState<AdmissionMajorsScreen> createState() =>
      _AdmissionMajorsScreenState();
}

class _AdmissionMajorsScreenState
    extends ConsumerState<AdmissionMajorsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  IconData _getMajorIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('حاسوب') || lower.contains('معلومات') || lower.contains('it') || lower.contains('ذكاء')) {
      return Icons.computer_rounded;
    } else if (lower.contains('أسنان') || lower.contains('اسنان')) {
      return Icons.health_and_safety_rounded;
    } else if (lower.contains('طب') || lower.contains('صحي')) {
      return Icons.local_hospital_rounded;
    } else if (lower.contains('هندس') || lower.contains('معمار')) {
      return Icons.architecture_rounded;
    } else if (lower.contains('صيدل')) {
      return Icons.medication_rounded;
    } else if (lower.contains('بترول') || lower.contains('موارد') || lower.contains('جيولوج')) {
      return Icons.terrain_rounded;
    } else if (lower.contains('لغات') || lower.contains('ترجم')) {
      return Icons.translate_rounded;
    } else if (lower.contains('تجار') || lower.contains('إدار') || lower.contains('محاسب')) {
      return Icons.account_balance_wallet_rounded;
    } else if (lower.contains('إعلام') || lower.contains('صحاف')) {
      return Icons.campaign_rounded;
    } else if (lower.contains('قانون') || lower.contains('شريع')) {
      return Icons.gavel_rounded;
    } else if (lower.contains('تربي')) {
      return Icons.school_rounded;
    }
    return Icons.domain_rounded;
  }

  Color _getMajorColor(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('طب') || lower.contains('صحي') || lower.contains('أسنان') || lower.contains('اسنان')) {
      return AppColors.admission;
    } else if (lower.contains('حاسوب') || lower.contains('it')) {
      return AppColors.primaryAccent;
    } else if (lower.contains('هندس') || lower.contains('بترول')) {
      return AppColors.champagneGold;
    } else if (lower.contains('صيدل')) {
      return AppColors.curricula;
    } else if (lower.contains('لغات') || lower.contains('قانون')) {
      return AppColors.services;
    }
    return AppColors.primaryAccent;
  }

  @override
  Widget build(BuildContext context) {
    final majorsAsync = ref.watch(majorsProvider(widget.universityId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.universityName,
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
                // Header Guidance Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                  child: Column(
                    children: [
                      Container(
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
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.admission.withAlpha(20),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(
                                Icons.school_rounded,
                                color: AppColors.admission,
                                size: 26,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'الكليات والتخصصات المتاحة',
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    'اختر الكلية لعرض مواد اختبار المفاضلة والنماذج الرسمية لـ ${widget.universityName}.',
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                      height: 1.4,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Search Field
                      Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border, width: 1),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          decoration: InputDecoration(
                            hintText: 'ابحث عن كلية أو تخصص (مثلاً: حاسوب، طب، هندسة...)...',
                            hintStyle: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              color: AppColors.admission,
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

                // Majors List
                Expanded(
                  child: majorsAsync.when(
                    data: (majors) {
                      var filtered = majors;
                      if (_searchQuery.isNotEmpty) {
                        filtered = filtered
                            .where((m) => m.name.toLowerCase().contains(_searchQuery))
                            .toList();
                      }

                      if (filtered.isEmpty) {
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
                                    Icons.category_outlined,
                                    color: AppColors.admission,
                                    size: 48,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'لا توجد تخصصات مطابقة للبحث',
                                  style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'تأكد من كتابة اسم الكلية أو التخصص بشكل صحيح.',
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
                          ref.invalidate(majorsProvider(widget.universityId));
                          await ref.read(majorsProvider(widget.universityId).future);
                        },
                        color: AppColors.admission,
                        backgroundColor: AppColors.surface,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final major = filtered[index];
                            final icon = _getMajorIcon(major.name);
                            final accentColor = _getMajorColor(major.name);

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12.0),
                              child: Container(
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
                                      context.push(
                                        '/student_admission_subjects',
                                        extra: {
                                          'majorId': major.id,
                                          'majorName': major.name,
                                        },
                                      );
                                    },
                                    borderRadius: BorderRadius.circular(20),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                                      child: Row(
                                        children: [
                                          // Dynamic Specialty Icon
                                          Container(
                                            width: 50,
                                            height: 50,
                                            decoration: BoxDecoration(
                                              color: accentColor.withAlpha(22),
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(
                                                color: accentColor.withAlpha(50),
                                                width: 1.2,
                                              ),
                                            ),
                                            child: Icon(icon, color: accentColor, size: 26),
                                          ),
                                          const SizedBox(width: 14),

                                          // Major Name & Details
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  major.name,
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
                                                        color: accentColor.withAlpha(15),
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: Text(
                                                        'اختبارات مفاضلة',
                                                        style: TextStyle(
                                                          color: accentColor,
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w700,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    const Text(
                                                      'نماذج السنوات السابقة',
                                                      style: TextStyle(
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
                                          const SizedBox(width: 10),

                                          // Arrow
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
                              ),
                            );
                          },
                        ),
                      );
                    },
                    loading: () => const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(
                            color: AppColors.admission,
                            strokeWidth: 3,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'جاري مزامنة الكليات والتخصصات...',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    error: (error, stackTrace) => Center(
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
                              'تعذر تحميل التخصصات',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              ErrorHandler.getErrorMessage(error),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 20),
                            ElevatedButton.icon(
                              onPressed: () => ref.invalidate(majorsProvider(widget.universityId)),
                              icon: const Icon(Icons.refresh_rounded, size: 18),
                              label: const Text('إعادة المحاولة'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.admission,
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
