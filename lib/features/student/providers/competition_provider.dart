import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/competition_models.dart';

final competitionSemestersProvider = FutureProvider<List<CompetitionSemesterModel>>((ref) async {
  final snap = await FirebaseFirestore.instance.collection('competition_semesters').get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return CompetitionSemesterModel.fromJson(data);
  }).toList();
});

final competitionSubjectsProvider = FutureProvider.family<List<CompetitionSubjectModel>, String>((ref, semesterId) async {
  final snap = await FirebaseFirestore.instance
      .collection('competition_subjects')
      .where('semesterId', isEqualTo: semesterId)
      .get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return CompetitionSubjectModel.fromJson(data);
  }).toList();
});

final competitionExamsProvider = FutureProvider.family<List<CompetitionExamModel>, String>((ref, subjectId) async {
  final snap = await FirebaseFirestore.instance
      .collection('competition_exams')
      .where('subjectId', isEqualTo: subjectId)
      .get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return CompetitionExamModel.fromJson(data);
  }).toList();
});

