import 'package:flutter/material.dart';

/// Ultra-Luxurious Pearl & Royal Educational Color Palette for ExamYemen
/// Crafted for maximum visual elegance, eye comfort, and high-end UI/UX
class AppColors {
  AppColors._();

  // ─── Primary Pure & Luxury Background Colors ────────────────────────
  static const Color background = Color(0xFFF8FAFC);         // Clean Snow Pearl
  static const Color backgroundLight = Color(0xFFFFFFFF);    // Pure White
  static const Color surface = Color(0xFFFFFFFF);            // Luxury Card White
  static const Color surfaceLight = Color(0xFFF1F5F9);       // Subtle Accent Surface
  static const Color surfaceElevated = Color(0xFFFFFFFF);    // Elevated Pure Surface

  // ─── Luxury Gradient Backgrounds ────────────────────────────────────
  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFFFFF), Color(0xFFF8FAFC)],
  );

  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF3B82F6)],
  );

  // ─── Royal & Vibrant Accent Colors ──────────────────────────────────
  static const Color primaryAccent = Color(0xFF2563EB);     // Royal Sapphire Blue
  static const Color secondaryAccent = Color(0xFF10B981);   // Pure Emerald
  static const Color tertiaryAccent = Color(0xFFF59E0B);    // Champagne Gold
  static const Color cyanGlow = Color(0xFF0284C7);          // Deep Sky Blue
  static const Color pinkAccent = Color(0xFFEC4899);        // Rose Quartz
  static const Color blueAccent = Color(0xFF3B82F6);        // Bright Blue

  // ─── Educational Theme Colors ──────────────────────────────────────
  static const Color curricula = Color(0xFF2563EB);         // Books Royal Blue
  static const Color admission = Color(0xFF059669);         // University Emerald
  static const Color competition = Color(0xFFD97706);       // Trophy Gold
  static const Color services = Color(0xFF7C3AED);          // Imperial Violet

  // ─── Card Accent Gradients ─────────────────────────────────────────
  static const LinearGradient curriculaGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
  );

  static const LinearGradient admissionGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF047857), Color(0xFF10B981)],
  );

  static const LinearGradient competitionGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFB45309), Color(0xFFF59E0B)],
  );

  static const LinearGradient servicesGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF6D28D9), Color(0xFF8B5CF6)],
  );

  // ─── AI Theme Colors ───────────────────────────────────────────────
  static const Color aiPrimary = Color(0xFF6366F1);
  static const Color aiSecondary = Color(0xFF06B6D4);
  static const Color aiGradientStart = Color(0xFF2563EB);
  static const Color aiGradientEnd = Color(0xFF10B981);
  static const LinearGradient aiGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [aiGradientStart, aiGradientEnd],
  );

  // ─── Status Colors ─────────────────────────────────────────────────
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF0284C7);

  // ─── High-Contrast Readable Text Colors ─────────────────────────────
  static const Color textPrimary = Color(0xFF0F172A);       // Deep Slate (High Clarity)
  static const Color textSecondary = Color(0xFF475569);     // Balanced Mid-Slate
  static const Color textTertiary = Color(0xFF94A3B8);      // Soft Subtle Slate
  static const Color textDisabled = Color(0xFFCBD5E1);      // Light Slate
  static const Color textPlaceholder = Color(0xFF94A3B8);   // Placeholder Slate

  // ─── Glass Effect & Luxury Borders ─────────────────────────────────
  static const Color border = Color(0xFFE2E8F0);
  static const Color emeraldMint = Color(0xFF059669);
  static const Color champagneGold = Color(0xFFD97706);
  static Color glassBackground = const Color(0xFFFFFFFF).withAlpha(235);
  static Color glassBorder = const Color(0xFFE2E8F0);
  static Color glassHighlight = const Color(0xFFF1F5F9);

  // ─── Orb Glow Colors (Compatibility) ──────────────────────────────
  static const Color orbBlue = Color(0xFF2563EB);
  static const Color orbPurple = Color(0xFF8B5CF6);
  static const Color orbTeal = Color(0xFF10B981);
  static const Color orbPink = Color(0xFFEC4899);
  static const Color orbGold = Color(0xFFF59E0B);

  // ─── Badges & Dividers ─────────────────────────────────────────────
  static const Color notificationBadge = Color(0xFFEF4444);
  static const Color divider = Color(0xFFE2E8F0);

  // ─── Luxury Card Box Shadows ──────────────────────────────────────
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: const Color(0xFF0F172A).withAlpha(12),
      blurRadius: 18,
      offset: const Offset(0, 6),
    ),
    BoxShadow(
      color: const Color(0xFF0F172A).withAlpha(6),
      blurRadius: 4,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get floatingShadow => [
    BoxShadow(
      color: const Color(0xFF0F172A).withAlpha(20),
      blurRadius: 28,
      offset: const Offset(0, 10),
    ),
  ];
}
