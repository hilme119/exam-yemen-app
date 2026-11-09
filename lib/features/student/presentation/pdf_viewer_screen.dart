import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/utils/download_helper.dart';

class PdfViewerScreen extends StatefulWidget {
  final String path;
  final String title;
  final bool isLocal;

  const PdfViewerScreen({
    super.key,
    required this.path,
    required this.title,
    this.isLocal = false,
  });

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  double _downloadProgress = 0.0;
  bool _isDownloading = false;
  Uint8List? _pdfData;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (!widget.isLocal) {
      _downloadPdfMemory();
    }
  }

  Future<void> _downloadPdfMemory() async {
    setState(() {
      _isDownloading = true;
      _errorMessage = null;
    });

    try {
      final dio = Dio();
      final response = await dio.get<List<int>>(
        widget.path,
        options: Options(responseType: ResponseType.bytes),
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
      );

      setState(() {
        _pdfData = Uint8List.fromList(response.data!);
        _isDownloading = false;
      });
    } catch (e) {
      setState(() {
        _isDownloading = false;
        _errorMessage = 'فشل تحميل الملف: يرجى التأكد من اتصالك بالإنترنت.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090B10),
      appBar: AppBar(
        title: Text(
          widget.title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: const Color(0xFF131722),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (widget.isLocal)
            IconButton(
              icon: const Icon(Icons.share_rounded, color: Colors.white),
              tooltip: 'مشاركة الملف',
              onPressed: () async {
                try {
                  await DownloadHelper.shareFile(widget.path, '${widget.title}.pdf');
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent),
                    );
                  }
                }
              },
            ),
          if (widget.isLocal || widget.path.startsWith('http'))
            IconButton(
              icon: Icon(
                widget.isLocal ? Icons.save_alt_rounded : Icons.copy_rounded,
                color: Colors.white,
              ),
              tooltip: widget.isLocal ? 'حفظ بالجهاز' : 'نسخ الرابط',
              onPressed: () async {
                if (widget.isLocal) {
                  try {
                    final savedPath = await DownloadHelper.exportToDownloads(widget.path, '${widget.title}.pdf');
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('تم حفظ الملف بنجاح:\n$savedPath'), backgroundColor: Colors.greenAccent),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent),
                      );
                    }
                  }
                } else {
                  await Clipboard.setData(ClipboardData(text: widget.path));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم نسخ رابط الملف بنجاح'), backgroundColor: Colors.greenAccent),
                    );
                  }
                }
              },
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (widget.isLocal) {
      return SfPdfViewer.file(File(widget.path));
    }

    if (_isDownloading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: CircularProgressIndicator(
                    value: _downloadProgress > 0 ? _downloadProgress : null,
                    color: const Color(0xFF8B5CF6),
                    backgroundColor: Colors.white12,
                    strokeWidth: 6,
                  ),
                ),
                Text(
                  '${(_downloadProgress * 100).toInt()}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'جاري تحميل الملف وعرضه...',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 60),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.white, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6)),
              onPressed: _downloadPdfMemory,
              child: const Text('إعادة المحاولة', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }

    if (_pdfData != null) {
      return SfPdfViewer.memory(_pdfData!);
    }

    return const Center(child: Text('حدث خطأ غير معروف.', style: TextStyle(color: Colors.redAccent)));
  }
}
