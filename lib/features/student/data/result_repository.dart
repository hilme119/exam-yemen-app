import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../domain/models/result_model.dart';

final resultRepositoryProvider = Provider<ResultRepository>((ref) {
  return ResultRepository(FirebaseFirestore.instance);
});

class ResultRepository {
  final FirebaseFirestore _firestore;

  ResultRepository(this._firestore);

  Future<void> saveResult(ResultModel result) async {
    await _firestore.collection('results').doc(result.id).set(result.toJson());
  }

  Stream<List<ResultModel>> getUserResults(String userId) {
    return _firestore
        .collection('results')
        .where('userId', isEqualTo: userId)
        .orderBy('dateTaken', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => ResultModel.fromJson(doc.data()))
              .toList();
        });
  }
}
