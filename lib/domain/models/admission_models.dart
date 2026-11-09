import 'exam_model.dart';

class UniversityModel {
  final String id;
  final String name;
  final String? imageUrl;
  final DateTime? createdAt;

  UniversityModel({
    required this.id,
    required this.name,
    this.imageUrl,
    this.createdAt,
  });

  factory UniversityModel.fromJson(Map<String, dynamic> json) {
    return UniversityModel(
      id: json['id'] as String? ?? '',
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
      'name': name,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UniversityModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

class MajorModel {
  final String id;
  final String universityId;
  final String name;
  final DateTime? createdAt;

  MajorModel({
    required this.id,
    required this.universityId,
    required this.name,
    this.createdAt,
  });

  factory MajorModel.fromJson(Map<String, dynamic> json) {
    return MajorModel(
      id: json['id'] as String? ?? '',
      universityId: json['universityId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'universityId': universityId,
      'name': name,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }
}

class AdmissionSubjectModel {
  final String id;
  final String majorId;
  final String name;
  final String? imageUrl;
  final DateTime? createdAt;

  AdmissionSubjectModel({
    required this.id,
    required this.majorId,
    required this.name,
    this.imageUrl,
    this.createdAt,
  });

  factory AdmissionSubjectModel.fromJson(Map<String, dynamic> json) {
    return AdmissionSubjectModel(
      id: json['id'] as String? ?? '',
      majorId: json['majorId'] as String? ?? '',
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
      'majorId': majorId,
      'name': name,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }
}

class AdmissionExamModel implements BaseExam {
  @override
  final String id;
  @override
  final String subjectId;
  @override
  final String title;
  final String? academicYear;
  final bool isPdf;
  final String? pdfUrl;
  final int? questionsCount;

  AdmissionExamModel({
    required this.id,
    required this.subjectId,
    required this.title,
    this.academicYear,
    this.isPdf = false,
    this.pdfUrl,
    this.questionsCount,
  });

  factory AdmissionExamModel.fromJson(Map<String, dynamic> json) {
    return AdmissionExamModel(
      id: json['id'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      academicYear: json['academicYear'] as String?,
      isPdf: json['isPdf'] as bool? ?? false,
      pdfUrl: json['pdfUrl'] as String?,
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
      if (academicYear != null) 'academicYear': academicYear,
      'isPdf': isPdf,
      if (pdfUrl != null) 'pdfUrl': pdfUrl,
      if (questionsCount != null) 'questionsCount': questionsCount,
    };
  }
}
