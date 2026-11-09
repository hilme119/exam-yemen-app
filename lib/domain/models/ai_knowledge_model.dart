import 'package:cloud_firestore/cloud_firestore.dart';

/// Model for a single lesson inside a subject's AI knowledge base
class AiLesson {
  final String title;
  final String content;
  final String? chapter;

  AiLesson({required this.title, required this.content, this.chapter});

  factory AiLesson.fromJson(Map<String, dynamic> json) {
    return AiLesson(
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      chapter: json['chapter'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'content': content,
      if (chapter != null) 'chapter': chapter,
    };
  }
}

/// Full AI knowledge content for a single subject
class AiKnowledgeModel {
  final String subjectId;
  final String subjectName;
  final String generalContent; // General notes/summaries for the subject
  final List<AiLesson> lessons;
  final Timestamp? updatedAt;

  AiKnowledgeModel({
    required this.subjectId,
    required this.subjectName,
    this.generalContent = '',
    this.lessons = const [],
    this.updatedAt,
  });

  factory AiKnowledgeModel.fromJson(
    Map<String, dynamic> json,
    String docId,
  ) {
    return AiKnowledgeModel(
      subjectId: docId,
      subjectName: json['subjectName'] as String? ?? '',
      generalContent: json['generalContent'] as String? ?? '',
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map(
                (e) => AiLesson.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      updatedAt: json['updatedAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'subjectName': subjectName,
      'generalContent': generalContent,
      'lessons': lessons.map((l) => l.toJson()).toList(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
  }

  /// Build a formatted context string for AI prompts
  String buildContext() {
    final sb = StringBuffer();
    sb.writeln('=== مادة: $subjectName ===');
    if (generalContent.isNotEmpty) {
      sb.writeln('\n--- ملخص عام ---');
      sb.writeln(generalContent);
    }
    for (final lesson in lessons) {
      sb.writeln('\n--- درس: ${lesson.title} ---');
      if (lesson.chapter != null && lesson.chapter!.isNotEmpty) {
        sb.writeln('الفصل: ${lesson.chapter}');
      }
      sb.writeln(lesson.content);
    }
    return sb.toString();
  }
}
