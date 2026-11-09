class BookmarkModel {
  final String id;
  final String userId;
  final String examId;
  final String questionId;
  final String questionHtml;
  final String subjectName;
  final String examTitle;
  final DateTime timestamp;

  BookmarkModel({
    required this.id,
    required this.userId,
    required this.examId,
    required this.questionId,
    required this.questionHtml,
    required this.subjectName,
    required this.examTitle,
    required this.timestamp,
  });

  factory BookmarkModel.fromJson(Map<String, dynamic> json) {
    return BookmarkModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      examId: json['examId'] as String,
      questionId: json['questionId'] as String,
      questionHtml: json['questionHtml'] as String,
      subjectName: json['subjectName'] as String,
      examTitle: json['examTitle'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'examId': examId,
      'questionId': questionId,
      'questionHtml': questionHtml,
      'subjectName': subjectName,
      'examTitle': examTitle,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
