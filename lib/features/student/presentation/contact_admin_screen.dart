import 'widgets/voice_recorder_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

import '../../../../domain/models/message_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/number_formatter.dart';
import '../../../core/services/storage_service.dart';
import 'widgets/voice_audio_player_widget.dart';

final studentMessagesProvider = StreamProvider.autoDispose<List<MessageModel>>((
  ref,
) {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return Stream.value([]);

  return FirebaseFirestore.instance
      .collection('messages')
      .where('userId', isEqualTo: user.id)
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((snapshot) {
        return snapshot.docs
            .map((doc) => MessageModel.fromJson(doc.data(), doc.id))
            .toList();
      });
});

class ContactAdminScreen extends StatelessWidget {
  const ContactAdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text(
            'مراسلة الإدارة والدعم الفني',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          backgroundColor: Colors.white,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          centerTitle: true,
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
          bottom: const TabBar(
            indicatorColor: AppColors.primaryAccent,
            indicatorWeight: 3,
            labelColor: AppColors.primaryAccent,
            unselectedLabelColor: AppColors.textSecondary,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            tabs: [
              Tab(
                text: 'إرسال رسالة جديدة',
                icon: Icon(Icons.send_rounded, size: 20),
              ),
              Tab(
                text: 'سجل المراسلات والردود',
                icon: Icon(Icons.chat_bubble_outline_rounded, size: 20),
              ),
            ],
          ),
        ),
        body: const TabBarView(
          children: [_SendMessageForm(), _MessagesHistoryList()],
        ),
      ),
    );
  }
}

class _SendMessageForm extends ConsumerStatefulWidget {
  const _SendMessageForm();

  @override
  ConsumerState<_SendMessageForm> createState() => _SendMessageFormState();
}

class _SendMessageFormState extends ConsumerState<_SendMessageForm> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  XFile? _selectedImage;
  PlatformFile? _selectedAudio;
  String? _recordedAudioPath;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final img = await picker.pickImage(source: source, imageQuality: 85);
      if (img != null) {
        setState(() => _selectedImage = img);
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _pickAudio() async {
    try {
      final res = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'opus'],
      );
      if (res != null && res.files.isNotEmpty) {
        setState(() => _selectedAudio = res.files.first);
      }
    } catch (e) {
      debugPrint('Error picking audio: $e');
    }
  }

  Future<void> _submitMessage() async {
    if (!_formKey.currentState!.validate()) return;

    final user = ref.read(authStateProvider).value;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('المستخدم غير مسجل الدخول')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      String? imageUrl;
      String? audioUrl;

      // 1. Upload attached image
      if (_selectedImage != null) {
        imageUrl = await StorageService.uploadFilePath(_selectedImage!.path);
      }

      // 2. Upload attached audio
      if (_recordedAudioPath != null) {
        audioUrl = await StorageService.uploadFilePath(_recordedAudioPath!);
      } else if (_selectedAudio != null) {
        audioUrl = await StorageService.uploadPlatformFile(_selectedAudio!);
      }

      final messageDoc = FirebaseFirestore.instance.collection('messages').doc();
      final message = MessageModel(
        id: messageDoc.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        subject: _subjectController.text.trim(),
        message: _messageController.text.trim(),
        imageUrl: imageUrl,
        audioUrl: audioUrl,
        createdAt: Timestamp.now(),
        isRead: false,
      );

      await messageDoc.set(message.toJson());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم إرسال رسالتك إلى الإدارة بنجاح!'),
            backgroundColor: AppColors.emeraldMint,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _subjectController.clear();
        _messageController.clear();
        setState(() {
          _selectedImage = null;
          _selectedAudio = null;
          _isSubmitting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'حدث خطأ أثناء الإرسال: ${ErrorHandler.getErrorMessage(e)}',
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppColors.cardShadow,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(40),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.support_agent_rounded,
                        size: 36,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'نحن هنا لمساعدتك دائماً',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'أرسل رسالتك أو استفسارك كتابياً مع إمكانية إرفاق صورة أو تسجيل صوتي.',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Subject Field
              const Text(
                'موضوع الرسالة',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _subjectController,
                style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'مثال: استفسار حول نتيجة اختبار القبول أو خطة المذاكرة',
                  hintStyle: const TextStyle(color: AppColors.textPlaceholder, fontSize: 13),
                  prefixIcon: const Icon(
                    Icons.topic_outlined,
                    color: AppColors.primaryAccent,
                  ),
                  filled: true,
                  fillColor: Colors.white,
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
                    borderSide: const BorderSide(color: AppColors.primaryAccent, width: 1.5),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'يرجى إدخال موضوع الرسالة';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Message Field
              const Text(
                'تفاصيل الرسالة',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _messageController,
                style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                maxLines: 5,
                decoration: InputDecoration(
                  hintText: 'اكتب نص رسالتك بالتفصيل هنا...',
                  hintStyle: const TextStyle(color: AppColors.textPlaceholder, fontSize: 13),
                  alignLabelWithHint: true,
                  filled: true,
                  fillColor: Colors.white,
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
                    borderSide: const BorderSide(color: AppColors.primaryAccent, width: 1.5),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'يرجى إدخال نص الرسالة';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Attached items chips
              if (_selectedImage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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

              // Attachments Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library_rounded, size: 18),
                      label: const Text('إرفاق صورة', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryAccent,
                        backgroundColor: Colors.white,
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: VoiceRecorderWidget(
                      onAudioChanged: (p) => setState(() => _recordedAudioPath = p),
                      onFilePicked: (f) => setState(() => _selectedAudio = f),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitMessage,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryAccent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 2,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'إرسال الرسالة إلى الدعم',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessagesHistoryList extends ConsumerWidget {
  const _MessagesHistoryList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messagesAsync = ref.watch(studentMessagesProvider);

    return messagesAsync.when(
      data: (messages) {
        if (messages.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 64,
                      color: AppColors.textPlaceholder,
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'لا توجد رسائل سابقة',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'ستظهر هنا جميع رسائلك السابقة وردود إدارة المنظومة عليها فور وصولها.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ),
          );
        }

        // Mark unread admin replies as read
        WidgetsBinding.instance.addPostFrameCallback((_) {
          for (var message in messages) {
            if (message.adminReply != null && !message.isReadByStudent) {
              FirebaseFirestore.instance
                  .collection('messages')
                  .doc(message.id)
                  .update({'isReadByStudent': true});
            }
          }
        });

        return ListView.builder(
          padding: const EdgeInsets.all(16.0),
          physics: const BouncingScrollPhysics(),
          itemCount: messages.length,
          itemBuilder: (context, index) {
            final message = messages[index];
            final hasReply = (message.adminReply != null && message.adminReply!.isNotEmpty) ||
                (message.adminReplyImageUrl != null && message.adminReplyImageUrl!.isNotEmpty) ||
                (message.adminReplyAudioUrl != null && message.adminReplyAudioUrl!.isNotEmpty);

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: hasReply ? AppColors.emeraldMint.withAlpha(60) : AppColors.border,
                ),
                boxShadow: AppColors.cardShadow,
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            message.subject,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: hasReply
                                ? AppColors.emeraldMint.withAlpha(20)
                                : Colors.amber.withAlpha(25),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            hasReply ? 'تم الرد' : 'قيد الانتظار',
                            style: TextStyle(
                              color: hasReply ? AppColors.emeraldMint : Colors.amber.shade900,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      NumberFormatter.formatEnglishDigits(
                        DateFormat('yyyy/MM/dd - hh:mm a').format(message.createdAt.toDate()),
                      ),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Student Message Text
                    Text(
                      message.message,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),

                    // Attached student image
                    if (message.imageUrl != null && message.imageUrl!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      GestureDetector(
                        onTap: () => showFullScreenImage(
                          context,
                          message.imageUrl!,
                          title: 'الصورة المرفقة برسالتك',
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            message.imageUrl!,
                            height: 130,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ],

                    // Attached student voice note
                    if (message.audioUrl != null && message.audioUrl!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      VoiceAudioPlayerWidget(
                        audioUrl: message.audioUrl!,
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
                            if (message.adminReply != null && message.adminReply!.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                message.adminReply!,
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  height: 1.5,
                                ),
                              ),
                            ],
                            // Admin Photo Reply
                            if (message.adminReplyImageUrl != null &&
                                message.adminReplyImageUrl!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              GestureDetector(
                                onTap: () => showFullScreenImage(
                                  context,
                                  message.adminReplyImageUrl!,
                                  title: 'صورة توضيحية من الإدارة',
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.network(
                                    message.adminReplyImageUrl!,
                                    height: 130,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            ],
                            // Admin Audio Reply
                            if (message.adminReplyAudioUrl != null &&
                                message.adminReplyAudioUrl!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              VoiceAudioPlayerWidget(
                                audioUrl: message.adminReplyAudioUrl!,
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
          },
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.primaryAccent),
      ),
      error: (e, st) => Center(
        child: Text(
          'حدث خطأ في تحميل الرسائل: ${ErrorHandler.getErrorMessage(e)}',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
    );
  }
}
