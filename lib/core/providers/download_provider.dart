import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../utils/download_helper.dart';

class DownloadState {
  final bool isDownloading;
  final double progress;
  final CancelToken? cancelToken;
  final String? error;

  DownloadState({
    this.isDownloading = false,
    this.progress = 0.0,
    this.cancelToken,
    this.error,
  });

  DownloadState copyWith({
    bool? isDownloading,
    double? progress,
    CancelToken? cancelToken,
    String? error,
    bool clearError = false,
  }) {
    return DownloadState(
      isDownloading: isDownloading ?? this.isDownloading,
      progress: progress ?? this.progress,
      cancelToken: cancelToken ?? this.cancelToken,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class DownloadNotifier extends Notifier<Map<String, DownloadState>> {
  @override
  Map<String, DownloadState> build() {
    return {};
  }

  void startDownload(
    String id,
    String url,
    String fileName,
    Function() onComplete,
    Function(String) onError,
  ) async {
    final cancelToken = CancelToken();
    state = {
      ...state,
      id: DownloadState(
        isDownloading: true,
        progress: 0.0,
        cancelToken: cancelToken,
      ),
    };

    try {
      await DownloadHelper.downloadFileWithToken(url, fileName, cancelToken, (
        received,
        total,
      ) {
        if (total != -1) {
          state = {
            ...state,
            id: state[id]!.copyWith(progress: received / total),
          };
        }
      });
      // Success
      state = {
        ...state,
        id: DownloadState(isDownloading: false, progress: 1.0),
      };
      onComplete();

      // Auto clear state after a delay to clean up
      Future.delayed(const Duration(seconds: 2), () {
        clearState(id);
      });
    } catch (e) {
      if (e.toString().contains('Cancel')) {
        state = {
          ...state,
          id: DownloadState(
            isDownloading: false,
            progress: 0.0,
            error: 'تم إيقاف التحميل',
          ),
        };
        onError('تم إيقاف التحميل');
      } else {
        state = {
          ...state,
          id: DownloadState(
            isDownloading: false,
            progress: 0.0,
            error: 'حدث خطأ في التحميل',
          ),
        };
        onError('حدث خطأ في التحميل');
      }

      // Auto clear state after a delay to clean up
      Future.delayed(const Duration(seconds: 3), () {
        clearState(id);
      });
    }
  }

  void cancelDownload(String id) {
    if (state.containsKey(id) && state[id]!.isDownloading) {
      state[id]!.cancelToken?.cancel();
    }
  }

  void clearState(String id) {
    if (state.containsKey(id)) {
      final newState = Map<String, DownloadState>.from(state);
      newState.remove(id);
      state = newState;
    }
  }
}

final downloadProvider =
    NotifierProvider<DownloadNotifier, Map<String, DownloadState>>(() {
      return DownloadNotifier();
    });
