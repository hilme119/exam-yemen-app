import '../../../core/utils/number_formatter.dart';
import 'dart:ui';
import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/theme/app_colors.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../domain/models/student_grade_level.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/leaderboard_provider.dart';

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  Timer? _refreshTimer;
  late TabController _tabController;
  int _selectedTabIndex = 0;

  @override
  void initState() {
    super.initState();
    final gradeLevels = StudentGradeLevel.values;
    _tabController = TabController(length: gradeLevels.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() => _selectedTabIndex = _tabController.index);
      }
    });
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      if (mounted) {
        for (final grade in StudentGradeLevel.values) {
          ref.invalidate(leaderboardProvider(grade));
        }
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gradeLevels = StudentGradeLevel.values;
    final authState = ref.watch(authStateProvider);
    final user = authState.value;
    final initialIndex = user?.gradeLevel != null
        ? gradeLevels.indexOf(user!.gradeLevel!)
        : 0;

    if (_tabController.index != (initialIndex >= 0 ? initialIndex : 0) &&
        !_tabController.indexIsChanging &&
        _selectedTabIndex == 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && initialIndex >= 0) {
          _tabController.animateTo(initialIndex);
        }
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // ─── Animated Premium Background ─────────────────────────
          Container(
            decoration: const BoxDecoration(
              gradient: AppColors.backgroundGradient,
            ),
          ),
          // Gold orb at top-left for trophy feeling
          Positioned(
            top: -60,
            left: -80,
            child: _buildGlowOrb(AppColors.orbGold, 280),
          ),
          // Purple orb at bottom-right
          Positioned(
            bottom: 80,
            right: -60,
            child: _buildGlowOrb(AppColors.primaryAccent, 240),
          ),
          // Teal orb mid
          Positioned(
            top: 300,
            right: -40,
            child: _buildGlowOrb(AppColors.orbTeal, 160),
          ),

          // ─── Main Content ─────────────────────────────────────────
          Column(
            children: [
              // ─── Custom AppBar + Header ─────────────────────
              _buildHeader(context),

              // ─── Tab Bar (Grade levels) ──────────────────────
              _buildTabBar(gradeLevels),

              const SizedBox(height: 8),

              // ─── Tab Content ─────────────────────────────────
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: gradeLevels.map((grade) {
                    return _LeaderboardListView(
                      gradeLevel: grade,
                      currentUser: user,
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        child: Column(
          children: [
            // Top Row
            Row(
              children: [
                // Back button
                GestureDetector(
                  onTap: () {
                    if (context.canPop()) {
                      context.pop();
                    } else {
                      context.go('/student_dashboard');
                    }
                  },
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.surface.withAlpha(180),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.textPrimary,
                      size: 18,
                    ),
                  ),
                ),
                const Spacer(),
                // Live Badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.success.withAlpha(30),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: AppColors.success.withAlpha(80), width: 1.2),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.success.withAlpha(180),
                              blurRadius: 6,
                            )
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'مباشر',
                        style: TextStyle(
                          color: AppColors.success,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Trophy Icon + Title
            Stack(
              alignment: Alignment.center,
              children: [
                // Glow behind trophy
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.orbGold.withAlpha(60),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFD700).withAlpha(120),
                        blurRadius: 30,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.emoji_events_rounded,
                    color: Colors.white,
                    size: 38,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'لوحة الصدارة',
              style: TextStyle(
                color: AppColors.textPrimary, fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'تحدَّ زملاءك وتصدَّر القائمة!',
              style: TextStyle(
                color: AppColors.textTertiary,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBar(List<StudentGradeLevel> gradeLevels) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 46,
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: AppColors.surface.withAlpha(180),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: TabBar(
          controller: _tabController,
          isScrollable: gradeLevels.length > 4,
          dividerColor: Colors.transparent,
          indicatorSize: TabBarIndicatorSize.tab,
          indicator: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.cyanGlow, AppColors.secondaryAccent],
            ),
            borderRadius: BorderRadius.circular(11),
            boxShadow: [
              BoxShadow(
                color: AppColors.cyanGlow.withAlpha(80),
                blurRadius: 12,
              )
            ],
          ),
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
          tabs: gradeLevels.map((g) => Tab(text: g.displayName)).toList(),
        ),
      ),
    );
  }

  Widget _buildGlowOrb(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withAlpha(20),
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
        child: Container(color: Colors.transparent),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  LEADERBOARD LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
class _LeaderboardListView extends ConsumerWidget {
  final StudentGradeLevel gradeLevel;
  final dynamic currentUser;

  const _LeaderboardListView({
    required this.gradeLevel,
    required this.currentUser,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider(gradeLevel));

    return leaderboardAsync.when(
      data: (students) {
        if (students.isEmpty) {
          return _buildEmpty();
        }

        final top3 = students.take(min(3, students.length)).toList();
        final rest = students.length > 3 ? students.sublist(3) : [];

        return CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ─── Top 3 Podium ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: _buildPodium(top3),
              ),
            ),

            // ─── Rest of the list ───────────────────────────────────
            if (rest.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      final student = rest[i];
                      final rank = i + 4;
                      final isCurrentUser =
                          student['userId'] == currentUser?.id;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _buildListItem(
                          student,
                          rank,
                          isCurrentUser,
                        ),
                      );
                    },
                    childCount: rest.length,
                  ),
                ),
              ),
          ],
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.cyanGlow),
      ),
      error: (e, st) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 60),
              const SizedBox(height: 16),
              Text(
                'حدث خطأ: ${ErrorHandler.getErrorMessage(e)}',
                style: const TextStyle(color: AppColors.error),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surface.withAlpha(150),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: Icon(
              Icons.emoji_events_outlined,
              size: 48,
              color: Colors.white.withAlpha(60),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'لم يتم تسجيل أي نقاط بعد',
            style: TextStyle(color: AppColors.textTertiary, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            'كن أول من يتصدر القائمة!',
            style: TextStyle(
              color: AppColors.cyanGlow.withAlpha(180),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  // ─── PODIUM (Top 3) ──────────────────────────────────────────────────────
  Widget _buildPodium(List<Map<String, dynamic>> top3) {
    final gold = top3.isNotEmpty ? top3[0] : null;
    final silver = top3.length > 1 ? top3[1] : null;
    final bronze = top3.length > 2 ? top3[2] : null;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.orbGold.withAlpha(18),
            AppColors.surface.withAlpha(150),
          ],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: const Color(0xFFFFD700).withAlpha(50),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          const Text(
            '🏆 المتصدرون',
            style: TextStyle(
              color: Color(0xFFFFD700),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Silver (2nd)
              if (silver != null)
                _PodiumItem(
                  student: silver,
                  rank: 2,
                  height: 110,
                  podiumColor: const Color(0xFFC0C0C0),
                  avatarSize: 54,
                )
              else
                const SizedBox(width: 90),

              // Gold (1st) - tallest
              if (gold != null)
                _PodiumItem(
                  student: gold,
                  rank: 1,
                  height: 140,
                  podiumColor: const Color(0xFFFFD700),
                  avatarSize: 68,
                )
              else
                const SizedBox(width: 90),

              // Bronze (3rd)
              if (bronze != null)
                _PodiumItem(
                  student: bronze,
                  rank: 3,
                  height: 85,
                  podiumColor: const Color(0xFFCD7F32),
                  avatarSize: 50,
                )
              else
                const SizedBox(width: 90),
            ],
          ),
        ],
      ),
    );
  }

  // ─── List Item (4th onwards) ──────────────────────────────────────────────
  Widget _buildListItem(
      Map<String, dynamic> student, int rank, bool isCurrentUser) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isCurrentUser
            ? AppColors.cyanGlow.withAlpha(18)
            : AppColors.surface.withAlpha(150),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCurrentUser
              ? AppColors.cyanGlow.withAlpha(80)
              : AppColors.glassBorder,
          width: isCurrentUser ? 1.5 : 1,
        ),
        boxShadow: isCurrentUser
            ? [
                BoxShadow(
                  color: AppColors.cyanGlow.withAlpha(30),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                )
              ]
            : null,
      ),
      child: Row(
        children: [
          // Rank number
          SizedBox(
            width: 36,
            child: Text(
              '#$rank',
              style: TextStyle(
                color: isCurrentUser ? AppColors.cyanGlow : AppColors.textTertiary,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 12),
          // Avatar
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  AppColors.primaryAccent.withAlpha(60),
                  AppColors.secondaryAccent.withAlpha(40),
                ],
              ),
              border: Border.all(
                color: isCurrentUser ? AppColors.cyanGlow : AppColors.glassBorder,
                width: 1.5,
              ),
            ),
            child: student['profilePictureUrl'] != null
                ? ClipOval(
                    child: Image.network(
                      student['profilePictureUrl'],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.person,
                        color: AppColors.textTertiary,
                        size: 22,
                      ),
                    ),
                  )
                : const Icon(Icons.person, color: AppColors.textTertiary, size: 22),
          ),
          const SizedBox(width: 14),
          // Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['name'] ?? 'طالب',
                  style: TextStyle(
                    color: isCurrentUser ? AppColors.primaryAccent : AppColors.textPrimary,
                    fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.w600,
                    fontSize: 15,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (isCurrentUser) ...[
                  const SizedBox(height: 2),
                  const Text(
                    'أنت',
                    style: TextStyle(
                      color: AppColors.cyanGlow,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ],
            ),
          ),
          // Score
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              gradient: isCurrentUser
                  ? const LinearGradient(
                      colors: [AppColors.cyanGlow, AppColors.secondaryAccent],
                    )
                  : null,
              color: isCurrentUser ? null : AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: isCurrentUser
                  ? null
                  : Border.all(color: AppColors.glassBorder),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  NumberFormatter.formatNumber(student['totalScore']),
                  style: TextStyle(
                    color: isCurrentUser
                        ? Colors.black
                        : AppColors.cyanGlow,
                    fontWeight: FontWeight.bold,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'نقطة',
                  style: TextStyle(
                    color: isCurrentUser
                        ? Colors.black.withAlpha(180)
                        : AppColors.textTertiary,
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
}

// ─────────────────────────────────────────────────────────────────────────────
//  PODIUM ITEM WIDGET
// ─────────────────────────────────────────────────────────────────────────────
class _PodiumItem extends StatelessWidget {
  final Map<String, dynamic> student;
  final int rank;
  final double height;
  final Color podiumColor;
  final double avatarSize;

  const _PodiumItem({
    required this.student,
    required this.rank,
    required this.height,
    required this.podiumColor,
    required this.avatarSize,
  });

  IconData get _medalIcon {
    if (rank == 1) return Icons.looks_one_rounded;
    if (rank == 2) return Icons.looks_two_rounded;
    return Icons.looks_3_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar with glow
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            Container(
              width: avatarSize + 6,
              height: avatarSize + 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: podiumColor.withAlpha(100),
                    blurRadius: 20,
                    spreadRadius: 3,
                  ),
                ],
                gradient: LinearGradient(
                  colors: [
                    podiumColor.withAlpha(100),
                    podiumColor.withAlpha(40),
                  ],
                ),
              ),
            ),
            Container(
              width: avatarSize,
              height: avatarSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: podiumColor, width: 2.5),
                color: AppColors.surface,
              ),
              child: student['profilePictureUrl'] != null
                  ? ClipOval(
                      child: Image.network(
                        student['profilePictureUrl'],
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Icon(
                          Icons.person,
                          color: AppColors.textTertiary,
                          size: avatarSize * 0.45,
                        ),
                      ),
                    )
                  : Icon(
                      Icons.person,
                      color: AppColors.textTertiary,
                      size: avatarSize * 0.45,
                    ),
            ),
            // Medal badge
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: podiumColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 2),
                ),
                child: Center(
                  child: Text(
                    '$rank',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        // Name
        SizedBox(
          width: 90,
          child: Text(
            student['name'] ?? 'طالب',
            style: const TextStyle(
              color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13, ), textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(height: 6),
        // Score Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: podiumColor.withAlpha(30),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: podiumColor.withAlpha(80), width: 1),
          ),
          child: Text(
            '${NumberFormatter.formatNumber(student["totalScore"])} نقطة',
            style: TextStyle(
              color: podiumColor,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
        const SizedBox(height: 10),
        // Podium base
        Container(
          width: 80,
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                podiumColor.withAlpha(80),
                podiumColor.withAlpha(25),
              ],
            ),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(12),
              bottom: Radius.circular(4),
            ),
            border: Border.all(color: podiumColor.withAlpha(100), width: 1),
          ),
          child: Center(
            child: Icon(_medalIcon, color: podiumColor, size: 28),
          ),
        ),
      ],
    );
  }
}
