abstract class BaseExam {
  String get id;
  String get subjectId;
  String get title;
}

class ExamModel implements BaseExam {
  @override
  final String id;
  @override
  final String subjectId;
  @override
  final String title;
  final String academicYear;
  final bool isPdf;
  final String? pdfUrl;
  final String? subjectName;
  final String? gradeName;
  final int? questionsCount;

  ExamModel({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.academicYear,
    this.isPdf = false,
    this.pdfUrl,
    this.subjectName,
    this.gradeName,
    this.questionsCount,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    return ExamModel(
      id: json['id'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      academicYear: json['academicYear'] as String? ?? '',
      isPdf: json['isPdf'] as bool? ?? false,
      pdfUrl: json['pdfUrl'] as String?,
      subjectName: json['subjectName'] as String?,
      gradeName: json['gradeName'] as String?,
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
      'academicYear': academicYear,
      'isPdf': isPdf,
      if (pdfUrl != null) 'pdfUrl': pdfUrl,
      if (subjectName != null) 'subjectName': subjectName,
      if (gradeName != null) 'gradeName': gradeName,
      if (questionsCount != null) 'questionsCount': questionsCount,
    };
  }
}
