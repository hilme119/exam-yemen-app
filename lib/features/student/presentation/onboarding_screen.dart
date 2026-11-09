import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:introduction_screen/introduction_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/theme/app_colors.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkFirstLaunch();
  }

  Future<void> _checkFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    final currentUser = FirebaseAuth.instance.currentUser;
    final cachedUserId = prefs.getString('logged_in_user_id');

    // 1. إذا كان الطالب مسجل دخوله بالفعل في Firebase أو محلياً -> الدخول الفوري للرئيسية دون ظهور الترحيب أو تسجيل الدخول
    if (currentUser != null || (cachedUserId != null && cachedUserId.isNotEmpty)) {
      if (mounted) {
        context.go('/student_dashboard');
        return;
      }
    }

    // 2. إذا لم يكن مسجل الدخول: هل شاهد الترحيب مسبقاً؟
    final isFirstLaunch = prefs.getBool('isFirstLaunch') ?? true;

    if (!isFirstLaunch) {
      // سبق له رؤية الترحيب -> مباشرة إلى شاشة تسجيل الدخول
      if (mounted) {
        context.go('/login');
      }
    } else {
      // أول مرة يفتح التطبيق على الإطلاق
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _onIntroEnd() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstLaunch', false);
    if (mounted) {
      context.go('/register');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primaryAccent),
        ),
      );
    }

    const pageDecoration = PageDecoration(
      titleTextStyle: TextStyle(
        fontSize: 26.0,
        fontWeight: FontWeight.bold,
        color: AppColors.textPrimary,
        height: 1.3,
      ),
      bodyTextStyle: TextStyle(
        fontSize: 15.0,
        color: AppColors.textSecondary,
        height: 1.6,
      ),
      pageColor: AppColors.background,
      imagePadding: EdgeInsets.only(top: 40, bottom: 20),
      contentMargin: EdgeInsets.symmetric(horizontal: 24),
    );

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: IntroductionScreen(
            globalBackgroundColor: AppColors.background,
            allowImplicitScrolling: true,
            pages: [
              PageViewModel(
                title: "مرحباً بك في اختبارات اليمن",
                body:
                    "المنصة التعليمية الأولى والحديثة لمساعدتك على التفوق، التدريب الذكي، واجتياز الامتحانات بنجاح باهر.",
                image: _buildLuxuryVisual(
                  Icons.school_rounded,
                  AppColors.primaryAccent,
                  const [Color(0xFF2563EB), Color(0xFF3B82F6)],
                ),
                decoration: pageDecoration,
              ),
              PageViewModel(
                title: "نماذج وزارية وتفاعلية شاملة",
                body:
                    "حدد صفك الدراسي وتصفح مئات النماذج الوزارية، امتحانات القبول الجامعية، والمكتبة العلمية الشاملة بكل سهولة.",
                image: _buildLuxuryVisual(
                  Icons.auto_stories_rounded,
                  AppColors.emeraldMint,
                  const [Color(0xFF059669), Color(0xFF10B981)],
                ),
                decoration: pageDecoration,
              ),
              PageViewModel(
                title: "مسابقات وتحديات الصدارة",
                body:
                    "تحدَّ أصدقاءك في سباق سرعة الإجابة، واكسب النقاط الذهبية لتتصدر لوحة شرف المتفوقين على مستوى الجمهورية.",
                image: _buildLuxuryVisual(
                  Icons.emoji_events_rounded,
                  AppColors.champagneGold,
                  const [Color(0xFFD97706), Color(0xFFF59E0B)],
                ),
                decoration: pageDecoration,
              ),
              PageViewModel(
                title: "تسجيل فوري وسهل للغاية",
                body:
                    "أدخل اسمك واسم المستخدم المفضل لديك، وابدأ التدريب وحل النماذج بدون أي تعقيدات أو إجراءات مطولة.",
                image: _buildLuxuryVisual(
                  Icons.verified_user_rounded,
                  const Color(0xFF7C3AED),
                  const [Color(0xFF6D28D9), Color(0xFF8B5CF6)],
                ),
                decoration: pageDecoration,
              ),
            ],
            onDone: _onIntroEnd,
            onSkip: _onIntroEnd,
            showSkipButton: true,
            skipOrBackFlex: 0,
            nextFlex: 0,
            skip: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: const Text(
                'تخطي',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
            next: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primaryAccent,
                shape: BoxShape.circle,
                boxShadow: AppColors.cardShadow,
              ),
              child: const Icon(
                Icons.arrow_back_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
            done: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: AppColors.cardShadow,
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'ابدأ الآن',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontSize: 15,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(
                    Icons.rocket_launch_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ],
              ),
            ),
            curve: Curves.fastEaseInToSlowEaseOut,
            controlsMargin: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            controlsPadding: const EdgeInsets.all(8),
            dotsDecorator: DotsDecorator(
              size: const Size(8.0, 8.0),
              color: AppColors.border,
              activeSize: const Size(26.0, 8.0),
              activeColor: AppColors.primaryAccent,
              activeShape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.0),
              ),
              spacing: const EdgeInsets.symmetric(horizontal: 4.0),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLuxuryVisual(
    IconData icon,
    Color primaryColor,
    List<Color> gradientColors,
  ) {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer Glow Circle
          Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryColor.withAlpha(15),
            ),
          ),
          // Middle Concentric Ring
          Container(
            width: 170,
            height: 170,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryColor.withAlpha(25),
              border: Border.all(
                color: primaryColor.withAlpha(40),
                width: 2,
              ),
            ),
          ),
          // Inner Solid Gradient Icon Card
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: gradientColors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: primaryColor.withAlpha(90),
                  blurRadius: 28,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Icon(
              icon,
              size: 58,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
