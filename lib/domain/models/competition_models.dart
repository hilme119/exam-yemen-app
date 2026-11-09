import 'exam_model.dart';

class CompetitionSemesterModel {
  final String id;
  final String name;
  final DateTime? createdAt;

  CompetitionSemesterModel({
    required this.id,
    required this.name,
    this.createdAt,
  });

  factory CompetitionSemesterModel.fromJson(Map<String, dynamic> json) {
    return CompetitionSemesterModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }
}

class CompetitionSubjectModel {
  final String id;
  final String semesterId;
  final String name;
  final String? imageUrl;
  final DateTime? createdAt;

  CompetitionSubjectModel({
    required this.id,
    required this.semesterId,
    required this.name,
    this.imageUrl,
    this.createdAt,
  });

  factory CompetitionSubjectModel.fromJson(Map<String, dynamic> json) {
    return CompetitionSubjectModel(
      id: json['id'] as String? ?? '',
      semesterId: json['semesterId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'semesterId': semesterId,
      'name': name,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }
}

class CompetitionExamModel implements BaseExam {
  @override
  final String id;
  @override
  final String subjectId;
  @override
  final String title;
  final int? timerMinutes;
  final int? rewardPoints;
  final int? questionsCount;

  CompetitionExamModel({
    required this.id,
    required this.subjectId,
    required this.title,
    this.timerMinutes,
    this.rewardPoints,
    this.questionsCount,
  });

  factory CompetitionExamModel.fromJson(Map<String, dynamic> json) {
    return CompetitionExamModel(
      id: json['id'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      timerMinutes: json['timerMinutes'] != null
          ? int.tryParse(json['timerMinutes'].toString())
          : null,
      rewardPoints: json['rewardPoints'] != null
          ? int.tryParse(json['rewardPoints'].toString())
          : null,
      questionsCount: json['questionsCount'] != null
          ? int.tryParse(json['questionsCount'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'subjectId': subjectId,
      'title': title,
      if (timerMinutes != null) 'timerMinutes': timerMinutes,
      if (rewardPoints != null) 'rewardPoints': rewardPoints,
      if (questionsCount != null) 'questionsCount': questionsCount,
    };
  }
}
