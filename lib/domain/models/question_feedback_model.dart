import 'package:cloud_firestore/cloud_firestore.dart';

class QuestionFeedbackModel {
  final String id;
  final String userId;
  final String userName;
  final String examId;
  final String examName;
  final String gradeName;
  final String subjectName;
  final String questionId;
  final int questionNumber;
  final String questionText;
  final String note;
  final String? imageUrl;
  final String? audioUrl;
  final String? adminReply;
  final String? adminReplyImageUrl;
  final String? adminReplyAudioUrl;
  final DateTime createdAt;
  final bool isReadByAdmin;
  final bool isReadByStudent;
  final bool isStarred;

  QuestionFeedbackModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.examId,
    required this.examName,
    required this.gradeName,
    required this.subjectName,
    required this.questionId,
    required this.questionNumber,
    required this.questionText,
    required this.note,
    this.imageUrl,
    this.audioUrl,
    this.adminReply,
    this.adminReplyImageUrl,
    this.adminReplyAudioUrl,
    required this.createdAt,
    this.isReadByAdmin = false,
    this.isReadByStudent = false,
    this.isStarred = false,
  });

  factory QuestionFeedbackModel.fromJson(Map<String, dynamic> json) {
    return QuestionFeedbackModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? 'طالب',
      examId: json['examId'] ?? '',
      examName: json['examName'] ?? '',
      gradeName: json['gradeName'] ?? 'غير محدد',
      subjectName: json['subjectName'] ?? 'مادة مجهولة',
      questionId: json['questionId'] ?? '',
      questionNumber: json['questionNumber'] ?? 0,
      questionText: json['questionText'] ?? '',
      note: json['note'] ?? '',
      imageUrl: json['imageUrl'] as String?,
      audioUrl: json['audioUrl'] as String?,
      adminReply: json['adminReply'] as String?,
      adminReplyImageUrl: json['adminReplyImageUrl'] as String?,
      adminReplyAudioUrl: json['adminReplyAudioUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] is Timestamp 
              ? (json['createdAt'] as Timestamp).toDate()
              : DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
      isReadByAdmin: json['isReadByAdmin'] ?? false,
      isReadByStudent: json['isReadByStudent'] ?? false,
      isStarred: json['isStarred'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'examId': examId,
      'examName': examName,
      'gradeName': gradeName,
      'subjectName': subjectName,
      'questionId': questionId,
      'questionNumber': questionNumber,
      'questionText': questionText,
      'note': note,
      if (imageUrl != null && imageUrl!.isNotEmpty) 'imageUrl': imageUrl,
      if (audioUrl != null && audioUrl!.isNotEmpty) 'audioUrl': audioUrl,
      if (adminReply != null && adminReply!.isNotEmpty) 'adminReply': adminReply,
      if (adminReplyImageUrl != null && adminReplyImageUrl!.isNotEmpty) 'adminReplyImageUrl': adminReplyImageUrl,
      if (adminReplyAudioUrl != null && adminReplyAudioUrl!.isNotEmpty) 'adminReplyAudioUrl': adminReplyAudioUrl,
      'createdAt': Timestamp.fromDate(createdAt),
      'status': isReadByAdmin ? 'resolved' : 'pending',
      'isReadByAdmin': isReadByAdmin,
      'isReadByStudent': isReadByStudent,
      'isStarred': isStarred,
    };
  }

  QuestionFeedbackModel copyWith({
    String? id,
    String? userId,
    String? userName,
    String? examId,
    String? examName,
    String? gradeName,
    String? subjectName,
    String? questionId,
    int? questionNumber,
    String? questionText,
    String? note,
    String? imageUrl,
    String? audioUrl,
    String? adminReply,
    String? adminReplyImageUrl,
    String? adminReplyAudioUrl,
    DateTime? createdAt,
    bool? isReadByAdmin,
    bool? isReadByStudent,
    bool? isStarred,
  }) {
    return QuestionFeedbackModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      examId: examId ?? this.examId,
      examName: examName ?? this.examName,
      gradeName: gradeName ?? this.gradeName,
      subjectName: subjectName ?? this.subjectName,
      questionId: questionId ?? this.questionId,
      questionNumber: questionNumber ?? this.questionNumber,
      questionText: questionText ?? this.questionText,
      note: note ?? this.note,
      imageUrl: imageUrl ?? this.imageUrl,
      audioUrl: audioUrl ?? this.audioUrl,
      adminReply: adminReply ?? this.adminReply,
      adminReplyImageUrl: adminReplyImageUrl ?? this.adminReplyImageUrl,
      adminReplyAudioUrl: adminReplyAudioUrl ?? this.adminReplyAudioUrl,
      createdAt: createdAt ?? this.createdAt,
      isReadByAdmin: isReadByAdmin ?? this.isReadByAdmin,
      isReadByStudent: isReadByStudent ?? this.isReadByStudent,
      isStarred: isStarred ?? this.isStarred,
    );
  }
}
