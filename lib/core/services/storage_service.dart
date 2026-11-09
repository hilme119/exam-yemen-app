import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

class StorageService {
  static const String _cloudName = 'dxp5laxvz';
  static const String _uploadPreset = 'exam_yemen_uploads';
  static const String _autoUploadUrl =
      'https://api.cloudinary.com/v1_1/$_cloudName/auto/upload';

  /// Uploads a PlatformFile to Cloudinary (auto resource type), with Firebase Storage fallback.
  static Future<String?> uploadPlatformFile(
    PlatformFile file, {
    String resourceType = 'auto',
  }) async {
    // 1. Try Cloudinary first
    try {
      final uri = Uri.parse(_autoUploadUrl);
      final request = http.MultipartRequest('POST', uri);
      request.fields['upload_preset'] = _uploadPreset;

      if (file.bytes != null) {
        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
            file.bytes!,
            filename: file.name,
          ),
        );
      } else if (file.path != null) {
        request.files.add(
          await http.MultipartFile.fromPath('file', file.path!),
        );
      } else {
        return null;
      }

      final response = await request.send();
      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = await response.stream.bytesToString();
        final jsonResponse = json.decode(responseData);
        final url = jsonResponse['secure_url'] as String?;
        if (url != null && url.isNotEmpty) {
          return url;
        }
      }
    } catch (e) {
      debugPrint('Cloudinary upload warning: $e');
    }

    // 2. Fallback to Firebase Storage
    try {
      final ext = file.name.contains('.') ? file.name.split('.').last : 'dat';
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('user_uploads/${const Uuid().v4()}.$ext');

      if (file.bytes != null) {
        final task = await storageRef.putData(file.bytes!);
        return await task.ref.getDownloadURL();
      } else if (file.path != null) {
        final task = await storageRef.putFile(File(file.path!));
        return await task.ref.getDownloadURL();
      }
    } catch (e) {
      debugPrint('Firebase Storage upload error: $e');
    }

    return null;
  }

  /// Uploads a local file path (e.g. from ImagePicker or local recorder)
  static Future<String?> uploadFilePath(
    String filePath, {
    String? filename,
    String resourceType = 'auto',
  }) async {
    final name = filename ?? filePath.split(Platform.pathSeparator).last;
    
    // 1. Try Cloudinary
    try {
      final uri = Uri.parse(_autoUploadUrl);
      final request = http.MultipartRequest('POST', uri);
      request.fields['upload_preset'] = _uploadPreset;
      request.files.add(await http.MultipartFile.fromPath('file', filePath, filename: name));

      final response = await request.send();
      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = await response.stream.bytesToString();
        final jsonResponse = json.decode(responseData);
        final url = jsonResponse['secure_url'] as String?;
        if (url != null && url.isNotEmpty) {
          return url;
        }
      }
    } catch (e) {
      debugPrint('Cloudinary uploadFilePath warning: $e');
    }

    // 2. Fallback to Firebase Storage
    try {
      final ext = name.contains('.') ? name.split('.').last : 'dat';
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('user_uploads/${const Uuid().v4()}.$ext');
      final task = await storageRef.putFile(File(filePath));
      return await task.ref.getDownloadURL();
    } catch (e) {
      debugPrint('Firebase Storage uploadFilePath error: $e');
    }

    return null;
  }

  /// Backward-compatible method
  static Future<String?> uploadImage({
    required String path,
    required PlatformFile file,
  }) async {
    return uploadPlatformFile(file, resourceType: 'image');
  }
}
