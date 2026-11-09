import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class MaterialsDashboardScreen extends StatefulWidget {
  const MaterialsDashboardScreen({super.key});

  @override
  State<MaterialsDashboardScreen> createState() => _MaterialsDashboardScreenState();
}

class _MaterialsDashboardScreenState extends State<MaterialsDashboardScreen> {
  int _activeTab = 0; // 0 = عربي, 1 = إنجليزي

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'المكتبة والملازم التعليمية',
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
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
              physics: const BouncingScrollPhysics(),
              children: [
                // Top Clean Header Banner (بدون دش كلام زائد)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.curricula.withAlpha(15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.curricula.withAlpha(40), width: 1),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.local_library_rounded,
                        color: AppColors.curricula,
                        size: 22,
                      ),
                      SizedBox(width: 10),
                      Text(
                        'المكتبة الرقمية والملازم الرسمية المعتمدة',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Language Stream Selector Tabs
                _buildTabSelector(),
                const SizedBox(height: 20),

                // Section Title
                Row(
                  children: [
                    Container(
                      width: 4,
                      height: 18,
                      decoration: BoxDecoration(
                        color: AppColors.curricula,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'اختر المرحلة لعرض المواد والملازم',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Grade Cards
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: _activeTab == 0
                      ? _buildArabicSection(context)
                      : _buildEnglishSection(context),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabSelector() {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1),
        boxShadow: AppColors.cardShadow,
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = 0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: _activeTab == 0
                      ? AppColors.curricula
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _activeTab == 0 ? AppColors.floatingShadow : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  'المناهج العربية العامة',
                  style: TextStyle(
                    color: _activeTab == 0 ? Colors.white : AppColors.textSecondary,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = 1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: _activeTab == 1
                      ? AppColors.curricula
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _activeTab == 1 ? AppColors.floatingShadow : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  'مناهج اللغات (English)',
                  style: TextStyle(
                    color: _activeTab == 1 ? Colors.white : AppColors.textSecondary,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArabicSection(BuildContext context) {
    return Column(
      key: const ValueKey('arabic_materials'),
      children: [
        _buildGradeCard(
          context: context,
          title: 'الصف التاسع الأساسي',
          icon: Icons.school_rounded,
          accentColor: AppColors.curricula,
          tagText: 'الشهادة الأساسية',
          routeData: {'grade': 'grade9', 'stream': 'All'},
        ),
        const SizedBox(height: 12),
        _buildGradeCard(
          context: context,
          title: 'الثالث الثانوي (القسم العلمي)',
          icon: Icons.science_rounded,
          accentColor: AppColors.primaryAccent,
          tagText: 'القسم العلمي',
          routeData: {'grade': 'grade12', 'stream': 'scientific'},
        ),
        const SizedBox(height: 12),
        _buildGradeCard(
          context: context,
          title: 'الثالث الثانوي (القسم الأدبي)',
          icon: Icons.menu_book_rounded,
          accentColor: AppColors.competition,
          tagText: 'القسم الأدبي',
          routeData: {'grade': 'grade12', 'stream': 'literary'},
        ),
      ],
    );
  }

  Widget _buildEnglishSection(BuildContext context) {
    return Column(
      key: const ValueKey('english_materials'),
      children: [
        _buildGradeCard(
          context: context,
          title: 'Grade 9 Materials (English)',
          icon: Icons.language_rounded,
          accentColor: AppColors.services,
          tagText: 'English Basic',
          routeData: {'grade': 'grade9_english', 'stream': 'All'},
        ),
        const SizedBox(height: 12),
        _buildGradeCard(
          context: context,
          title: '12th Grade - Scientific (English)',
          icon: Icons.biotech_rounded,
          accentColor: AppColors.curricula,
          tagText: 'Scientific Track',
          routeData: {'grade': 'grade12_english', 'stream': 'scientific'},
        ),
        const SizedBox(height: 12),
        _buildGradeCard(
          context: context,
          title: '12th Grade - Literary (English)',
          icon: Icons.auto_stories_rounded,
          accentColor: AppColors.competition,
          tagText: 'Literary Track',
          routeData: {'grade': 'grade12_english', 'stream': 'literary'},
        ),
      ],
    );
  }

  Widget _buildGradeCard({
    required BuildContext context,
    required String title,
    required IconData icon,
    required Color accentColor,
    required String tagText,
    required Map<String, dynamic> routeData,
  }) {
    return Container(
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
            final extra = Map<String, dynamic>.from(routeData);
            extra['isPdf'] = true;
            context.push('/materials_list', extra: extra);
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
            child: Row(
              children: [
                // 3D-styled Icon Container
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: accentColor.withAlpha(20),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: accentColor.withAlpha(50), width: 1.2),
                  ),
                  child: Icon(icon, color: accentColor, size: 24),
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

                // Badge
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

                // Subtle Arrow
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
