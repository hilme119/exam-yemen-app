import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AppUpdateInfo {
  final bool updateAvailable;
  final bool forceUpdate;
  final String latestVersion;
  final String downloadUrl;
  final String? releaseNotes;

  AppUpdateInfo({
    required this.updateAvailable,
    required this.forceUpdate,
    required this.latestVersion,
    required this.downloadUrl,
    this.releaseNotes,
  });
}

bool _isNewerVersion(String latestStr, String currentVerStr, String currentBuildStr) {
  final latestParts = latestStr.trim().split('+');
  final latestSemver = latestParts[0].split('.').map((e) => int.tryParse(e) ?? 0).toList();
  final latestBuild = latestParts.length > 1 ? (int.tryParse(latestParts[1]) ?? 0) : 0;

  final currentParts = currentVerStr.trim().split('+');
  final currentSemver = currentParts[0].split('.').map((e) => int.tryParse(e) ?? 0).toList();
  final currentBuild = currentParts.length > 1
      ? (int.tryParse(currentParts[1]) ?? 0)
      : (int.tryParse(currentBuildStr.trim()) ?? 0);

  final maxLength = latestSemver.length > currentSemver.length ? latestSemver.length : currentSemver.length;
  for (int i = 0; i < maxLength; i++) {
    final l = i < latestSemver.length ? latestSemver[i] : 0;
    final c = i < currentSemver.length ? currentSemver[i] : 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return latestBuild > currentBuild;
}

final appUpdateProvider = FutureProvider<AppUpdateInfo?>((ref) async {
  try {
    // Get currently installed version
    final packageInfo = await PackageInfo.fromPlatform();
    final String currentVersion = packageInfo.version;
    final String currentBuildNumber = packageInfo.buildNumber;

    // Fetch latest version from Firestore
    final docSnapshot = await FirebaseFirestore.instance
        .collection('settings')
        .doc('app_config')
        .get();

    if (!docSnapshot.exists) return null;

    final data = docSnapshot.data()!;
    final String latestVersion = data['latestVersion'] ?? '1.0.0';
    final bool forceUpdate = data['forceUpdate'] ?? false;
    final String downloadUrl =
        data['downloadUrl'] ??
        'https://github.com/hilme119/exam-yemen-app/releases/latest';
    final String? releaseNotes = data['releaseNotes'];

    final bool isUpdateAvailable = _isNewerVersion(
      latestVersion,
      currentVersion,
      currentBuildNumber,
    );

    if (isUpdateAvailable) {
      return AppUpdateInfo(
        updateAvailable: true,
        forceUpdate: forceUpdate,
        latestVersion: latestVersion,
        downloadUrl: downloadUrl,
        releaseNotes: releaseNotes,
      );
    }

    return AppUpdateInfo(
      updateAvailable: false,
      forceUpdate: false,
      latestVersion: latestVersion,
      downloadUrl: downloadUrl,
      releaseNotes: releaseNotes,
    );
  } catch (e) {
    // If it fails (e.g., no internet), we fail gracefully
    return null;
  }
});

