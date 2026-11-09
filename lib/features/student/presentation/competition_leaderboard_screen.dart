import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/number_formatter.dart';
import '../../../../domain/models/competition_models.dart';
import '../providers/competition_leaderboard_provider.dart';
import '../../auth/providers/auth_provider.dart';

class CompetitionLeaderboardScreen extends ConsumerStatefulWidget {
  const CompetitionLeaderboardScreen({super.key});

  @override
  ConsumerState<CompetitionLeaderboardScreen> createState() =>
      _CompetitionLeaderboardScreenState();
}

class _CompetitionLeaderboardScreenState
    extends ConsumerState<CompetitionLeaderboardScreen> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 20), (timer) {
      if (mounted) {
        ref.invalidate(allCompetitionSemestersProvider);
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final semestersAsync = ref.watch(allCompetitionSemestersProvider);
    final user = ref.watch(authStateProvider).value;

    return semestersAsync.when(
      data: (semesters) {
        if (semesters.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: _buildAppBar(context),
            body: Center(
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
                        Icons.emoji_events_outlined,
                        size: 56,
                        color: AppColors.champagneGold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'لا توجد مسابقات حالياً لعرض لوحة الصدارة',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'ترقبوا انطلاق التحديات والمسابقات قريباً!',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        int initialIndex = 0;
        if (user != null && user.gradeLevel != null) {
          initialIndex = semesters.indexWhere(
            (s) => s.name == user.gradeLevel?.name,
          );
          if (initialIndex == -1) initialIndex = 0;
        }

        return DefaultTabController(
          length: semesters.length,
          initialIndex: initialIndex,
          child: Scaffold(
            backgroundColor: AppColors.background,
            appBar: _buildTabbedAppBar(context, semesters),
            body: TabBarView(
              children: semesters.map((semester) {
                return _CompetitionLeaderboardListView(semester: semester);
              }).toList(),
            ),
          ),
        );
      },
      loading: () => Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(context),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.champagneGold),
        ),
      ),
      error: (error, st) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(context),
        body: Center(
          child: Text(
            'حدث خطأ: ${ErrorHandler.getErrorMessage(error)}',
            style: const TextStyle(color: AppColors.error),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
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
        onPressed: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/student_dashboard');
          }
        },
      ),
      title: const Text(
        'لوحة صدارة المتفوقين',
        style: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  PreferredSizeWidget _buildTabbedAppBar(
    BuildContext context,
    List<CompetitionSemesterModel> semesters,
  ) {
    return AppBar(
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
        onPressed: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/student_dashboard');
          }
        },
      ),
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.emoji_events_rounded,
            color: AppColors.champagneGold,
            size: 22,
          ),
          const SizedBox(width: 8),
          const Text(
            'لوحة صدارة المتفوقين',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.emeraldMint.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'مباشر',
              style: TextStyle(
                color: AppColors.emeraldMint,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: Container(
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: AppColors.champagneGold,
            indicatorWeight: 3,
            labelColor: const Color(0xFF92400E),
            unselectedLabelColor: AppColors.textSecondary,
            labelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 14,
            ),
            tabs: semesters.map<Widget>((s) => Tab(text: s.name)).toList(),
          ),
        ),
      ),
    );
  }
}

class _CompetitionLeaderboardListView extends ConsumerWidget {
  final CompetitionSemesterModel semester;
  const _CompetitionLeaderboardListView({required this.semester});

  String _formatDuration(int seconds) {
    if (seconds >= 999999) return 'غير محدد';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    if (m == 0) return '${NumberFormatter.toEnDigits(s)} ث';
    return '${NumberFormatter.toEnDigits(m)} د و ${NumberFormatter.toEnDigits(s)} ث';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync =
        ref.watch(competitionLeaderboardProvider(semester));

    return leaderboardAsync.when(
      data: (competitions) {
        if (competitions.isEmpty) {
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
                      Icons.military_tech_outlined,
                      size: 56,
                      color: AppColors.champagneGold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'التحديات بانتظار أبطالها!',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'كن أول من يخوض التحديات في هذا المسار وتصدر القائمة.',
                    textAlign: TextAlign.center,
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

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          physics: const BouncingScrollPhysics(),
          itemCount: competitions.length,
          itemBuilder: (context, compIndex) {
            final comp = competitions[compIndex];
            final String examName = comp['examName'] ?? '';
            final String subjectName = comp['subjectName'] ?? '';
            final List<Map<String, dynamic>> winners =
                List<Map<String, dynamic>>.from(comp['winners'] ?? []);

            return Container(
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
                boxShadow: AppColors.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Competition Header Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(22),
                      ),
                      border: const Border(
                        bottom: BorderSide(color: AppColors.border),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.champagneGold.withAlpha(25),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.emoji_events_rounded,
                            color: AppColors.champagneGold,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                examName,
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                subjectName,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            '${NumberFormatter.toEnDigits(winners.length)} فائزين',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Winners List
                  if (winners.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(28.0),
                      child: Center(
                        child: Text(
                          'لا يوجد فائزين مسجلين لهذا التحدي حتى الآن.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(12.0),
                      itemCount: winners.length,
                      separatorBuilder: (context, index) =>
                          const Divider(height: 1, color: AppColors.border),
                      itemBuilder: (context, index) {
                        final student = winners[index];
                        final rank = index + 1;
                        final isTop3 = rank <= 3;

                        Color rankBadgeColor;
                        Color rankTextColor;
                        IconData rankIcon;

                        if (rank == 1) {
                          rankBadgeColor = const Color(0xFFFEF3C7); // Gold Light
                          rankTextColor = const Color(0xFFB45309);  // Gold Dark
                          rankIcon = Icons.military_tech_rounded;
                        } else if (rank == 2) {
                          rankBadgeColor = const Color(0xFFF1F5F9); // Silver Light
                          rankTextColor = const Color(0xFF475569);  // Silver Dark
                          rankIcon = Icons.military_tech_rounded;
                        } else if (rank == 3) {
                          rankBadgeColor = const Color(0xFFFFEDD5); // Bronze Light
                          rankTextColor = const Color(0xFFC2410C);  // Bronze Dark
                          rankIcon = Icons.military_tech_rounded;
                        } else {
                          rankBadgeColor = AppColors.surfaceLight;
                          rankTextColor = AppColors.textSecondary;
                          rankIcon = Icons.tag_rounded;
                        }

                        final points =
                            student['earnedPoints'] ?? student['totalScore'] ?? 0;

                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          child: Row(
                            children: [
                              // Rank Badge
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: rankBadgeColor,
                                  borderRadius: BorderRadius.circular(10),
                                  border: isTop3
                                      ? Border.all(
                                          color: rankTextColor.withAlpha(80),
                                        )
                                      : null,
                                ),
                                child: Center(
                                  child: isTop3
                                      ? Icon(
                                          rankIcon,
                                          color: rankTextColor,
                                          size: 20,
                                        )
                                      : Text(
                                          '#${NumberFormatter.toEnDigits(rank)}',
                                          style: TextStyle(
                                            color: rankTextColor,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Student Avatar
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: AppColors.surfaceLight,
                                backgroundImage:
                                    student['profilePictureUrl'] != null
                                        ? NetworkImage(
                                            student['profilePictureUrl'],
                                          )
                                        : null,
                                child: student['profilePictureUrl'] == null
                                    ? const Icon(
                                        Icons.person_rounded,
                                        color: AppColors.textTertiary,
                                        size: 20,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              // Student Name & Time
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      student['name'] ?? 'متسابق',
                                      style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontWeight: isTop3
                                            ? FontWeight.bold
                                            : FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.timer_outlined,
                                          color: AppColors.textTertiary,
                                          size: 13,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          _formatDuration(
                                            student['durationSeconds'] ??
                                                999999,
                                          ),
                                          style: const TextStyle(
                                            color: AppColors.textSecondary,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              // Points Pill
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: isTop3
                                      ? rankBadgeColor
                                      : AppColors.surfaceLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      NumberFormatter.toEnDigits(points),
                                      style: TextStyle(
                                        color: isTop3
                                            ? rankTextColor
                                            : AppColors.textPrimary,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'نقطة',
                                      style: TextStyle(
                                        color: isTop3
                                            ? rankTextColor
                                            : AppColors.textSecondary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            );
          },
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.champagneGold),
      ),
      error: (e, st) => Center(
        child: Text(
          'حدث خطأ في جلب لوحة الصدارة: ${ErrorHandler.getErrorMessage(e)}',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
    );
  }
}
