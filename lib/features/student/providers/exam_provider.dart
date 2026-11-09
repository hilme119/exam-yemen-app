import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/exam_model.dart';
import '../../../domain/models/question_model.dart';

final allExamsProvider = StreamProvider<List<ExamModel>>((ref) {
  return FirebaseFirestore.instance
      .collection('exams')
      .snapshots()
      .map((snapshot) {
    return snapshot.docs
        .map((doc) => ExamModel.fromJson(doc.data()..['id'] = doc.id))
        .toList();
  });
});

final examsProvider = StreamProvider.family<List<ExamModel>, String>((ref, subjectId) {
  return FirebaseFirestore.instance
      .collection('exams')
      .snapshots()
      .map((snapshot) {
    return snapshot.docs
        .map((doc) => ExamModel.fromJson(doc.data()..['id'] = doc.id))
        .where((e) => subjectId.isEmpty || e.subjectId == subjectId)
        .toList();
  });
});

final examsBySubjectProvider = examsProvider;

final examByIdProvider = Provider.family<ExamModel?, String>((ref, examId) {
  final exams = ref.watch(allExamsProvider).value ?? [];
  try {
    return exams.firstWhere((e) => e.id == examId);
  } catch (_) {
    return null;
  }
});

List<QuestionModel> _sortQuestions(List<QuestionModel> list) {
  final copy = [...list];
  copy.sort((a, b) {
    final numA = int.tryParse(a.id.replaceAll(RegExp(r'\D'), '')) ?? 0;
    final numB = int.tryParse(b.id.replaceAll(RegExp(r'\D'), '')) ?? 0;
    if (numA != 0 && numB != 0) {
      return numA.compareTo(numB);
    }
    return a.id.compareTo(b.id);
  });
  return copy;
}

final questionsProvider = FutureProvider.family<List<QuestionModel>, String>((ref, examId) async {
  final snapshot = await FirebaseFirestore.instance
      .collection('exams')
      .doc(examId)
      .collection('questions')
      .get();
  if (snapshot.docs.isNotEmpty) {
    final list = snapshot.docs.map((doc) {
      final data = doc.data();
      data['id'] = doc.id;
      return QuestionModel.fromJson(data);
    }).toList();
    return _sortQuestions(list);
  }

  final admissionSnap = await FirebaseFirestore.instance
      .collection('admission_exams')
      .doc(examId)
      .collection('questions')
      .get();
  if (admissionSnap.docs.isNotEmpty) {
    final list = admissionSnap.docs.map((doc) {
      final data = doc.data();
      data['id'] = doc.id;
      return QuestionModel.fromJson(data);
    }).toList();
    return _sortQuestions(list);
  }

  final compSnap = await FirebaseFirestore.instance
      .collection('competition_exams')
      .doc(examId)
      .collection('questions')
      .get();
  final list = compSnap.docs.map((doc) {
    final data = doc.data();
    data['id'] = doc.id;
    return QuestionModel.fromJson(data);
  }).toList();
  return _sortQuestions(list);
});
