import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../domain/models/result_model.dart';
import '../../../../domain/models/student_grade_level.dart';

final leaderboardProvider =
    FutureProvider.family<List<Map<String, dynamic>>, StudentGradeLevel>((
      ref,
      gradeLevel,
    ) async {
      try {
        // 1. Fetch all regular users (ignore admins/guests if any logic applies)
        final usersQuery = await FirebaseFirestore.instance
            .collection('users')
            .where(
              'role',
              isEqualTo: 'student',
            ) // Or fetch all and filter locally
            .get();

        if (usersQuery.docs.isEmpty) return [];

        final Map<String, Map<String, dynamic>> validUsers = {};
        for (var doc in usersQuery.docs) {
          final data = doc.data();
          final uid = data['id'];
          if (uid != null) {
            validUsers[uid] = data;
          }
        }

        // 2. Fetch all results matching this specific grade level
        // We only want points from exams that belong to this grade.
        final resultsQuery = await FirebaseFirestore.instance
            .collection('results')
            .where('studentGrade', isEqualTo: gradeLevel.name)
            .get();

        // 3. Keep track of the highest score per exam for each user to prevent farming
        // and correctly include all users regardless of isFirstAttempt flag.
        final Map<String, Map<String, int>> userBestScores = {};
        for (var doc in resultsQuery.docs) {
          final data = doc.data();
          final r = ResultModel.fromJson(data);

          // IMPORTANT: Skip competition results to separate leaderboards exactly.
          if (r.earnedPoints != null) continue;

          if (validUsers.containsKey(r.userId)) {
            userBestScores.putIfAbsent(r.userId, () => {});
            final currentMax = userBestScores[r.userId]![r.examId] ?? 0;
            if (r.score > currentMax) {
              userBestScores[r.userId]![r.examId] = r.score;
            }
          }
        }

        final Map<String, int> userScores = {};
        userBestScores.forEach((userId, examMaxes) {
          int total = 0;
          examMaxes.forEach((_, score) => total += score);
          userScores[userId] = total;
        });

        if (userScores.isEmpty) return [];

        // 4. Build leaderboard array
        final List<Map<String, dynamic>> leaderboard = [];
        userScores.forEach((uid, score) {
          final userData = validUsers[uid]!;
          leaderboard.add({
            'userId': uid,
            'name': userData['name'] ?? 'طالب',
            'profilePictureUrl': userData['profilePictureUrl'],
            'totalScore': score,
          });
        });

        leaderboard.sort(
          (a, b) => (b['totalScore'] as int).compareTo(a['totalScore'] as int),
        );

        return leaderboard;
      } catch (e) {
        throw Exception('Failed to load leaderboard: $e');
      }
    });
