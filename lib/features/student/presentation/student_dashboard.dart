import '../../../core/utils/number_formatter.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/providers/app_update_provider.dart';
import '../providers/question_feedback_provider.dart';
import '../../../core/services/firebase_messaging_service.dart';
import '../providers/notification_provider.dart';
import '../presentation/contact_admin_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/leaderboard_provider.dart';
import '../providers/result_provider.dart';
import '../../../domain/models/user_model.dart';
import 'package:showcaseview/showcaseview.dart';
import '../../../core/theme/app_colors.dart';

class StudentDashboard extends ConsumerStatefulWidget {
  const StudentDashboard({super.key});

  @override
  ConsumerState<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends ConsumerState<StudentDashboard>
    with SingleTickerProviderStateMixin {
  int _lastNotificationReadTime = 0;
  Timer? _refreshTimer;
  bool _tourStarted = false;

  final GlobalKey _curriculaKey = GlobalKey();
  final GlobalKey _admissionKey = GlobalKey();
  final GlobalKey _competitionKey = GlobalKey();

  // Animation
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _loadLastReadTime();

    // Setup entrance animation
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    ));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      FirebaseMessagingService().initialize();
      _checkForUpdate();
      _animController.forward();
    });
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted) {
        ref.invalidate(notificationsProvider);
        ref.invalidate(studentMessagesProvider);
        ref.invalidate(studentFeedbacksProvider);
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _loadLastReadTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (mounted) {
        setState(() {
          _lastNotificationReadTime =
              prefs.getInt('last_notification_read_time') ?? 0;
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _checkForUpdate() async {
    try {
      final updateInfo = await ref.read(appUpdateProvider.future);
      if (updateInfo != null && updateInfo.updateAvailable) {
        if (!mounted) return;
        _showUpdateDialog(updateInfo);
      }
    } catch (e) {
      // Ignore
    }
  }

  void _showUpdateDialog(AppUpdateInfo updateInfo) {
    showDialog(
      context: context,
      barrierDismissible: !updateInfo.forceUpdate,
      builder: (context) {
        return PopScope(
          canPop: !updateInfo.forceUpdate,
          child: AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.system_update_rounded,
                    color: AppColors.warning,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'تحديث جديد متوفر',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'لقد أطلقنا إصداراً جديداً من التطبيق.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent.withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.primaryAccent.withAlpha(60),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.new_releases_rounded,
                          color: AppColors.primaryAccent, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'الإصدار ${updateInfo.latestVersion}',
                        style: const TextStyle(
                          color: AppColors.primaryAccent,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                if (updateInfo.releaseNotes != null &&
                    updateInfo.releaseNotes!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text(
                    'ما الجديد؟',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      updateInfo.releaseNotes!,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            actions: [
              if (!updateInfo.forceUpdate)
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'لاحقاً',
                    style: TextStyle(
                      color: AppColors.textTertiary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ElevatedButton.icon(
                onPressed: () async {
                  final url = updateInfo.downloadUrl;
                  if (url.isNotEmpty) {
                    final uri = Uri.parse(url);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  }
                },
                icon: const Icon(Icons.download_rounded, size: 20),
                label: const Text('تحديث الآن'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryAccent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openTelegram() async {
    final uri = Uri.parse("https://t.me/v_99c");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _openWhatsApp() async {
    final uri = Uri.parse("https://wa.me/967778392107");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.value;

    return ShowCaseWidget(
      builder: (context) {
        if (!_tourStarted) {
          _tourStarted = true;
          WidgetsBinding.instance.addPostFrameCallback((_) async {
            final prefs = await SharedPreferences.getInstance();
            final hasSeenTour =
                prefs.getBool('has_seen_dashboard_tour') ?? false;
            if (!hasSeenTour) {
              if (mounted) {
                ShowCaseWidget.of(context).startShowCase([
                  _curriculaKey,
                  _admissionKey,
                  _competitionKey,
                ]);
                await prefs.setBool('has_seen_dashboard_tour', true);
              }
            }
          });
        }

        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle.dark.copyWith(
            statusBarColor: Colors.transparent,
          ),
          child: Scaffold(
            backgroundColor: AppColors.background,
            body: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: SafeArea(
                  child: CustomScrollView(
                    physics: const BouncingScrollPhysics(
                      parent: AlwaysScrollableScrollPhysics(),
                    ),
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildHeader(user),
                            const SizedBox(height: 24),
                            _buildStatsCard(user),
                            const SizedBox(height: 32),

                            // Main Learning Paths
                            _buildSectionHeader(
                              'المسار التعليمي',
                              icon: Icons.auto_stories_rounded,
                            ),
                            const SizedBox(height: 14),
                            _buildEducationalPath(),
                            const SizedBox(height: 14),
                            _buildAdmissionPath(),
                            const SizedBox(height: 32),

                            // Competitions
                            _buildSectionHeader(
                              'المنافسة والتحديات',
                              icon: Icons.emoji_events_rounded,
                              iconColor: AppColors.competition,
                            ),
                            const SizedBox(height: 14),
                            _buildCompetitionsPath(),
                            const SizedBox(height: 32),

                            // Quick Services
                            _buildSectionHeader(
                              'خدمات سريعة',
                              icon: Icons.grid_view_rounded,
                            ),
                            const SizedBox(height: 14),
                            _buildServicesGrid(),
                            const SizedBox(height: 32),

                            // Contact
                            _buildSectionHeader(
                              'تواصل معنا',
                              icon: Icons.chat_bubble_outline_rounded,
                            ),
                            const SizedBox(height: 14),
                            _buildSocialLinks(),
                            const SizedBox(height: 100),
                          ]),
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
    );
  }

  // ─── Section Header ──────────────────────────────────────────────────
  Widget _buildSectionHeader(String title,
      {IconData? icon, Color? iconColor}) {
    return Row(
      children: [
        if (icon != null) ...[
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: (iconColor ?? AppColors.primaryAccent).withAlpha(25),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: iconColor ?? AppColors.primaryAccent,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
        ],
        Text(
          title,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
          ),
        ),
      ],
    );
  }

  // ─── Header ──────────────────────────────────────────────────────────
  Widget _buildHeader(UserModel? user) {
    final String name = user != null ? user.name : 'ضيف';
    final String gradeLabel = user?.gradeLevel != null
        ? _getGradeLevelLabel(user!.gradeLevel!.name)
        : '';

    // Notification count
    final notificationsAsync = ref.watch(notificationsProvider);
    int unreadCount = 0;
    notificationsAsync.whenData((list) {
      unreadCount += list
          .where(
            (n) =>
                n.timestamp.millisecondsSinceEpoch > _lastNotificationReadTime,
          )
          .length;
    });

    return Row(
      children: [
        // Avatar
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: AppColors.curriculaGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryAccent.withAlpha(40),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: user?.profilePictureUrl != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    user!.profilePictureUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => const Icon(
                      Icons.person_rounded,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                )
              : const Icon(
                  Icons.person_rounded,
                  color: Colors.white,
                  size: 26,
                ),
        ),
        const SizedBox(width: 14),

        // Name & Grade
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'مرحباً، $name 👋',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.3,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                gradeLabel.isNotEmpty ? gradeLabel : 'جاهز للتقدم اليوم؟',
                style: const TextStyle(
                  color: AppColors.textTertiary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),

        // Action buttons
        _buildHeaderAction(
          icon: Icons.language_rounded,
          onTap: () async {
            final uri = Uri.parse(
                "https://yemen-national-exam-system.web.app/");
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            }
          },
        ),
        const SizedBox(width: 10),
        _buildNotificationButton(unreadCount),
      ],
    );
  }

  Widget _buildHeaderAction({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassBorder, width: 1),
          ),
          child: Icon(icon, color: AppColors.textSecondary, size: 22),
        ),
      ),
    );
  }

  Widget _buildNotificationButton(int unreadCount) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () async {
          final prefs = await SharedPreferences.getInstance();
          final now = DateTime.now().millisecondsSinceEpoch;
          await prefs.setInt('last_notification_read_time', now);
          if (mounted) {
            setState(() {
              _lastNotificationReadTime = now;
            });
            context.push('/student_notifications');
          }
        },
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: unreadCount > 0
                ? AppColors.notificationBadge.withAlpha(15)
                : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: unreadCount > 0
                  ? AppColors.notificationBadge.withAlpha(60)
                  : AppColors.glassBorder,
              width: 1,
            ),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                unreadCount > 0
                    ? Icons.notifications_active_rounded
                    : Icons.notifications_outlined,
                color: unreadCount > 0
                    ? AppColors.notificationBadge
                    : AppColors.textSecondary,
                size: 22,
              ),
              if (unreadCount > 0)
                Positioned(
                  top: -6,
                  right: -6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.notificationBadge,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.background,
                        width: 2,
                      ),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      unreadCount > 9 ? '9+' : unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Stats Card ──────────────────────────────────────────────────────
  Widget _buildStatsCard(UserModel? user) {
    int completedExams = 0;
    int progress = 0;
    int rank = 0;

    if (user != null) {
      final resultsAsync = ref.watch(userResultsProvider);
      if (resultsAsync.value != null) {
        completedExams = resultsAsync.value!.length;
      }

      if (user.gradeLevel != null) {
        final leaderboardAsync = ref.watch(
          leaderboardProvider(user.gradeLevel!),
        );
        if (leaderboardAsync.value != null) {
          final leaderboard = leaderboardAsync.value!;
          final userEntryIndex = leaderboard.indexWhere(
            (entry) => entry['userId'] == user.id,
          );
          if (userEntryIndex != -1) {
            rank = userEntryIndex + 1;
            progress = leaderboard[userEntryIndex]['totalScore'] as int;
          }
        }
      }
    }

    return InkWell(
      onTap: () => context.push('/student_my_results'),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.glassBorder, width: 1),
          boxShadow: [
            ...AppColors.cardShadow,
          ],
        ),
        child: Column(
          children: [
            // Title row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent.withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.insights_rounded,
                    color: AppColors.primaryAccent,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'إحصائياتك وإنجازاتك',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      completedExams == 0 ? 'ابدأ أول اختبار' : 'سجل النتائج',
                      style: TextStyle(
                        color: completedExams == 0 ? AppColors.info : AppColors.primaryAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: completedExams == 0 ? AppColors.info : AppColors.primaryAccent,
                      size: 11,
                    ),
                  ],
                ),
              ],
            ),
          const SizedBox(height: 20),

          // Stats row
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.check_circle_rounded,
                  color: AppColors.secondaryAccent,
                  label: 'الاختبارات',
                  value: NumberFormatter.formatNumber(completedExams),
                ),
              ),
              Container(
                width: 1,
                height: 50,
                color: AppColors.divider,
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.star_rounded,
                  color: AppColors.tertiaryAccent,
                  label: 'النقاط',
                  value: NumberFormatter.formatNumber(progress),
                ),
              ),
              Container(
                width: 1,
                height: 50,
                color: AppColors.divider,
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.leaderboard_rounded,
                  color: AppColors.pinkAccent,
                  label: 'الترتيب',
                  value: rank > 0 ? '#' + NumberFormatter.toEnDigits(rank) : '--',
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
  }

  Widget _buildStatItem({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withAlpha(20),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(height: 10),
        Text(
          value,
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textTertiary,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // ─── Main Path Cards ─────────────────────────────────────────────────
  Widget _buildEducationalPath() {
    return Showcase(
      key: _curriculaKey,
      title: 'المناهج الدراسية',
      description:
          'تصفح مسارك التعليمي، النماذج الوزارية، ملخصات المواد والدروس المصورة',
      tooltipBackgroundColor: AppColors.curricula,
      textColor: Colors.white,
      child: _buildMainPathCard(
        title: 'المناهج الدراسية',
        subtitle: 'تصفح المواد، الفيديوهات، والاختبارات المنهجية',
        icon: Icons.menu_book_rounded,
        accentColor: AppColors.curricula,
        gradient: AppColors.curriculaGradient,
        onTap: () => _showEducationalPathBottomSheet(context),
      ),
    );
  }

  Widget _buildAdmissionPath() {
    return Showcase(
      key: _admissionKey,
      title: 'القبول الجامعي',
      description:
          'هنا يمكنك الاستعداد للجامعة والمذاكرة من نماذج اختبارات القبول للمحافظات المختلفة',
      tooltipBackgroundColor: AppColors.admission,
      textColor: Colors.white,
      child: _buildMainPathCard(
        title: 'اختبارات القبول الجامعي',
        subtitle: 'استعد للجامعة وتدرب على نماذج المحافظات المختلفة',
        icon: Icons.school_rounded,
        accentColor: AppColors.admission,
        gradient: AppColors.admissionGradient,
        onTap: () => context.push('/student_admission_universities'),
      ),
    );
  }

  Widget _buildCompetitionsPath() {
    return Showcase(
      key: _competitionKey,
      title: 'المنافسة والتحديات',
      description:
          'ادخل في مسابقات مع زملائك، اختبر مستواك واصعد في لوحة الشرف المتصدرة',
      tooltipBackgroundColor: AppColors.competition,
      textColor: Colors.white,
      child: _buildMainPathCard(
        title: 'المسابقات والتحديات',
        subtitle: 'نافس الطلاب، اجمع النقاط، واصعد للقمة في لوحة الصدارة',
        icon: Icons.emoji_events_rounded,
        accentColor: AppColors.competition,
        gradient: AppColors.competitionGradient,
        onTap: () => context.push('/student_competitions_semesters'),
      ),
    );
  }

  Widget _buildMainPathCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color accentColor,
    required LinearGradient gradient,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        splashColor: accentColor.withAlpha(20),
        highlightColor: accentColor.withAlpha(10),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.glassBorder, width: 1.2), boxShadow: AppColors.cardShadow,
          ),
          child: Row(
            children: [
              // Icon with gradient background
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: gradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: accentColor.withAlpha(40),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 16),

              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),

              // Arrow
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: accentColor.withAlpha(15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: accentColor,
                  size: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Services Grid ───────────────────────────────────────────────────
  Widget _buildServicesGrid() {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.3,
      children: [
        _buildServiceCard(
          icon: Icons.download_rounded,
          color: AppColors.cyanGlow,
          title: 'النماذج المحفوظة',
          subtitle: 'اختبر بدون نت',
          route: '/offline_exams',
        ),
        _buildServiceCard(
          icon: Icons.bookmark_rounded,
          color: AppColors.tertiaryAccent,
          title: 'الأسئلة المفضلة',
          subtitle: 'مراجعة سريعة',
          route: '/student_bookmarks',
        ),
        _buildServiceCard(
          icon: Icons.assessment_rounded,
          color: AppColors.primaryAccent,
          title: 'نتائجي السابقة',
          subtitle: 'تتبع تقدمك',
          route: '/student_my_results',
        ),
        _buildServiceCard(
          icon: Icons.support_agent_rounded,
          color: AppColors.services,
          title: 'التواصل مع الإدارة',
          subtitle: 'مساعدة ودعم',
          route: '/student_contact_admin',
        ),
      ],
    );
  }

  Widget _buildServiceCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String route,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(route),
        borderRadius: BorderRadius.circular(18),
        splashColor: color.withAlpha(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.glassBorder, width: 1.2), boxShadow: AppColors.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.textTertiary,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Social Links ────────────────────────────────────────────────────
  Widget _buildSocialLinks() {
    return Row(
      children: [
        Expanded(
          child: _buildSocialCard(
            icon: Icons.telegram,
            title: 'تليجرام',
            subtitle: 'تابعنا على القناة',
            color: const Color(0xFF2AABEE),
            onTap: _openTelegram,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSocialCard(
            icon: Icons.chat_rounded,
            title: 'واتساب',
            subtitle: 'راسلنا مباشرة',
            color: const Color(0xFF25D366),
            onTap: _openWhatsApp,
          ),
        ),
      ],
    );
  }

  Widget _buildSocialCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: color.withAlpha(20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: color.withAlpha(40), width: 1),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Educational Path Bottom Sheet ───────────────────────────────────
  void _showEducationalPathBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
            border: Border(
              top: BorderSide(color: AppColors.glassBorder, width: 1),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textDisabled,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 24),

              // Title
              const Text(
                'اختر القسم التعليمي',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'حدد المسار الذي تريد استكشافه',
                style: TextStyle(
                  color: AppColors.textTertiary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 24),

              _buildBottomSheetOption(
                context,
                title: 'الاختبارات الوزارية',
                subtitle: 'تدرب على نماذج الوزارة لجميع الصفوف',
                icon: Icons.quiz_rounded,
                color: AppColors.curricula,
                gradient: AppColors.curriculaGradient,
                route: '/student_exams_dashboard',
              ),
              const SizedBox(height: 12),
              _buildBottomSheetOption(
                context,
                title: 'المواد والشروحات',
                subtitle: 'ملخصات، كتب، ومقاطع فيديو',
                icon: Icons.play_circle_fill_rounded,
                color: AppColors.secondaryAccent,
                gradient: AppColors.admissionGradient,
                route: '/student_materials_dashboard',
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBottomSheetOption(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required LinearGradient gradient,
    required String route,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.pop(context);
          context.push(route);
        },
        borderRadius: BorderRadius.circular(18),
        splashColor: color.withAlpha(20),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: color.withAlpha(40), width: 1),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: gradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                color: AppColors.textDisabled,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────
  String _getGradeLevelLabel(String gradeLevel) {
    switch (gradeLevel) {
      case 'third_secondary':
        return 'الصف الثالث ثانوي';
      case 'second_secondary':
        return 'الصف الثاني ثانوي';
      case 'first_secondary':
        return 'الصف الأول ثانوي';
      case 'third_preparatory':
        return 'الصف الثالث إعدادي';
      case 'ninth_grade':
        return 'الصف التاسع';
      default:
        return '';
    }
  }
}
