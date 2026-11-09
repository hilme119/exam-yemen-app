import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/number_formatter.dart';

class VoiceAudioPlayerWidget extends StatefulWidget {
  final String audioUrl;
  final String? title;
  final Color? accentColor;
  final bool isCompact;

  const VoiceAudioPlayerWidget({
    super.key,
    required this.audioUrl,
    this.title,
    this.accentColor,
    this.isCompact = false,
  });

  @override
  State<VoiceAudioPlayerWidget> createState() => _VoiceAudioPlayerWidgetState();
}

class _VoiceAudioPlayerWidgetState extends State<VoiceAudioPlayerWidget> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  bool _isSeeking = false;
  double _sliderValue = 0.0;

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    try {
      final uri = Uri.parse(widget.audioUrl);
      _controller = VideoPlayerController.networkUrl(uri);
      await _controller!.initialize();
      _controller!.addListener(_onControllerUpdate);
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _hasError = false;
        });
      }
    } catch (e) {
      debugPrint('VoiceAudioPlayerWidget init error: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
        });
      }
    }
  }

  void _onControllerUpdate() {
    if (!mounted || _isSeeking || _controller == null) return;
    final value = _controller!.value;
    if (value.duration > Duration.zero) {
      final progress =
          value.position.inMilliseconds / value.duration.inMilliseconds;
      setState(() {
        _sliderValue = progress.clamp(0.0, 1.0);
      });
      // Auto reset at end
      if (value.position >= value.duration && !value.isPlaying) {
        _controller!.seekTo(Duration.zero);
      }
    }
  }

  @override
  void dispose() {
    _controller?.removeListener(_onControllerUpdate);
    _controller?.dispose();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  void _togglePlayPause() {
    if (_controller == null || !_isInitialized) return;
    if (_controller!.value.isPlaying) {
      _controller!.pause();
    } else {
      _controller!.play();
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final accent = widget.accentColor ?? AppColors.primaryAccent;

    if (_hasError) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.red.withAlpha(15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.red.withAlpha(40)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.red, size: 20),
            const SizedBox(width: 8),
            const Text(
              'تعذر تشغيل التسجيل الصوتي',
              style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            TextButton(
              onPressed: () {
                setState(() {
                  _hasError = false;
                  _isInitialized = false;
                });
                _initPlayer();
              },
              child: const Text('إعادة المحاولة', style: TextStyle(fontSize: 11)),
            ),
          ],
        ),
      );
    }

    final isPlaying = _controller?.value.isPlaying ?? false;
    final position = _controller?.value.position ?? Duration.zero;
    final totalDuration = _controller?.value.duration ?? Duration.zero;

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: widget.isCompact ? 10 : 14,
          vertical: widget.isCompact ? 8 : 12,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: accent.withAlpha(50), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: accent.withAlpha(12),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (widget.title != null) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    widget.title!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: accent,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(Icons.mic_rounded, size: 16, color: accent),
                ],
              ),
              const SizedBox(height: 6),
            ],
            Row(
              children: [
                // Play / Pause Button
                GestureDetector(
                  onTap: _isInitialized ? _togglePlayPause : null,
                  child: Container(
                    width: widget.isCompact ? 36 : 42,
                    height: widget.isCompact ? 36 : 42,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [accent, accent.withAlpha(210)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: accent.withAlpha(60),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Center(
                      child: !_isInitialized
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Icon(
                              isPlaying
                                  ? Icons.pause_rounded
                                  : Icons.play_arrow_rounded,
                              color: Colors.white,
                              size: widget.isCompact ? 22 : 26,
                            ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Progress Bar & Duration
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Slider
                      SliderTheme(
                        data: SliderThemeData(
                          trackHeight: 4.0,
                          thumbShape: const RoundSliderThumbShape(
                            enabledThumbRadius: 6.0,
                          ),
                          overlayShape: const RoundSliderOverlayShape(
                            overlayRadius: 12.0,
                          ),
                          activeTrackColor: accent,
                          inactiveTrackColor: accent.withAlpha(35),
                          thumbColor: accent,
                          overlayColor: accent.withAlpha(30),
                        ),
                        child: Slider(
                          value: _sliderValue,
                          onChanged: !_isInitialized
                              ? null
                              : (val) {
                                  setState(() {
                                    _isSeeking = true;
                                    _sliderValue = val;
                                  });
                                },
                          onChangeEnd: !_isInitialized
                              ? null
                              : (val) {
                                  if (_controller != null &&
                                      _controller!.value.duration >
                                          Duration.zero) {
                                    final targetMs = (val *
                                            _controller!
                                                .value.duration.inMilliseconds)
                                        .round();
                                    _controller!
                                        .seekTo(Duration(milliseconds: targetMs));
                                  }
                                  setState(() {
                                    _isSeeking = false;
                                  });
                                },
                        ),
                      ),
                      // Time indicator
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              NumberFormatter.formatEnglishDigits(
                                _formatDuration(position),
                              ),
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                            ),
                            Text(
                              NumberFormatter.formatEnglishDigits(
                                _formatDuration(totalDuration),
                              ),
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Helper method to view any image in full-screen with pinch to zoom
void showFullScreenImage(BuildContext context, String imageUrl, {String? title}) {
  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(12),
      child: Stack(
        alignment: Alignment.center,
        children: [
          InteractiveViewer(
            panEnabled: true,
            minScale: 0.5,
            maxScale: 4.0,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    height: 250,
                    width: 250,
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                  );
                },
                errorBuilder: (context, error, stack) => Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.broken_image_rounded, size: 48, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('تعذر تحميل الصورة'),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 10,
            right: 10,
            child: GestureDetector(
              onTap: () => Navigator.pop(ctx),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.black87,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
              ),
            ),
          ),
          if (title != null)
            Positioned(
              bottom: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

