import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../domain/models/competition_models.dart';

final allCompetitionSemestersProvider = FutureProvider<List<CompetitionSemesterModel>>((ref) async {
  try {
    final snapshot = await FirebaseFirestore.instance.collection('competition_semesters').get();
    return snapshot.docs.map((doc) => CompetitionSemesterModel.fromJson(doc.data()..['id'] = doc.id)).toList();
  } catch (e) {
    throw Exception('Failed to load competition semesters: $e');
  }
});

final competitionLeaderboardProvider =
    FutureProvider.family<List<Map<String, dynamic>>, CompetitionSemesterModel>((ref, semester) async {
      try {
        final usersQuery = await FirebaseFirestore.instance
            .collection('users')
            .where('role', isEqualTo: 'student')
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

        final resultsQuery = await FirebaseFirestore.instance
            .collection('results')
            .where('studentGrade', isEqualTo: semester.name)
            .get();

        // Track best score per user per exam
        // examId -> {examName: String, subjectName: String, latestDateTaken: DateTime, results: userId -> {score, duration, earnedPoints} }
        final Map<String, Map<String, dynamic>> groupedByExam = {};

        for (var doc in resultsQuery.docs) {
          final data = doc.data();
          final String? userId = data['userId'];
          final String? examId = data['examId'];
          final String examName = data['examName'] ?? 'اختبار غير معروف';
          final String subjectName = data['subjectName'] ?? 'مادة غير معروفة';
          final int? earnedPoints = data['earnedPoints'];
          final int score = data['score'] ?? 0;
          final int duration = data['durationSeconds'] ?? 999999;
          
          final Timestamp? stamp = data['dateTaken'];
          final DateTime dateTaken = stamp != null ? stamp.toDate() : DateTime.fromMillisecondsSinceEpoch(0);
          
          // only consider results that have earnedPoints (signifying they are competition results)
          if (userId != null && examId != null && earnedPoints != null && validUsers.containsKey(userId)) {
            groupedByExam.putIfAbsent(examId, () => {
              'examName': examName,
              'subjectName': subjectName,
              'latestDateTaken': dateTaken,
              'results': <String, Map<String, dynamic>>{}, // userId -> best result Map
            });
            
            final examMap = groupedByExam[examId]!;
            final currentLatest = examMap['latestDateTaken'] as DateTime;
            if (dateTaken.isAfter(currentLatest)) {
              examMap['latestDateTaken'] = dateTaken;
            }
            
            final examResults = examMap['results'] as Map<String, Map<String, dynamic>>;
            
            if (!examResults.containsKey(userId)) {
               examResults[userId] = {'score': score, 'duration': duration, 'earnedPoints': earnedPoints};
            } else {
               final existing = examResults[userId]!;
               // Rank by earned points primarily, then duration
               if (earnedPoints > (existing['earnedPoints'] as int)) {
                 examResults[userId] = {'score': score, 'duration': duration, 'earnedPoints': earnedPoints};
               } else if (earnedPoints == (existing['earnedPoints'] as int) && duration < (existing['duration'] as int)) {
                 examResults[userId] = {'score': score, 'duration': duration, 'earnedPoints': earnedPoints};
               }
            }
          }
        }
        
        // --- Retroactively resolve missing subject names ---
        for (final eId in groupedByExam.keys) {
          final eMap = groupedByExam[eId]!;
          if (eMap['subjectName'] == 'مادة غير معروفة' || eMap['subjectName'] == null) {
            try {
              // Try standard exams first
              var examDoc = await FirebaseFirestore.instance.collection('exams').doc(eId).get();
              String? subjId;
              bool examExists = false;
              
              if (examDoc.exists) {
                subjId = examDoc.data()?['subjectId'];
                examExists = true;
              } else {
                // If not found, try competition_exams
                examDoc = await FirebaseFirestore.instance.collection('competition_exams').doc(eId).get();
                if (examDoc.exists) {
                  subjId = examDoc.data()?['subjectId'];
                  subjId ??= examDoc.data()?['competitionSubjectId'];
                  examExists = true;
                }
              }
              
              if (!examExists) {
                 eMap['deleted'] = true;
                 continue; // skip trying to resolve subject
              }
              
              if (subjId != null) {
                // Try standard subjects first
                var subjDoc = await FirebaseFirestore.instance.collection('subjects').doc(subjId).get();
                if (subjDoc.exists) {
                  final String? actualName = subjDoc.data()?['name'];
                  if (actualName != null && actualName.isNotEmpty) {
                    eMap['subjectName'] = actualName;
                  }
                } else {
                  // Try competition_subjects
                  subjDoc = await FirebaseFirestore.instance.collection('competition_subjects').doc(subjId).get();
                  if (subjDoc.exists) {
                     final String? actualName = subjDoc.data()?['name'];
                     if (actualName != null && actualName.isNotEmpty) {
                       eMap['subjectName'] = actualName;
                     }
                  }
                }
              }
            } catch (_) {}
          }
        }

        if (groupedByExam.isEmpty) return [];

        final List<Map<String, dynamic>> finalLeaderboards = [];
        
        groupedByExam.forEach((examId, examData) {
          if (examData['deleted'] == true) return; // Hide ghost exams completely
          
          final resultsMap = examData['results'] as Map<String, Map<String, dynamic>>;
          final List<Map<String, dynamic>> winners = [];
          
          resultsMap.forEach((uid, res) {
            final userData = validUsers[uid]!;
            winners.add({
              'userId': uid,
              'name': userData['name'] ?? 'طالب',
              'profilePictureUrl': userData['profilePictureUrl'],
              'totalScore': res['score'],
              'earnedPoints': res['earnedPoints'],
              'durationSeconds': res['duration'],
            });
          });

          // Sort winners: Highest earnedPoints first, then lowest duration
          winners.sort((a, b) {
            final expComp = (b['earnedPoints'] as int).compareTo(a['earnedPoints'] as int);
            if (expComp != 0) return expComp;
            
            final durA = a['durationSeconds'] as int;
            final durB = b['durationSeconds'] as int;
            return durA.compareTo(durB);
          });
          
          finalLeaderboards.add({
            'examId': examId,
            'examName': examData['examName'],
            'subjectName': examData['subjectName'],
            'latestDateTaken': examData['latestDateTaken'],
            'winners': winners,
          });
        });

        // Sort leaderboards: Newest competition first
        finalLeaderboards.sort((a, b) {
          final dateA = a['latestDateTaken'] as DateTime;
          final dateB = b['latestDateTaken'] as DateTime;
          return dateB.compareTo(dateA); 
        });

        return finalLeaderboards;
      } catch (e) {
        throw Exception('Failed to load competition leaderboard: $e');
      }
    });
