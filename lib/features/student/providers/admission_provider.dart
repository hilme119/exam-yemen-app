import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/admission_models.dart';

final universitiesProvider = FutureProvider<List<UniversityModel>>((ref) async {
  final snap = await FirebaseFirestore.instance.collection('universities').get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return UniversityModel.fromJson(data);
  }).toList();
});

final majorsProvider = FutureProvider.family<List<MajorModel>, String>((ref, universityId) async {
  final snap = await FirebaseFirestore.instance
      .collection('majors')
      .where('universityId', isEqualTo: universityId)
      .get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return MajorModel.fromJson(data);
  }).toList();
});

final admissionSubjectsProvider = FutureProvider.family<List<AdmissionSubjectModel>, String>((ref, majorId) async {
  final snap = await FirebaseFirestore.instance
      .collection('admission_subjects')
      .where('majorId', isEqualTo: majorId)
      .get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return AdmissionSubjectModel.fromJson(data);
  }).toList();
});

final admissionExamsProvider = FutureProvider.family<List<AdmissionExamModel>, String>((ref, subjectId) async {
  final snap = await FirebaseFirestore.instance
      .collection('admission_exams')
      .where('subjectId', isEqualTo: subjectId)
      .get();
  return snap.docs.map((d) {
    final data = d.data();
    data['id'] = d.id;
    return AdmissionExamModel.fromJson(data);
  }).toList();
});

