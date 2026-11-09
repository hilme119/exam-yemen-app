import 'package:cloud_firestore/cloud_firestore.dart';

enum MaterialType { summary, book, video }

class LearningMaterialModel {
  final String id;
  final String title;
  final String description;
  final MaterialType type;
  final String subjectId;
  final String url; // Firebase storage URL or video stream URL
  final Timestamp createdAt;
  final int views;
  final int downloads;

  LearningMaterialModel({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.subjectId,
    required this.url,
    required this.createdAt,
    this.views = 0,
    this.downloads = 0,
  });

  factory LearningMaterialModel.fromJson(Map<String, dynamic> json, String id) {
    return LearningMaterialModel(
      id: id,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      type: MaterialType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => MaterialType.summary,
      ),
      subjectId: json['subjectId'] as String? ?? '',
      url: json['url'] as String? ?? '',
      createdAt: json['createdAt'] as Timestamp? ?? Timestamp.now(),
      views: json['views'] as int? ?? 0,
      downloads: json['downloads'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'type': type.name,
      'subjectId': subjectId,
      'url': url,
      'createdAt': createdAt,
      'views': views,
      'downloads': downloads,
    };
  }
}
