import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../constants/app_constants.dart';
import '../../domain/models/exam_model.dart';
import '../../domain/models/question_model.dart';

final offlineExamServiceProvider = Provider<OfflineExamService>((ref) {
  return OfflineExamService();
});

class OfflineExamService {
  Box get _examBox => Hive.box(AppConstants.examBox);

  // Key formats:
  // examsList -> List of ExamModel json strings
  // exam_questions_${examId} -> List of QuestionModel json strings

  Future<void> downloadExam(
    ExamModel exam,
    List<QuestionModel> questions,
  ) async {
    try {
      final examsData = _examBox.get('examsList', defaultValue: <String>[]);
      List<String> examsList = [];
      if (examsData is Iterable) {
        for (var item in examsData) {
          if (item is String) examsList.add(item);
        }
      }

      final examJson = jsonEncode(exam.toJson());
      bool exists = false;
      for (int i = 0; i < examsList.length; i++) {
        try {
          final existingExam = ExamModel.fromJson(jsonDecode(examsList[i]));
          if (existingExam.id == exam.id) {
            examsList[i] = examJson;
            exists = true;
            break;
          }
        } catch (_) {}
      }
      if (!exists) {
        examsList.add(examJson);
      }

      await _examBox.put('examsList', examsList);

      final questionsList = questions.map((q) => jsonEncode(q.toJson())).toList();
      await _examBox.put('exam_questions_${exam.id}', questionsList);
    } catch (e) {
      // safe fallback
    }
  }

  List<ExamModel> getDownloadedExams() {
    try {
      final examsData = _examBox.get('examsList', defaultValue: <String>[]);
      if (examsData is! Iterable) return [];
      final List<ExamModel> list = [];
      for (var str in examsData) {
        if (str is String) {
          try {
            list.add(ExamModel.fromJson(jsonDecode(str)));
          } catch (_) {}
        }
      }
      return list;
    } catch (_) {
      return [];
    }
  }

  List<QuestionModel> getExamQuestions(String examId) {
    try {
      final questionsData = _examBox.get(
        'exam_questions_$examId',
        defaultValue: <String>[],
      );
      if (questionsData is! Iterable) return [];
      final List<QuestionModel> list = [];
      for (var str in questionsData) {
        if (str is String) {
          try {
            list.add(QuestionModel.fromJson(jsonDecode(str)));
          } catch (_) {}
        }
      }
      return list;
    } catch (_) {
      return [];
    }
  }

  Future<void> removeDownloadedExam(String examId) async {
    try {
      final examsData = _examBox.get('examsList', defaultValue: <String>[]);
      if (examsData is! Iterable) return;
      List<String> examsList = [];
      for (var str in examsData) {
        if (str is String) {
          try {
            final exam = ExamModel.fromJson(jsonDecode(str));
            if (exam.id != examId) examsList.add(str);
          } catch (_) {}
        }
      }
      await _examBox.put('examsList', examsList);
      await _examBox.delete('exam_questions_$examId');
    } catch (_) {}
  }

  bool isExamDownloaded(String examId) {
    try {
      final examsData = _examBox.get('examsList', defaultValue: <String>[]);
      if (examsData is! Iterable) return false;
      for (var str in examsData) {
        if (str is String) {
          try {
            final exam = ExamModel.fromJson(jsonDecode(str));
            if (exam.id == examId) return true;
          } catch (_) {}
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
