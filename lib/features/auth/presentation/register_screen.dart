import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../domain/models/user_model.dart';
import '../providers/auth_provider.dart';
import '../../../core/utils/error_handler.dart';
import 'dart:ui';
import 'dart:math' as math;

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen>
    with TickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isCheckingUsername = false;

  // Stepper
  int _currentStep = 0;

  late AnimationController _fadeController;
  late AnimationController _floatController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  late Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeOutCubic));
    _floatAnim = Tween<double>(begin: -5.0, end: 5.0).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    _fadeController.forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _fadeController.dispose();
    _floatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    ref.listen<AsyncValue<UserModel?>>(authStateProvider, (previous, next) {
      if (!next.isLoading && next.hasValue && next.value != null) {
        context.go('/student_dashboard');
      } else if (!next.isLoading && next.hasError) {
        ErrorHandler.showErrorSnackBar(context, next.error);
      }
    });

    final size = MediaQuery.of(context).size;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // خلفية
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0A0E1A),
                  Color(0xFF0F1E3D),
                  Color(0xFF0D2456),
                ],
              ),
            ),
          ),

          // دوائر زخرفية
          AnimatedBuilder(
            animation: _floatAnim,
            builder: (_, __) => Stack(
              children: [
                Positioned(
                  top: 50 + _floatAnim.value,
                  right: -80,
                  child: _GlowOrb(color: const Color(0xFF7B61FF), size: 220, opacity: 0.16),
                ),
                Positioned(
                  bottom: -80 + _floatAnim.value * -1,
                  left: -40,
                  child: _GlowOrb(color: const Color(0xFFE94560), size: 260, opacity: 0.14),
                ),
              ],
            ),
          ),

          // نجوم
          CustomPaint(size: size, painter: _StarsPainter()),

          // المحتوى
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      children: [
                        // Logo
                        AnimatedBuilder(
                          animation: _floatAnim,
                          builder: (_, child) => Transform.translate(
                            offset: Offset(0, _floatAnim.value * 0.4),
                            child: child,
                          ),
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF7B61FF), Color(0xFF4A35CC)],
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF7B61FF).withOpacity(0.4),
                                  blurRadius: 20,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.person_add_rounded, size: 36, color: Colors.white),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'إنشاء حساب جديد',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'انضم إلى آلاف الطلاب على المنصة',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.5),
                          ),
                        ),
                        const SizedBox(height: 28),

                        // مؤشر الخطوات
                        _buildStepIndicator(),
                        const SizedBox(height: 24),

                        // نموذج التسجيل
                        _buildFormCard(authState, size),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    const steps = ['معلوماتك', 'بياناتك', 'كلمة المرور'];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(steps.length, (i) {
        final isActive = i == _currentStep;
        final isDone = i < _currentStep;
        return Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: isActive ? 80 : 36,
              height: 36,
              decoration: BoxDecoration(
                color: isDone
                    ? const Color(0xFF00D4AA)
                    : isActive
                        ? const Color(0xFF7B61FF)
                        : Colors.white.withOpacity(0.07),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isActive
                      ? const Color(0xFF7B61FF)
                      : isDone
                          ? const Color(0xFF00D4AA)
                          : Colors.white.withOpacity(0.15),
                  width: 1.5,
                ),
              ),
              child: Center(
                child: isDone
                    ? const Icon(Icons.check_rounded, color: Colors.white, size: 16)
                    : isActive
                        ? Text(
                            steps[i],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : Text(
                            '${i + 1}',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.4),
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
              ),
            ),
            if (i < steps.length - 1)
              Container(
                width: 28,
                height: 1.5,
                color: i < _currentStep
                    ? const Color(0xFF00D4AA)
                    : Colors.white.withOpacity(0.1),
              ),
          ],
        );
      }),
    );
  }

  Widget _buildFormCard(AsyncValue<UserModel?> authState, Size size) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 440),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withOpacity(0.09), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.25),
                  blurRadius: 30,
                ),
              ],
            ),
            child: Form(
              key: _formKey,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.1, 0),
                      end: Offset.zero,
                    ).animate(anim),
                    child: child,
                  ),
                ),
                child: _buildCurrentStep(authState),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStep(AsyncValue<UserModel?> authState) {
    switch (_currentStep) {
      case 0:
        return _buildStep0();
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2(authState);
      default:
        return const SizedBox();
    }
  }

  // الخطوة 1: الاسم
  Widget _buildStep0() {
    return Column(
      key: const ValueKey(0),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepHeader('من أنت؟', 'أدخل اسمك الكامل كما يظهر في الوثائق الرسمية'),
        const SizedBox(height: 24),
        _buildField(
          controller: _nameController,
          label: 'الاسم الكامل',
          icon: Icons.badge_outlined,
          keyboardType: TextInputType.name,
          validator: (v) => v == null || v.trim().length < 3
              ? 'يرجى إدخال اسمك الكامل (3 أحرف على الأقل)'
              : null,
        ),
        const SizedBox(height: 28),
        _buildNextButton(() {
          if (_formKey.currentState!.validate()) {
            setState(() => _currentStep = 1);
          }
        }),
        _buildLoginLink(),
      ],
    );
  }

  // الخطوة 2: البريد/اسم المستخدم
  Widget _buildStep1() {
    return Column(
      key: const ValueKey(1),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepHeader('بيانات الحساب', 'استخدم بريدك الإلكتروني أو أنشئ اسم مستخدم'),
        const SizedBox(height: 24),
        _buildField(
          controller: _emailController,
          label: 'البريد الإلكتروني أو اسم المستخدم',
          icon: Icons.alternate_email_rounded,
          keyboardType: TextInputType.emailAddress,
          validator: (v) => v == null || v.isEmpty
              ? 'يرجى إدخال بريد إلكتروني أو اسم مستخدم'
              : null,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.07),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue.withOpacity(0.15)),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded, color: Colors.blue.shade300, size: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'اسم المستخدم: أحرف إنجليزية وأرقام فقط، بدون مسافات\nمثال: ahmed2025',
                  style: TextStyle(color: Colors.blue.shade200, fontSize: 12, height: 1.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep = 0),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white54,
                  side: BorderSide(color: Colors.white.withOpacity(0.12)),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('السابق'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: _isCheckingUsername
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF7B61FF),
                        strokeWidth: 2.5,
                      ),
                    )
                  : _buildNextButton(() async {
                      if (_formKey.currentState!.validate()) {
                        final rawInput = _emailController.text.trim();
                        final processed = rawInput
                            .replaceAll(RegExp(r'\s+'), '')
                            .toLowerCase();
                        final emailToCheck = processed.contains('@')
                            ? processed
                            : '@examyemen.com';

                        setState(() => _isCheckingUsername = true);
                        try {
                          final doc = await FirebaseFirestore.instance
                              .collection('users')
                              .where('email', isEqualTo: emailToCheck)
                              .limit(1)
                              .get();

                          if (!mounted) return;
                          if (doc.docs.isNotEmpty) {
                            setState(() => _isCheckingUsername = false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Row(
                                  children: [
                                    Icon(
                                      Icons.warning_amber_rounded,
                                      color: Colors.white,
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'اسم المستخدم أو الحساب هذا محجوز مسبقاً لطالب آخر. يرجى اختيار اسم مستخدم مختلف.',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                backgroundColor: Color(0xFFEF4444),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                            return;
                          }
                        } catch (_) {}

                        if (mounted) {
                          setState(() {
                            _isCheckingUsername = false;
                            _currentStep = 2;
                          });
                        }
                      }
                    }),
            ),
          ],
        ),
        _buildLoginLink(),
      ],
    );
  }

  // الخطوة 3: كلمة المرور
  Widget _buildStep2(AsyncValue<UserModel?> authState) {
    return Column(
      key: const ValueKey(2),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepHeader('كلمة المرور', 'اختر كلمة مرور قوية لحماية حسابك'),
        const SizedBox(height: 24),
        _buildField(
          controller: _passwordController,
          label: 'كلمة المرور',
          icon: Icons.lock_outline_rounded,
          obscureText: _obscurePassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: Colors.white38,
              size: 20,
            ),
            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'يرجى إدخال كلمة المرور';
            if (v.length < 6) return 'يجب أن لا تقل عن 6 أحرف';
            return null;
          },
        ),
        const SizedBox(height: 16),
        _buildField(
          controller: _confirmPasswordController,
          label: 'تأكيد كلمة المرور',
          icon: Icons.lock_clock_outlined,
          obscureText: _obscureConfirm,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: Colors.white38,
              size: 20,
            ),
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'يرجى تأكيد كلمة المرور';
            if (v != _passwordController.text) return 'كلمتا المرور غير متطابقتين';
            return null;
          },
        ),
        const SizedBox(height: 28),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: authState.isLoading
                    ? null
                    : () => setState(() => _currentStep = 1),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white54,
                  side: BorderSide(color: Colors.white.withOpacity(0.12)),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('السابق'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: _buildRegisterButton(authState),
            ),
          ],
        ),
        _buildLoginLink(),
      ],
    );
  }

  Widget _stepHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13, height: 1.5),
        ),
      ],
    );
  }

  Widget _buildNextButton(VoidCallback onPressed) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7B61FF), Color(0xFF4A35CC)],
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7B61FF).withOpacity(0.35),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onPressed,
          child: const Padding(
            padding: EdgeInsets.symmetric(vertical: 15),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'التالي',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRegisterButton(AsyncValue<UserModel?> authState) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        gradient: authState.isLoading
            ? null
            : const LinearGradient(
                colors: [Color(0xFF00D4AA), Color(0xFF00A882)],
              ),
        color: authState.isLoading ? Colors.white10 : null,
        borderRadius: BorderRadius.circular(14),
        boxShadow: authState.isLoading
            ? []
            : [
                BoxShadow(
                  color: const Color(0xFF00D4AA).withOpacity(0.35),
                  blurRadius: 14,
                  offset: const Offset(0, 5),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: authState.isLoading
              ? null
              : () {
                  if (_formKey.currentState!.validate()) {
                    ref.read(authStateProvider.notifier).register(
                          _emailController.text.trim(),
                          _passwordController.text.trim(),
                          _nameController.text.trim(),
                        );
                  }
                },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 15),
            child: Center(
              child: authState.isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Color(0xFF00D4AA),
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'إنشاء الحساب',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginLink() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Center(
        child: TextButton(
          onPressed: () => context.go('/login'),
          style: TextButton.styleFrom(foregroundColor: Colors.white54),
          child: RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 13),
              children: [
                TextSpan(text: 'لديك حساب بالفعل؟ ', style: TextStyle(color: Colors.white38)),
                TextSpan(
                  text: 'تسجيل الدخول',
                  style: TextStyle(
                    color: Color(0xFF7B61FF),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 14),
        prefixIcon: Icon(icon, color: Colors.white.withOpacity(0.35), size: 20),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF7B61FF), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
        errorStyle: const TextStyle(color: Colors.redAccent, fontSize: 11),
      ),
      validator: validator,
    );
  }
}

// ===== Helpers =====

class _GlowOrb extends StatelessWidget {
  final Color color;
  final double size;
  final double opacity;

  const _GlowOrb({required this.color, required this.size, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(opacity)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
        child: Container(color: Colors.transparent),
      ),
    );
  }
}

class _StarsPainter extends CustomPainter {
  final _stars = List.generate(
    50,
    (i) => _Star(
      x: math.Random(i * 3).nextDouble(),
      y: math.Random(i * 11).nextDouble(),
      r: math.Random(i * 17).nextDouble() * 1.5 + 0.3,
      opacity: math.Random(i * 29).nextDouble() * 0.35 + 0.08,
    ),
  );

  @override
  void paint(Canvas canvas, Size size) {
    for (final star in _stars) {
      canvas.drawCircle(
        Offset(star.x * size.width, star.y * size.height),
        star.r,
        Paint()..color = Colors.white.withOpacity(star.opacity),
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Star {
  final double x, y, r, opacity;
  const _Star({required this.x, required this.y, required this.r, required this.opacity});
}
