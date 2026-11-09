import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../domain/models/learning_material_model.dart';

final learningMaterialsProvider =
    FutureProvider.family<List<LearningMaterialModel>, String>((
      ref,
      subjectId,
    ) async {
      final snapshot = await FirebaseFirestore.instance
          .collection('learning_materials')
          .where('subjectId', isEqualTo: subjectId)
          .get();

      return snapshot.docs
          .map((doc) => LearningMaterialModel.fromJson(doc.data(), doc.id))
          .toList();
    });
