import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/subject_model.dart';

final subjectsProvider = FutureProvider<List<SubjectModel>>((ref) async {
  final snapshot = await FirebaseFirestore.instance.collection('subjects').get();
  return snapshot.docs.map((doc) {
    final data = doc.data();
    data['id'] = doc.id;
    return SubjectModel.fromJson(data);
  }).toList();
});

