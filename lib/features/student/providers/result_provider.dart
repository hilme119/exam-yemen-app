import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/result_model.dart';
import '../data/result_repository.dart';
import '../../auth/providers/auth_provider.dart';

final userResultsProvider = StreamProvider.autoDispose<List<ResultModel>>((
  ref,
) {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return Stream.value([]);

  return ref.watch(resultRepositoryProvider).getUserResults(user.id);
});

class ResultNotifier extends AsyncNotifier<void> {
  late ResultRepository _repository;

  @override
  FutureOr<void> build() {
    _repository = ref.watch(resultRepositoryProvider);
  }

  Future<void> saveResult(ResultModel result) async {
    state = const AsyncLoading();
    try {
      await _repository.saveResult(result);
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final resultNotifierProvider = AsyncNotifierProvider<ResultNotifier, void>(
  ResultNotifier.new,
);
