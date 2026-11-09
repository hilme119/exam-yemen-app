import 'widgets/voice_recorder_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:uuid/uuid.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/number_formatter.dart';
import '../../../core/services/storage_service.dart';
import '../../../domain/models/question_feedback_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/question_feedback_provider.dart';
import 'widgets/voice_audio_player_widget.dart';

class StudentFeedbacksScreen extends ConsumerWidget {
  const StudentFeedbacksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedbacksAsync = ref.watch(studentFeedbacksProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
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
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'ملاحظاتي واعتراضاتي',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryAccent.withAlpha(15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primaryAccent.withAlpha(40)),
              ),
              child: const Icon(
                Icons.add_comment_rounded,
                color: AppColors.primaryAccent,
                size: 18,
              ),
            ),
            tooltip: 'إضافة ملاحظة عامة',
            onPressed: () => _showAddGeneralFeedbackDialog(context, ref),
          ),
          const SizedBox(width: 8),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddGeneralFeedbackDialog(context, ref),
        backgroundColor: AppColors.primaryAccent,
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.edit_note_rounded, size: 20),
        label: const Text(
          'إضافة ملاحظة جديدة',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
      ),
      body: SafeArea(
        child: feedbacksAsync.when(
          data: (feedbacks) {
            if (feedbacks.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.primaryAccent.withAlpha(15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.speaker_notes_off_rounded,
                          size: 64,
                          color: AppColors.primaryAccent,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'لا توجد ملاحظات مرسلة بعد',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'عند مواجهة أي استفسار أو خطأ في النماذج أو الاختبارات، يمكنك إرسال ملاحظة كتابية أو صوتية وصورة مرفقة وسيتم الرد عليك فوراً.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () => _showAddGeneralFeedbackDialog(context, ref),
                        icon: const Icon(Icons.add_rounded, size: 20),
                        label: const Text('إرسال ملاحظة الآن'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryAccent,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
              physics: const BouncingScrollPhysics(),
              itemCount: feedbacks.length,
              itemBuilder: (context, index) {
                return _StudentFeedbackCard(feedback: feedbacks[index]);
              },
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryAccent),
          ),
          error: (e, st) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'حدث خطأ في تحميل الملاحظات: ${ErrorHandler.getErrorMessage(e)}',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.error, fontSize: 14),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showAddGeneralFeedbackDialog(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddGeneralFeedbackSheet(ref: ref),
    );
  }
}

class _StudentFeedbackCard extends ConsumerStatefulWidget {
  final QuestionFeedbackModel feedback;

  const _StudentFeedbackCard({required this.feedback});

  @override
  ConsumerState<_StudentFeedbackCard> createState() =>
      _StudentFeedbackCardState();
}

class _StudentFeedbackCardState extends ConsumerState<_StudentFeedbackCard> {
  bool _hasMarked = false;

  @override
  void initState() {
    super.initState();
    _checkAndMark();
  }

  void _checkAndMark() {
    final hasReply = widget.feedback.adminReply != null &&
        widget.feedback.adminReply!.isNotEmpty;
    if (hasReply && !widget.feedback.isReadByStudent && !_hasMarked) {
      _hasMarked = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ref
            .read(questionFeedbackNotifierProvider.notifier)
            .markAsReadByStudent(widget.feedback.id);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final feedback = widget.feedback;
    final hasReply = (feedback.adminReply != null && feedback.adminReply!.isNotEmpty) ||
        (feedback.adminReplyImageUrl != null && feedback.adminReplyImageUrl!.isNotEmpty) ||
        (feedback.adminReplyAudioUrl != null && feedback.adminReplyAudioUrl!.isNotEmpty);

    final isUnreadReply = hasReply && !feedback.isReadByStudent;

    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isUnreadReply
              ? AppColors.primaryAccent
              : (hasReply ? AppColors.emeraldMint.withAlpha(70) : AppColors.border),
          width: isUnreadReply ? 2 : 1,
        ),
        boxShadow: AppColors.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and Date Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: hasReply
                        ? AppColors.emeraldMint.withAlpha(20)
                        : Colors.amber.withAlpha(25),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: hasReply
                          ? AppColors.emeraldMint.withAlpha(60)
                          : Colors.amber.withAlpha(80),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        hasReply
                            ? Icons.check_circle_rounded
                            : Icons.access_time_rounded,
                        color: hasReply ? AppColors.emeraldMint : Colors.amber.shade800,
                        size: 15,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        hasReply ? 'تم الرد من الإدارة' : 'قيد التدقيق والمراجعة',
                        style: TextStyle(
                          color: hasReply ? AppColors.emeraldMint : Colors.amber.shade900,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  NumberFormatter.formatEnglishDigits(
                    DateFormat('yyyy/MM/dd - hh:mm a').format(feedback.createdAt),
                  ),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Linked Question / Subject Bar
            if (feedback.questionText.isNotEmpty || feedback.examName.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.quiz_outlined,
                      color: AppColors.primaryAccent,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (feedback.examName.isNotEmpty || feedback.subjectName.isNotEmpty)
                            Text(
                              '${feedback.subjectName} • ${feedback.examName}' +
                                  (feedback.questionNumber > 0
                                      ? ' (سؤال #${NumberFormatter.formatEnglishDigits(feedback.questionNumber.toString())})'
                                      : ''),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryAccent,
                              ),
                            ),
                          if (feedback.questionText.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Text(
                              feedback.questionText,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
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
              ),

            // User Note Label
            const Text(
              'ملاحظتك أو استفسارك:',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              feedback.note,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
                height: 1.5,
              ),
            ),

            // Attached Student Photo (if present)
            if (feedback.imageUrl != null && feedback.imageUrl!.isNotEmpty) ...[
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () => showFullScreenImage(
                  context,
                  feedback.imageUrl!,
                  title: 'الصورة المرفقة بملاحظتك',
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Image.network(
                        feedback.imageUrl!,
                        height: 140,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        loadingBuilder: (ctx, child, progress) {
                          if (progress == null) return child;
                          return Container(
                            height: 140,
                            color: AppColors.surfaceLight,
                            child: const Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primaryAccent,
                              ),
                            ),
                          );
                        },
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        margin: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withAlpha(160),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.zoom_in_rounded, color: Colors.white, size: 14),
                            SizedBox(width: 4),
                            Text(
                              'اضغط للمعاينة',
                              style: TextStyle(color: Colors.white, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Attached Student Voice Recording (if present)
            if (feedback.audioUrl != null && feedback.audioUrl!.isNotEmpty) ...[
              const SizedBox(height: 10),
              VoiceAudioPlayerWidget(
                audioUrl: feedback.audioUrl!,
                title: 'تسجيلك الصوتي',
                accentColor: AppColors.primaryAccent,
              ),
            ],

            // Admin Reply Section
            if (hasReply) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.emeraldMint.withAlpha(15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.emeraldMint.withAlpha(50),
                    width: 1.2,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.emeraldMint,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.admin_panel_settings_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'رد إدارة المنظومة:',
                          style: TextStyle(
                            color: AppColors.emeraldMint,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    if (feedback.adminReply != null && feedback.adminReply!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        feedback.adminReply!,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          height: 1.5,
                        ),
                      ),
                    ],
                    // Admin Photo
                    if (feedback.adminReplyImageUrl != null &&
                        feedback.adminReplyImageUrl!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      GestureDetector(
                        onTap: () => showFullScreenImage(
                          context,
                          feedback.adminReplyImageUrl!,
                          title: 'صورة توضيحية من الإدارة',
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            feedback.adminReplyImageUrl!,
                            height: 130,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ],
                    // Admin Voice Note
                    if (feedback.adminReplyAudioUrl != null &&
                        feedback.adminReplyAudioUrl!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      VoiceAudioPlayerWidget(
                        audioUrl: feedback.adminReplyAudioUrl!,
                        title: 'تسجيل صوتي من الإدارة',
                        accentColor: AppColors.emeraldMint,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Modal Sheet to add a general feedback or report with text, image, and voice attachment
class _AddGeneralFeedbackSheet extends StatefulWidget {
  final WidgetRef ref;

  const _AddGeneralFeedbackSheet({required this.ref});

  @override
  State<_AddGeneralFeedbackSheet> createState() =>
      _AddGeneralFeedbackSheetState();
}

class _AddGeneralFeedbackSheetState extends State<_AddGeneralFeedbackSheet> {
  final _noteController = TextEditingController();
  XFile? _selectedImage;
  PlatformFile? _selectedAudio;
  String? _recordedAudioPath;
  bool _isUploading = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: source, imageQuality: 85);
      if (image != null) {
        setState(() {
          _selectedImage = image;
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _pickAudio() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'opus'],
      );
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedAudio = result.files.first;
        });
      }
    } catch (e) {
      debugPrint('Error picking audio: $e');
    }
  }

  Future<void> _submit() async {
    final note = _noteController.text.trim();
    if (note.isEmpty && _selectedImage == null && _selectedAudio == null && _recordedAudioPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى كتابة ملاحظتك أو إرفاق صورة أو تسجيل صوتي'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final user = widget.ref.read(authStateProvider).value;
    if (user == null) {
      Navigator.pop(context);
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      String? imageUrl;
      String? audioUrl;

      // 1. Upload image if selected
      if (_selectedImage != null) {
        imageUrl = await StorageService.uploadFilePath(_selectedImage!.path);
      }

      // 2. Upload audio if selected
      if (_recordedAudioPath != null) {
        audioUrl = await StorageService.uploadFilePath(_recordedAudioPath!);
      } else if (_selectedAudio != null) {
        audioUrl = await StorageService.uploadPlatformFile(_selectedAudio!);
      }

      final feedback = QuestionFeedbackModel(
        id: const Uuid().v4(),
        userId: user.id,
        userName: user.name,
        examId: 'general',
        examName: 'ملاحظة عامة',
        gradeName: user.gradeLevel?.name ?? 'غير محدد',
        subjectName: 'منظومة الاختبارات',
        questionId: 'general_${DateTime.now().millisecondsSinceEpoch}',
        questionNumber: 0,
        questionText: 'ملاحظة عامة على التطبيق أو الأسئلة',
        note: note.isNotEmpty ? note : 'ملاحظة مع مرفق',
        imageUrl: imageUrl,
        audioUrl: audioUrl,
        createdAt: DateTime.now(),
      );

      await widget.ref
          .read(questionFeedbackNotifierProvider.notifier)
          .submitFeedback(feedback);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم إرسال ملاحظتك بنجاح، شكراً لك!'),
            backgroundColor: AppColors.emeraldMint,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ أثناء الإرسال: ${ErrorHandler.getErrorMessage(e)}'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'إرسال ملاحظة أو اقتراح جديد',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            const Text(
              'اكتب ملاحظتك بالتفصيل مع إمكانية إرفاق صورة توضيحية أو تسجيل صوتي',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _noteController,
              maxLines: 4,
              style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'اكتب نص الملاحظة هنا...',
                hintStyle: const TextStyle(color: AppColors.textPlaceholder),
                filled: true,
                fillColor: AppColors.surfaceLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.primaryAccent),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Attachment Badges if any
            if (_selectedImage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primaryAccent.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryAccent.withAlpha(40)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.image_rounded, color: AppColors.primaryAccent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _selectedImage!.name,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryAccent,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.error),
                      onPressed: () => setState(() => _selectedImage = null),
                    ),
                  ],
                ),
              ),

            if (_selectedAudio != null)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.emeraldMint.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.emeraldMint.withAlpha(40)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.mic_rounded, color: AppColors.emeraldMint, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _selectedAudio!.name,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.emeraldMint,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.error),
                      onPressed: () => setState(() => _selectedAudio = null),
                    ),
                  ],
                ),
              ),

            // Image Attachment Button
            OutlinedButton.icon(
              onPressed: () => _pickImage(ImageSource.gallery),
              icon: const Icon(Icons.photo_library_rounded, size: 18),
              label: const Text('إرفاق صورة توضيحية', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryAccent,
                side: const BorderSide(color: AppColors.border),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            // WhatsApp-style Voice Recorder
            VoiceRecorderWidget(
              onAudioChanged: (p) => setState(() => _recordedAudioPath = p),
              onFilePicked: (f) => setState(() => _selectedAudio = f),
            ),
            const SizedBox(height: 16),

            // Submit Button
            ElevatedButton(
              onPressed: _isUploading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: _isUploading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'إرسال الملاحظة الآن',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
