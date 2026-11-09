import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';

import 'package:device_info_plus/device_info_plus.dart';

class DownloadHelper {
  static Future<String> getLocalPath(String fileName) async {
    // Always use application documents directory for reliable internal storage
    // This circumvents all Android Scoped Storage issues and stops the black screen bug
    final dir = await getApplicationDocumentsDirectory();
    final examDir = Directory('${dir.path}/ExamYemen');
    if (!await examDir.exists()) {
      await examDir.create(recursive: true);
    }
    return '${examDir.path}/$fileName';
  }

  static Future<bool> isFileDownloaded(String fileName) async {
    final path = await getLocalPath(fileName);
    return File(path).exists();
  }

  static Future<void> downloadFile(
    String url,
    String fileName,
    Function(int, int) onProgress,
  ) async {
    return downloadFileWithToken(url, fileName, null, onProgress);
  }

  static Future<void> downloadFileWithToken(
    String url,
    String fileName,
    CancelToken? cancelToken,
    Function(int, int) onProgress,
  ) async {
    try {
      final finalPath = await getLocalPath(fileName);
      final tempPath = '$finalPath.tmp';
      final dio = Dio();

      await dio.download(
        url,
        tempPath,
        onReceiveProgress: onProgress,
        cancelToken: cancelToken,
      );

      // On success, rename temp file to actual file
      File(tempPath).renameSync(finalPath);
    } catch (e) {
      // Clean up temp file on failure or cancellation
      final finalPath = await getLocalPath(fileName);
      final tempFile = File('$finalPath.tmp');
      if (tempFile.existsSync()) {
        try {
          tempFile.deleteSync();
        } catch (_) {}
      }
      throw Exception('فشل التحميل: $e');
    }
  }

  static Future<void> deleteFile(String fileName) async {
    try {
      final path = await getLocalPath(fileName);
      final file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {}
  }

  static Future<String> exportToDownloads(String sourcePath, String preferredName) async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await DeviceInfoPlugin().androidInfo;
        final sdkInt = androidInfo.version.sdkInt;

        bool hasPermission = false;

        if (sdkInt >= 33) {
          // في أندرويد 13 فما فوق، لا نحتاج لطلب صلاحية Storage لحفظ ملف جديد في التنزيلات
          // النظام يسمح للتطبيق بالكتابة في مجلد Download الخاص به أو العام للملفات الجديدة
          hasPermission = true; 
        } else {
          // للإصدارات الأقدم من 13، نطلب الصلاحية التقليدية
          var status = await Permission.storage.request();
          hasPermission = status.isGranted;
        }

        if (hasPermission || await Permission.manageExternalStorage.isGranted) {
          final directory = Directory('/storage/emulated/0/Download');
          if (!directory.existsSync()) {
            directory.createSync(recursive: true);
          }

          final safeName = preferredName.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
          String savePath = "${directory.path}/$safeName";

          // التعامل مع الملفات المكررة لمنع الـ Exception
          File newFile = File(savePath);
          int counter = 1;
          while (newFile.existsSync()) {
            final extension = safeName.contains('.') ? safeName.split('.').last : 'pdf';
            final nameWithoutExt = safeName.contains('.') 
                ? safeName.substring(0, safeName.lastIndexOf('.')) 
                : safeName;
            savePath = "${directory.path}/${nameWithoutExt}_$counter.$extension";
            newFile = File(savePath);
            counter++;
          }

          // نسخ الملف
          await File(sourcePath).copy(newFile.path);
          return newFile.path;
        } else {
          throw Exception("تم رفض صلاحية الوصول للتخزين. يرجى تفعيلها من الإعدادات.");
        }
      } else {
        // كود iOS يبقى كما هو
        final directory = await getApplicationDocumentsDirectory();
        final savePath = "${directory.path}/$preferredName";
        await File(sourcePath).copy(savePath);
        return savePath;
      }
    } catch (e) {
      throw Exception('فشل التصدير: $e');
    }
  }

  static Future<void> shareFile(String sourcePath, String preferredName) async {
    try {
      final file = File(sourcePath);
      if (await file.exists()) {
        await Share.shareXFiles([XFile(sourcePath)], text: preferredName);
      } else {
         throw Exception("الملف غير متوفر للمشاركة");
      }
    } catch (e) {
      throw Exception('فشل التصدير والمشاركة: $e');
    }
  }
}
