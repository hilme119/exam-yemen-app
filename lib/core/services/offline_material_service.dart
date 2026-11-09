import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../constants/app_constants.dart';
import '../../domain/models/learning_material_model.dart';

final offlineMaterialServiceProvider = Provider<OfflineMaterialService>((ref) {
  return OfflineMaterialService();
});

class OfflineMaterialService {
  final Box _materialBox = Hive.box(AppConstants.materialBox);

  Future<void> saveMaterial(LearningMaterialModel material) async {
    final materialsData = _materialBox.get(
      'materialsList',
      defaultValue: <String>[],
    );
    List<String> materialsList = List<String>.from(materialsData);

    final map = material.toJson();
    map['id'] = material.id;
    map['createdAt'] = material.createdAt.millisecondsSinceEpoch;

    final materialJson = jsonEncode(map);
    bool exists = false;
    for (int i = 0; i < materialsList.length; i++) {
      final decodedMap = jsonDecode(materialsList[i]);
      if (decodedMap['id'] == material.id) {
        materialsList[i] = materialJson;
        exists = true;
        break;
      }
    }
    if (!exists) {
      materialsList.add(materialJson);
    }

    await _materialBox.put('materialsList', materialsList);
  }

  List<LearningMaterialModel> getDownloadedMaterials() {
    final materialsData = _materialBox.get(
      'materialsList',
      defaultValue: <String>[],
    );
    List<String> materialsList = List<String>.from(materialsData);

    return materialsList.map((str) {
      final map = jsonDecode(str);
      if (map['createdAt'] is int) {
        map['createdAt'] = Timestamp.fromMillisecondsSinceEpoch(
          map['createdAt'],
        );
      }
      return LearningMaterialModel.fromJson(map, map['id'] ?? '');
    }).toList();
  }

  Future<void> removeDownloadedMaterial(String materialId) async {
    final materialsData = _materialBox.get(
      'materialsList',
      defaultValue: <String>[],
    );
    List<String> materialsList = List<String>.from(materialsData);

    materialsList.removeWhere((str) {
      final map = jsonDecode(str);
      return map['id'] == materialId;
    });

    await _materialBox.put('materialsList', materialsList);
  }

  bool isMaterialDownloaded(String materialId) {
    final materialsData = _materialBox.get(
      'materialsList',
      defaultValue: <String>[],
    );
    List<String> materialsList = List<String>.from(materialsData);
    for (var str in materialsList) {
      final map = jsonDecode(str);
      if (map['id'] == materialId) return true;
    }
    return false;
  }
}
