import 'package:cloud_firestore/cloud_firestore.dart';

class ResultModel {
  final String id;
  final String userId;
  final String examId;
  final String? subjectName;
  final String? examName;
  final int score;
  final int totalQuestions;
  final DateTime dateTaken;
  final Map<String, int> selectedAnswers;
  final bool isFirstAttempt;
  final String? studentGrade;
  final int? earnedPoints; // Added for competitions
  final int? durationSeconds;

  double get percentage =>
      totalQuestions > 0 ? (score / totalQuestions) * 100 : 0.0;

  ResultModel({
    required this.id,
    required this.userId,
    required this.examId,
    this.subjectName,
    this.examName,
    required this.score,
    required this.totalQuestions,
    required this.dateTaken,
    required this.selectedAnswers,
    this.isFirstAttempt = false,
    this.studentGrade,
    this.earnedPoints,
    this.durationSeconds,
  });

  factory ResultModel.fromJson(Map<String, dynamic> json) {
    return ResultModel(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      examId: json['examId'] as String? ?? '',
      subjectName: json['subjectName'] as String?,
      examName: json['examName'] as String?,
      score: json['score'] as int? ?? 0,
      totalQuestions: json['totalQuestions'] as int? ?? 0,
      dateTaken: json['dateTaken'] != null
          ? (json['dateTaken'] as Timestamp).toDate()
          : DateTime.now(),
      selectedAnswers: json['selectedAnswers'] != null
          ? Map<String, int>.from(json['selectedAnswers'] as Map)
          : {},
      isFirstAttempt: json['isFirstAttempt'] as bool? ?? false,
      studentGrade: json['studentGrade'] as String?,
      earnedPoints: json['earnedPoints'] as int?,
      durationSeconds: json['durationSeconds'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'examId': examId,
      if (subjectName != null) 'subjectName': subjectName,
      if (examName != null) 'examName': examName,
      'score': score,
      'totalQuestions': totalQuestions,
      'dateTaken': Timestamp.fromDate(dateTaken),
      'selectedAnswers': selectedAnswers,
      'isFirstAttempt': isFirstAttempt,
      if (studentGrade != null) 'studentGrade': studentGrade,
      if (earnedPoints != null) 'earnedPoints': earnedPoints,
      if (durationSeconds != null) 'durationSeconds': durationSeconds,
    };
  }
}
