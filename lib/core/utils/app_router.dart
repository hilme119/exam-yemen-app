import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/student/presentation/onboarding_screen.dart';
import '../../features/student/presentation/main_layout_screen.dart';
import '../../features/student/presentation/subject_selection_screen.dart';
import '../../features/student/presentation/academic_year_selection_screen.dart';
import '../../features/student/presentation/available_exams_screen.dart';
import '../../features/student/presentation/exam_player_screen.dart';
import '../../features/student/presentation/exam_result_screen.dart';
import '../../features/student/presentation/offline_exams_screen.dart';
import '../../features/student/presentation/my_results_screen.dart';
import '../../features/student/presentation/student_feedbacks_screen.dart';
import '../../features/student/presentation/bookmarks_screen.dart';
import '../../features/student/presentation/student_notifications_screen.dart';
import '../../features/student/presentation/student_profile_screen.dart';
import '../../features/student/presentation/exams_dashboard_screen.dart';
import '../../features/student/presentation/materials_dashboard_screen.dart';
import '../../features/student/presentation/materials_list_screen.dart';
import '../../features/student/presentation/video_player_screen.dart';
import '../../features/student/presentation/leaderboard_screen.dart';
import '../../features/student/presentation/contact_admin_screen.dart';
import '../../features/student/presentation/pdf_viewer_screen.dart';
import '../../features/student/presentation/admission_universities_screen.dart';
import '../../features/student/presentation/competitions_semesters_screen.dart';
import '../../features/student/presentation/competitions_subjects_screen.dart';
import '../../features/student/presentation/competitions_exams_screen.dart';
import '../../features/student/presentation/competition_leaderboard_screen.dart';
import '../../features/student/presentation/admission_majors_screen.dart';
import '../../features/student/presentation/admission_subjects_screen.dart';
import '../../features/student/presentation/admission_exams_screen.dart';

import '../../domain/models/subject_model.dart';
import '../../domain/models/exam_model.dart';
import '../../domain/models/question_model.dart';

final appRouter = GoRouter(
  initialLocation: '/onboarding',
  redirect: (context, state) {
    final user = FirebaseAuth.instance.currentUser;
    final isAuthRoute = state.matchedLocation == '/login' ||
        state.matchedLocation == '/register' ||
        state.matchedLocation == '/onboarding';

    if (user != null && isAuthRoute) {
      return '/student_dashboard';
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/student_dashboard',
      builder: (context, state) => const MainLayoutScreen(),
    ),
    GoRoute(
      path: '/student_subject_selection',
      builder: (context, state) {
        final extras = state.extra as Map<String, dynamic>?;
        return SubjectSelectionScreen(
          grade: extras?['grade'] as String?,
          stream: extras?['stream'] as String?,
          isForMaterials: extras?['isForMaterials'] as bool? ?? false,
          isPdf: extras?['isPdf'] as bool? ?? false,
        );
      },
    ),
    GoRoute(
      path: '/student_academic_years',
      builder: (context, state) {
        final extras = state.extra;
        if (extras is Map<String, dynamic>) {
          return AcademicYearSelectionScreen(
            subject: extras['subject'] as SubjectModel,
            isPdf: extras['isPdf'] as bool? ?? false,
          );
        } else {
          return AcademicYearSelectionScreen(
            subject: state.extra as SubjectModel,
          );
        }
      },
    ),
    GoRoute(
      path: '/student_available_exams',
      builder: (context, state) {
        final extraMap = state.extra as Map<String, dynamic>;
        return AvailableExamsScreen(
          subject: extraMap['subject'] as SubjectModel,
          academicYear: (extraMap['academicYear'] as String?) ?? 'الكل',
          isPdf: extraMap['isPdf'] as bool? ?? false,
        );
      },
    ),
    GoRoute(
      path: '/offline_exams',
      builder: (context, state) => const OfflineExamsScreen(),
    ),
    GoRoute(
      path: '/student_exam_player',
      builder: (context, state) {
        if (state.extra is BaseExam) {
          return ExamPlayerScreen(exam: state.extra as BaseExam);
        } else if (state.extra is Map<String, dynamic>) {
          final extras = state.extra as Map<String, dynamic>;
          if (extras.containsKey('exam') && extras['exam'] is BaseExam) {
            return ExamPlayerScreen(
              exam: extras['exam'] as BaseExam,
              inferredGradeName: extras['inferredGradeName'] as String?,
              customQuestions: extras['customQuestions'] as List<QuestionModel>?,
              customTitle: extras['customTitle'] as String?,
            );
          } else if (extras.containsKey('examId')) {
            final examId = extras['examId'] as String;
            final initialIndex = extras['initialQuestionIndex'] as int? ?? 0;
            return FutureBuilder<DocumentSnapshot>(
              future: FirebaseFirestore.instance
                  .collection('exams')
                  .doc(examId)
                  .get(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Scaffold(
                    backgroundColor: Color(0xFF1A1A2E),
                    body: Center(
                      child: CircularProgressIndicator(
                        color: Colors.tealAccent,
                      ),
                    ),
                  );
                }
                if (snapshot.hasError ||
                    !snapshot.hasData ||
                    !snapshot.data!.exists) {
                  return const Scaffold(
                    body: Center(child: Text('الاختبار غير موجود')),
                  );
                }
                final exam = ExamModel.fromJson(
                  snapshot.data!.data() as Map<String, dynamic>,
                );
                return ExamPlayerScreen(
                  exam: exam,
                  initialQuestionIndex: initialIndex,
                );
              },
            );
          }
        }
        return const Scaffold(
          body: Center(child: Text('Error: Invalid arguments for ExamPlayer')),
        );
      },
    ),
    GoRoute(
      path: '/student_exam_result',
      builder: (context, state) {
        final extraMap = state.extra as Map<String, dynamic>;
        return ExamResultScreen(
          exam: extraMap['exam'] as BaseExam,
          questions: extraMap['questions'] as List<QuestionModel>,
          selectedAnswers: extraMap['selectedAnswers'] as Map<String, int>,
        );
      },
    ),
    GoRoute(
      path: '/student_offline_exams',
      builder: (context, state) => const OfflineExamsScreen(),
    ),
    GoRoute(
      path: '/student_my_results',
      builder: (context, state) => const MyResultsScreen(),
    ),
    GoRoute(
      path: '/student_feedbacks',
      builder: (context, state) => const StudentFeedbacksScreen(),
    ),
    GoRoute(
      path: '/student_bookmarks',
      builder: (context, state) => const BookmarksScreen(),
    ),
    GoRoute(
      path: '/student_notifications',
      builder: (context, state) => const StudentNotificationsScreen(),
    ),
    GoRoute(
      path: '/student_profile',
      builder: (context, state) => const StudentProfileScreen(),
    ),
    GoRoute(
      path: '/student_exams_dashboard',
      builder: (context, state) => const ExamsDashboardScreen(),
    ),
    GoRoute(
      path: '/student_materials_dashboard',
      builder: (context, state) => const MaterialsDashboardScreen(),
    ),
    GoRoute(
      path: '/student_admission_universities',
      builder: (context, state) => const AdmissionUniversitiesScreen(),
    ),
    GoRoute(
      path: '/student_admission_majors',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return AdmissionMajorsScreen(
          universityId: extra?['universityId'] ?? '',
          universityName: extra?['universityName'] ?? 'التخصصات',
        );
      },
    ),
    GoRoute(
      path: '/student_admission_subjects',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return AdmissionSubjectsScreen(
          majorId: extra?['majorId'] ?? '',
          majorName: extra?['majorName'] ?? 'المواد',
        );
      },
    ),
    GoRoute(
      path: '/student_admission_exams',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return AdmissionExamsScreen(
          subjectId: extra?['subjectId'] ?? '',
          subjectName: extra?['subjectName'] ?? 'الاختبارات',
        );
      },
    ),
    GoRoute(
      path: '/student_competitions_semesters',
      builder: (context, state) => const CompetitionsSemestersScreen(),
    ),
    GoRoute(
      path: '/student_competitions_subjects',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return CompetitionsSubjectsScreen(
          semesterId: extra?['semesterId'] ?? '',
          semesterName: extra?['semesterName'] ?? 'المواد',
        );
      },
    ),
    GoRoute(
      path: '/student_competitions_exams',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return CompetitionsExamsScreen(
          subjectId: extra?['subjectId'] ?? '',
          subjectName: extra?['subjectName'] ?? 'التحديات',
          semesterName: extra?['semesterName'] ?? '',
        );
      },
    ),
    GoRoute(
      path: '/student_materials_list',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return MaterialsListScreen(
          subjectId: extra?['subjectId'] ?? '',
          subjectName: extra?['subjectName'] ?? 'المواد',
        );
      },
    ),
    GoRoute(
      path: '/student_video_player',
      builder: (context, state) {
        final extra = state.extra as Map?;
        return VideoPlayerScreen(
          videoUrl: extra?['videoUrl'] ?? '',
          title: extra?['title'] ?? 'فيديو',
        );
      },
    ),
    GoRoute(
      path: '/student_leaderboard',
      builder: (context, state) => const LeaderboardScreen(),
    ),
    GoRoute(
      path: '/student_competition_leaderboard',
      builder: (context, state) => const CompetitionLeaderboardScreen(),
    ),
    GoRoute(
      path: '/student_contact_admin',
      builder: (context, state) => const ContactAdminScreen(),
    ),
    GoRoute(
      path: '/pdf_viewer',
      builder: (context, state) {
        String path = '';
        String title = 'عرض الملف';
        bool isLocal = false;

        if (state.extra is String) {
          path = state.extra as String;
        } else if (state.extra is Map<String, dynamic>) {
          final extra = state.extra as Map<String, dynamic>;
          path = extra['path'] ?? '';
          title = extra['title'] ?? 'عرض الملف';
          isLocal = extra['isLocal'] ?? false;
        }

        return PdfViewerScreen(path: path, title: title, isLocal: isLocal);
      },
    ),
  ],
);
