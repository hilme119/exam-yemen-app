import 'package:flutter/material.dart' hide MaterialType;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../domain/models/learning_material_model.dart';
import '../../../../core/providers/download_provider.dart';
import '../../../../core/services/offline_material_service.dart';
import '../providers/learning_material_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/number_formatter.dart';

class MaterialsListScreen extends ConsumerStatefulWidget {
  final String subjectId;
  final String subjectName;

  const MaterialsListScreen({
    super.key,
    required this.subjectId,
    required this.subjectName,
  });

  @override
  ConsumerState<MaterialsListScreen> createState() =>
      _MaterialsListScreenState();
}

class _MaterialsListScreenState extends ConsumerState<MaterialsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'مكتبة ${widget.subjectName}',
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
                // Search Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border, width: 1),
                      boxShadow: AppColors.cardShadow,
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val.trim().toLowerCase();
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'ابحث عن ملخص أو كتاب أو ملزمة...',
                        hintStyle: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          color: AppColors.primaryAccent,
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
                ),
                const SizedBox(height: 8),

                // Luxury Tab Bar
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  height: 48,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border, width: 1),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicator: BoxDecoration(
                      color: AppColors.curricula,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: AppColors.floatingShadow,
                    ),
                    labelColor: Colors.white,
                    unselectedLabelColor: AppColors.textSecondary,
                    labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    tabs: const [
                      Tab(text: 'الملخصات'),
                      Tab(text: 'الكتب الرسمية'),
                      Tab(text: 'شروحات الفيديو'),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Tab Views
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildMaterialsList(MaterialType.summary),
                      _buildMaterialsList(MaterialType.book),
                      _buildMaterialsList(MaterialType.video),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMaterialsList(MaterialType type) {
    final materialsAsyncValue = ref.watch(
      learningMaterialsProvider(widget.subjectId),
    );

    return materialsAsyncValue.when(
      data: (materials) {
        var filteredList = materials.where((m) => m.type == type).toList();

        if (_searchQuery.isNotEmpty) {
          filteredList = filteredList
              .where((m) => m.title.toLowerCase().contains(_searchQuery))
              .toList();
        }

        if (filteredList.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.curricula.withAlpha(15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.folder_open_rounded,
                      size: 48,
                      color: AppColors.curricula,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'لا يوجد محتوى في هذا القسم حالياً',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'سيتم إضافة المزيد من الكتب والملازم الوزارية قريباً.',
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

        return ListView.separated(
          padding: const EdgeInsets.only(left: 20, right: 20, bottom: 40),
          physics: const BouncingScrollPhysics(),
          itemCount: filteredList.length,
          separatorBuilder: (_, _) => const SizedBox(height: 14),
          itemBuilder: (context, index) {
            return MaterialItemWidget(material: filteredList[index]);
          },
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.curricula),
      ),
      error: (error, stack) => Center(
        child: Text(
          'خطأ في جلب المواد: $error',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
    );
  }
}

class MaterialItemWidget extends ConsumerStatefulWidget {
  final LearningMaterialModel material;

  const MaterialItemWidget({super.key, required this.material});

  @override
  ConsumerState<MaterialItemWidget> createState() => _MaterialItemWidgetState();
}

class _MaterialItemWidgetState extends ConsumerState<MaterialItemWidget> {
  Future<void> _incrementStat(String statField) async {
    try {
      await FirebaseFirestore.instance
          .collection('materials')
          .doc(widget.material.id)
          .update({statField: FieldValue.increment(1)});
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    IconData typeIcon;
    Color accentColor;
    switch (widget.material.type) {
      case MaterialType.summary:
        typeIcon = Icons.description_rounded;
        accentColor = AppColors.curricula;
        break;
      case MaterialType.book:
        typeIcon = Icons.auto_stories_rounded;
        accentColor = AppColors.primaryAccent;
        break;
      case MaterialType.video:
        typeIcon = Icons.play_circle_fill_rounded;
        accentColor = AppColors.champagneGold;
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border, width: 1.2),
        boxShadow: AppColors.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: accentColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: accentColor.withAlpha(50), width: 1.2),
                  ),
                  child: Icon(typeIcon, color: accentColor, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.material.title,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (widget.material.description.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          widget.material.description,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            height: 1.35,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Downloads and Views Count
                Row(
                  children: [
                    const Icon(
                      Icons.download_rounded,
                      color: AppColors.textSecondary,
                      size: 15,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      NumberFormatter.formatNumber(widget.material.downloads),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.visibility_rounded,
                      color: AppColors.textSecondary,
                      size: 15,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      NumberFormatter.formatNumber(widget.material.views),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),

                // Action Buttons
                Row(
                  children: [
                    if (widget.material.type != MaterialType.video)
                      Builder(
                        builder: (context) {
                          final isDownloaded = ref.watch(offlineMaterialServiceProvider).isMaterialDownloaded(widget.material.id);
                          final downloadState = ref.watch(downloadProvider)[widget.material.id];
                          final isCurrentlyDownloading = downloadState?.isDownloading ?? false;
                          final dlProgress = downloadState?.progress ?? 0.0;
                          
                          if (isCurrentlyDownloading) {
                            return Container(
                              height: 38,
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              decoration: BoxDecoration(
                                color: AppColors.emeraldMint.withAlpha(20),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.emeraldMint),
                              ),
                              child: Row(
                                children: [
                                  const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.emeraldMint,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    NumberFormatter.formatPercentage(dlProgress * 100),
                                    style: const TextStyle(fontSize: 11, color: AppColors.emeraldMint, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            );
                          }

                          if (isDownloaded) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.emeraldMint.withAlpha(15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.check_circle_rounded, color: AppColors.emeraldMint, size: 14),
                                  SizedBox(width: 4),
                                  Text(
                                    'محفوظ أوفلاين',
                                    style: TextStyle(color: AppColors.emeraldMint, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            );
                          }

                          return IconButton(
                            icon: const Icon(Icons.cloud_download_rounded, color: AppColors.primaryAccent),
                            tooltip: 'تحميل بدون إنترنت',
                            onPressed: () {
                              ref.read(downloadProvider.notifier).startDownload(
                                widget.material.id,
                                widget.material.url,
                                '${widget.material.id}.pdf',
                                () async {
                                  await ref.read(offlineMaterialServiceProvider).saveMaterial(widget.material);
                                  await _incrementStat('downloads');
                                  if (mounted) setState(() {});
                                },
                                (err) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('فشل التحميل: $err')),
                                    );
                                  }
                                },
                              );
                            },
                          );
                        },
                      ),
                    const SizedBox(width: 8),

                    // Open View Button
                    ElevatedButton.icon(
                      onPressed: () async {
                        await _incrementStat('views');
                        if (widget.material.type == MaterialType.video) {
                          context.push('/video_player', extra: widget.material.url);
                        } else {
                          context.push('/pdf_viewer', extra: widget.material.url);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.curricula,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      icon: Icon(
                        widget.material.type == MaterialType.video
                            ? Icons.play_arrow_rounded
                            : Icons.visibility_rounded,
                        size: 18,
                      ),
                      label: Text(
                        widget.material.type == MaterialType.video ? 'مشاهدة' : 'قراءة الملزمة',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
