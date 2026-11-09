import 'package:cloud_firestore/cloud_firestore.dart';

class AiReportModel {
  final String id;
  final String studentId;
  final String studentName;
  final String questionText;
  final String aiResponse;
  final String studentComment;
  final bool isRead;
  final DateTime createdAt;

  AiReportModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.questionText,
    required this.aiResponse,
    required this.studentComment,
    this.isRead = false,
    required this.createdAt,
  });

  factory AiReportModel.fromJson(Map<String, dynamic> json, String id) {
    return AiReportModel(
      id: id,
      studentId: json['studentId'] as String? ?? '',
      studentName: json['studentName'] as String? ?? 'طالب',
      questionText: json['questionText'] as String? ?? '',
      aiResponse: json['aiResponse'] as String? ?? '',
      studentComment: json['studentComment'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'questionText': questionText,
      'aiResponse': aiResponse,
      'studentComment': studentComment,
      'isRead': isRead,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}
