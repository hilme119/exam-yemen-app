import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:video_player/video_player.dart';
import '../../../../core/theme/app_colors.dart';

enum RecordingState { idle, recording, stopped }

class VoiceRecorderWidget extends StatefulWidget {
  final Function(String? filePath) onAudioChanged;
  final Function(PlatformFile? pickedFile)? onFilePicked;
  final String? initialFilePath;

  const VoiceRecorderWidget({
    super.key,
    required this.onAudioChanged,
    this.onFilePicked,
    this.initialFilePath,
  });

  @override
  State<VoiceRecorderWidget> createState() => _VoiceRecorderWidgetState();
}

class _VoiceRecorderWidgetState extends State<VoiceRecorderWidget>
    with SingleTickerProviderStateMixin {
  late final AudioRecorder _audioRecorder;
  RecordingState _recordingState = RecordingState.idle;
  String? _recordedFilePath;
  int _recordDurationSeconds = 0;
  Timer? _timer;
  late AnimationController _pulseController;

  // Local audio preview playback
  VideoPlayerController? _previewPlayer;
  bool _isPlayingPreview = false;

  @override
  void initState() {
    super.initState();
    _audioRecorder = AudioRecorder();
    _recordedFilePath = widget.initialFilePath;
    if (_recordedFilePath != null && _recordedFilePath!.isNotEmpty) {
      _recordingState = RecordingState.stopped;
      _initPreviewPlayer(_recordedFilePath!);
    }

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    _previewPlayer?.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final tempDir = await getTemporaryDirectory();
        final path =
            '${tempDir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc, bitRate: 128000),
          path: path,
        );

        setState(() {
          _recordingState = RecordingState.recording;
          _recordDurationSeconds = 0;
          _recordedFilePath = null;
        });

        widget.onAudioChanged(null);
        if (widget.onFilePicked != null) widget.onFilePicked!(null);

        _timer?.cancel();
        _timer = Timer.periodic(const Duration(seconds: 1), (t) {
          if (!mounted) return;
          setState(() {
            _recordDurationSeconds++;
          });
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('يرجى منح إذن استخدام الميكروفون لتسجيل الصوت'),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    try {
      final path = await _audioRecorder.stop();
      if (path != null && path.isNotEmpty) {
        setState(() {
          _recordingState = RecordingState.stopped;
          _recordedFilePath = path;
        });
        widget.onAudioChanged(path);
        _initPreviewPlayer(path);
      } else {
        setState(() {
          _recordingState = RecordingState.idle;
        });
      }
    } catch (e) {
      debugPrint('Error stopping recording: $e');
      setState(() => _recordingState = RecordingState.idle);
    }
  }

  Future<void> _cancelRecording() async {
    _timer?.cancel();
    try {
      await _audioRecorder.stop();
    } catch (_) {}
    setState(() {
      _recordingState = RecordingState.idle;
      _recordDurationSeconds = 0;
      _recordedFilePath = null;
    });
    widget.onAudioChanged(null);
  }

  void _initPreviewPlayer(String path) {
    _previewPlayer?.dispose();
    _previewPlayer = VideoPlayerController.file(File(path))
      ..initialize().then((_) {
        if (mounted) setState(() {});
      })
      ..addListener(() {
        if (!mounted || _previewPlayer == null) return;
        final isPlaying = _previewPlayer!.value.isPlaying;
        if (_isPlayingPreview != isPlaying) {
          setState(() => _isPlayingPreview = isPlaying);
        }
        if (_previewPlayer!.value.position >= _previewPlayer!.value.duration &&
            !isPlaying) {
          _previewPlayer!.seekTo(Duration.zero);
        }
      });
  }

  void _deleteRecording() {
    _previewPlayer?.pause();
    _previewPlayer?.dispose();
    _previewPlayer = null;
    if (_recordedFilePath != null) {
      try {
        final f = File(_recordedFilePath!);
        if (f.existsSync()) f.deleteSync();
      } catch (_) {}
    }
    setState(() {
      _recordingState = RecordingState.idle;
      _recordedFilePath = null;
      _recordDurationSeconds = 0;
      _isPlayingPreview = false;
    });
    widget.onAudioChanged(null);
  }

  Future<void> _pickAudioFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'opus'],
      );
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.path != null) {
          setState(() {
            _recordingState = RecordingState.stopped;
            _recordedFilePath = file.path;
          });
          widget.onAudioChanged(file.path);
          if (widget.onFilePicked != null) widget.onFilePicked!(file);
          _initPreviewPlayer(file.path!);
        }
      }
    } catch (e) {
      debugPrint('Error picking audio file: $e');
    }
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_recordingState == RecordingState.recording) {
      return _buildActiveRecordingBar();
    }

    if (_recordingState == RecordingState.stopped &&
        _recordedFilePath != null &&
        _recordedFilePath!.isNotEmpty) {
      return _buildRecordedPreviewBar();
    }

    return _buildIdleTriggerButtons();
  }

  Widget _buildIdleTriggerButtons() {
    return Row(
      children: [
        // Voice Record Trigger (WhatsApp style)
        Expanded(
          flex: 3,
          child: InkWell(
            onTap: _startRecording,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.emeraldMint.withAlpha(20),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppColors.emeraldMint.withAlpha(80),
                  width: 1.2,
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.mic_rounded,
                    color: AppColors.emeraldMint,
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'تسجيل صوتي (ميكروفون)',
                    style: TextStyle(
                      color: AppColors.emeraldMint,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        // File Pick Option
        IconButton(
          onPressed: _pickAudioFile,
          icon: const Icon(
            Icons.attach_file_rounded,
            color: AppColors.textSecondary,
            size: 20,
          ),
          tooltip: 'إرفاق ملف صوتي جاهز من الجهاز',
          style: IconButton.styleFrom(
            backgroundColor: AppColors.surfaceLight,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.border),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveRecordingBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.redAccent.withAlpha(100), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.redAccent.withAlpha(40),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Blinking recording indicator
          FadeTransition(
            opacity: _pulseController,
            child: Container(
              width: 14,
              height: 14,
              decoration: const BoxDecoration(
                color: Colors.redAccent,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 10),
          const Text(
            'جاري التسجيل...',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            _formatDuration(_recordDurationSeconds),
            style: const TextStyle(
              color: Colors.amberAccent,
              fontFamily: 'monospace',
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const Spacer(),
          // Discard Button
          IconButton(
            onPressed: _cancelRecording,
            icon: const Icon(Icons.delete_outline_rounded, color: Colors.white70, size: 20),
            tooltip: 'إلغاء التسجيل',
          ),
          const SizedBox(width: 4),
          // Done/Save Recording Button
          ElevatedButton.icon(
            onPressed: _stopRecording,
            icon: const Icon(Icons.check_rounded, size: 16),
            label: const Text(
              'حفظ الصوت',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.emeraldMint,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordedPreviewBar() {
    final duration = _previewPlayer?.value.duration ?? Duration.zero;
    final totalSec = duration.inSeconds > 0 ? duration.inSeconds : _recordDurationSeconds;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.emeraldMint.withAlpha(15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.emeraldMint.withAlpha(60),
          width: 1.2,
        ),
      ),
      child: Row(
        children: [
          // Play / Pause Button
          GestureDetector(
            onTap: () {
              if (_previewPlayer == null) return;
              if (_isPlayingPreview) {
                _previewPlayer!.pause();
              } else {
                _previewPlayer!.play();
              }
            },
            child: Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: AppColors.emeraldMint,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isPlayingPreview
                    ? Icons.pause_rounded
                    : Icons.play_arrow_rounded,
                color: Colors.white,
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Row(
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.emeraldMint,
                      size: 14,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'تسجيل صوتي جاهز للإرسال',
                      style: TextStyle(
                        color: AppColors.emeraldMint,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'المدة: ${_formatDuration(totalSec)}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          // Delete / Re-record button
          IconButton(
            onPressed: _deleteRecording,
            icon: const Icon(
              Icons.delete_forever_rounded,
              color: AppColors.error,
              size: 22,
            ),
            tooltip: 'حذف وإعادة التسجيل',
          ),
        ],
      ),
    );
  }
}

