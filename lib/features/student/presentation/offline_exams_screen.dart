import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart' hide MaterialType;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/offline_exam_service.dart';
import '../../../core/services/offline_material_service.dart';
import '../../../core/utils/download_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../domain/models/learning_material_model.dart';
import '../../../domain/models/exam_model.dart';

class OfflineExamsScreen extends ConsumerStatefulWidget {
  const OfflineExamsScreen({super.key});

  @override
  ConsumerState<OfflineExamsScreen> createState() => _OfflineExamsScreenState();
}

class _OfflineExamsScreenState extends ConsumerState<OfflineExamsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(
          'المحفوظات (بدون إنترنت)',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black87),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: isDark ? Colors.greenAccent : Colors.teal.shade700,
          labelColor: isDark ? Colors.greenAccent : Colors.teal.shade700,
          unselectedLabelColor: isDark ? Colors.white70 : Colors.black54,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
          tabs: const [
            Tab(text: 'اختبارات تفاعلية', icon: Icon(Icons.quiz_rounded)),
            Tab(text: 'نماذج PDF', icon: Icon(Icons.picture_as_pdf_rounded)),
            Tab(
              text: 'الملخصات والتلاخيص',
              icon: Icon(Icons.library_books_rounded),
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? const [
                        Color(0xFF0F3460),
                        Color(0xFF16213E),
                        Color(0xFF1A1A2E),
                      ]
                    : [Colors.grey.shade100, Colors.white, Colors.grey.shade50],
              ),
            ),
          ),
          Positioned(
            top: 150,
            left: -50,
            child: _buildBlurOrb(color: Colors.greenAccent, size: 200),
          ),
          Positioned(
            bottom: -50,
            right: -80,
            child: _buildBlurOrb(color: Colors.tealAccent, size: 250),
          ),

          SafeArea(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildInteractiveExamsList(),
                _buildPdfExamsList(),
                _buildMaterialsList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInteractiveExamsList() {
    final offlineService = ref.watch(offlineExamServiceProvider);
    var exams = offlineService
        .getDownloadedExams()
        .where((e) => !e.isPdf)
        .toList();
    if (exams.isEmpty) {
      return _buildEmptyState('لم تقم بتحميل أي نماذج تفاعلية حتى الآن');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24.0),
      physics: const BouncingScrollPhysics(),
      itemCount: exams.length,
      itemBuilder: (context, index) {
        final exam = exams[index];
        return _buildExamCard(exam, offlineService);
      },
    );
  }

  Widget _buildPdfExamsList() {
    final offlineService = ref.watch(offlineExamServiceProvider);
    var exams = offlineService
        .getDownloadedExams()
        .where((e) => e.isPdf)
        .toList();
    if (exams.isEmpty) {
      return _buildEmptyState('لم تقم بتحميل أي نماذج PDF حتى الآن');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24.0),
      physics: const BouncingScrollPhysics(),
      itemCount: exams.length,
      itemBuilder: (context, index) {
        final exam = exams[index];
        return _buildExamCard(exam, offlineService);
      },
    );
  }

  Widget _buildMaterialsList() {
    final offlineMaterialService = ref.watch(offlineMaterialServiceProvider);
    final materials = offlineMaterialService.getDownloadedMaterials();
    if (materials.isEmpty) {
      return _buildEmptyState('لم تقم بتحميل أي ملخصات أو مواد حتى الآن');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24.0),
      physics: const BouncingScrollPhysics(),
      itemCount: materials.length,
      itemBuilder: (context, index) {
        final material = materials[index];
        return _buildMaterialCard(material, offlineMaterialService);
      },
    );
  }

  Widget _buildExamCard(ExamModel exam, OfflineExamService offlineService) {
    return _buildCardBase(
      icon: Icons.download_done_rounded,
      iconColor: Colors.greenAccent,
      title: exam.title,
      subtitle:
          '${exam.gradeName ?? ""} | ${exam.subjectName ?? ""}\nمتاح للعمل بدون إنترنت | ${exam.academicYear}',
      onDelete: () async {
        await offlineService.removeDownloadedExam(exam.id);
        setState(() {});
        _showSnackBar('تم حذف النموذج بنجاح', Colors.redAccent.shade700);
      },
      actionButton: Wrap(
        alignment: WrapAlignment.end,
        spacing: 8,
        runSpacing: 8,
        children: [
          if (exam.isPdf)
            ElevatedButton.icon(
              icon: const Icon(Icons.save_alt_rounded, size: 20),
              label: const Text(
                'حفظ بالجهاز',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () async {
                String fileName;
                if (exam.gradeName == 'اختبار قبول') {
                  fileName = 'admission_exam_${exam.id}.pdf';
                } else {
                  fileName = 'exam_${exam.id}.pdf';
                }
                final localPath = await DownloadHelper.getLocalPath(fileName);
                if (File(localPath).existsSync()) {
                  try {
                    final savedPath = await DownloadHelper.exportToDownloads(
                      localPath,
                      '${exam.title}.pdf',
                    );
                    if (context.mounted) {
                      _showSnackBar(
                        'تم حفظ الملف بنجاح:\n$savedPath',
                        Colors.greenAccent,
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      _showSnackBar(e.toString(), Colors.redAccent);
                    }
                  }
                } else {
                  if (context.mounted) {
                    _showSnackBar(
                      'الملف غير موجود، يرجى إعادة التحميل',
                      Colors.orangeAccent,
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent.shade700,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ElevatedButton.icon(
            icon: const Icon(Icons.play_arrow_rounded, size: 20),
            label: Text(
              exam.isPdf ? 'فتح الملف' : 'بدء الاختبار',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () {
              final user = ref.read(authStateProvider).value;
              if (user != null && user.email.startsWith('guest_')) {
                _showGuestWarningDialog(context);
                return;
              }
              if (exam.isPdf) {
                String fileName;
                if (exam.gradeName == 'اختبار قبول') {
                  fileName = 'admission_exam_${exam.id}.pdf';
                } else {
                  fileName = 'exam_${exam.id}.pdf';
                }

                DownloadHelper.getLocalPath(fileName).then((localPath) {
                  if (File(localPath).existsSync()) {
                    if (context.mounted) {
                      context.push(
                        '/pdf_viewer',
                        extra: {
                          'path': localPath,
                          'isLocal': true,
                          'title': exam.title,
                        },
                      );
                    }
                  } else {
                    if (context.mounted) {
                      _showSnackBar(
                        'ملف الPDF غير موجود، يرجى إعادة التحميل',
                        Colors.orangeAccent,
                      );
                      offlineService.removeDownloadedExam(exam.id);
                      setState(() {});
                    }
                  }
                });
              } else {
                context.push('/student_exam_player', extra: exam);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.greenAccent.shade700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMaterialCard(
    LearningMaterialModel material,
    OfflineMaterialService offlineService,
  ) {
    return _buildCardBase(
      icon: Icons.picture_as_pdf_rounded,
      iconColor: Colors.blueAccent,
      title: material.title,
      subtitle: 'ملف PDF جاهز للقراءة',
      onDelete: () async {
        await offlineService.removeDownloadedMaterial(material.id);
        final fileName = 'material_${material.id}.pdf';
        await DownloadHelper.deleteFile(fileName);
        setState(() {});
        _showSnackBar('تم حذف الملف بنجاح', Colors.redAccent.shade700);
      },
      actionButton: Wrap(
        alignment: WrapAlignment.end,
        spacing: 8,
        runSpacing: 8,
        children: [
          ElevatedButton.icon(
            icon: const Icon(Icons.save_alt_rounded, size: 20),
            label: const Text(
              'حفظ بالجهاز',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () async {
              final fileName = 'material_${material.id}.pdf';
              final localPath = await DownloadHelper.getLocalPath(fileName);
              if (File(localPath).existsSync()) {
                try {
                  final savedPath = await DownloadHelper.exportToDownloads(
                    localPath,
                    '${material.title}.pdf',
                  );
                  if (context.mounted) {
                    _showSnackBar(
                      'تم حفظ الملف بنجاح:\n$savedPath',
                      Colors.greenAccent,
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    _showSnackBar(e.toString(), Colors.redAccent);
                  }
                }
              } else {
                if (context.mounted) {
                  _showSnackBar(
                    'الملف غير موجود، يرجى تحميله مجدداً',
                    Colors.orangeAccent,
                  );
                  offlineService.removeDownloadedMaterial(material.id);
                  setState(() {});
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blueAccent.shade700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.visibility_rounded, size: 20),
            label: const Text(
              'فتح الملف',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () async {
              final fileName = 'material_${material.id}.pdf';
              final localPath = await DownloadHelper.getLocalPath(fileName);
              if (File(localPath).existsSync()) {
                if (context.mounted) {
                  context.push(
                    '/pdf_viewer',
                    extra: {
                      'path': localPath,
                      'isLocal': true,
                      'title': material.title,
                    },
                  );
                }
              } else {
                if (context.mounted) {
                  _showSnackBar(
                    'الملف غير موجود، يرجى تحميله مجدداً',
                    Colors.orangeAccent,
                  );
                  offlineService.removeDownloadedMaterial(material.id);
                  setState(() {});
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.greenAccent.shade700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardBase({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onDelete,
    required Widget actionButton,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Material(
              color: Colors.white.withOpacity(0.08),
              child: Container(
                padding: const EdgeInsets.all(20.0),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Colors.white.withOpacity(0.15),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: iconColor.withOpacity(0.15),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: iconColor.withOpacity(0.5),
                              width: 1,
                            ),
                          ),
                          child: Icon(icon, color: iconColor, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                subtitle,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.7),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline_rounded,
                            color: Colors.redAccent,
                            size: 28,
                          ),
                          tooltip: 'حذف',
                          onPressed: onDelete,
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: actionButton),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.cloud_off_rounded,
            size: 80,
            color: Colors.white.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlurOrb({required Color color, required double size}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withOpacity(0.15),
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 50.0, sigmaY: 50.0),
        child: Container(color: Colors.transparent),
      ),
    );
  }

  void _showSnackBar(String message, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showGuestWarningDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            backgroundColor: const Color(0xFF16213E),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            title: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent),
                SizedBox(width: 8),
                Text(
                  'تنبيه',
                  style: TextStyle(
                    color: Colors.orangeAccent,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            content: const Text(
              'أنت مسجل كضيف حالياً. لا يمكنك أداء الاختبارات المحفوظة إلا بعد إنشاء حساب أو تسجيل الدخول بحساب طالب مسجل مسبقاً.',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'إلغاء',
                  style: TextStyle(color: Colors.white70),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.greenAccent.shade700,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  Navigator.pop(context);
                  context.go('/login');
                },
                child: const Text(
                  'تسجيل الدخول',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
