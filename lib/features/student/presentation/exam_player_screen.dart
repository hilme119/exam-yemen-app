import 'widgets/voice_recorder_widget.dart';
import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/number_formatter.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/models/exam_model.dart';
import '../../../domain/models/student_grade_level.dart';
import '../../../domain/models/question_model.dart';
import '../../../domain/models/result_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/exam_provider.dart';
import '../providers/result_provider.dart';
import '../providers/question_feedback_provider.dart';
import '../../../domain/models/question_feedback_model.dart';
import '../providers/subject_provider.dart';
import '../providers/bookmark_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/services/storage_service.dart';
import '../../../domain/models/competition_models.dart';

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:showcaseview/showcaseview.dart';
import 'arabic_math_view.dart';

final currentQuestionIndexProvider = StateProvider.family<int, String>(
  (ref, examId) => 0,
);
final examAnswersProvider = StateProvider.family<Map<String, int>, String>(
  (ref, examId) => {},
);
final checkedQuestionsProvider = StateProvider.family<Set<String>, String>(
  (ref, examId) => {},
);

class ExamPlayerScreen extends ConsumerStatefulWidget {
  final BaseExam exam;
  final int initialQuestionIndex;
  final String? inferredGradeName;
  final List<QuestionModel>? customQuestions;
  final String? customTitle;

  const ExamPlayerScreen({
    super.key,
    required this.exam,
    this.initialQuestionIndex = 0,
    this.inferredGradeName,
    this.customQuestions,
    this.customTitle,
  });

  @override
  ConsumerState<ExamPlayerScreen> createState() => _ExamPlayerScreenState();
}

class _ExamPlayerScreenState extends ConsumerState<ExamPlayerScreen> {
  bool _isLoadingProgress = true;
  final GlobalKey _bookmarkKey = GlobalKey();
  final GlobalKey _checkAnswerKey = GlobalKey();
  final GlobalKey _submitKey = GlobalKey();
  String? _timerDisplay;
  int _remainingSeconds = 0;
  Timer? _examTimer;
  late DateTime _examStartTime;

  @override
  void initState() {
    super.initState();
    _examStartTime = DateTime.now();
    _loadProgress();
    _checkAndStartTimer();
  }

  void _checkAndStartTimer() {
    if (widget.exam is CompetitionExamModel) {
      final compExam = widget.exam as CompetitionExamModel;
      if (compExam.timerMinutes != null && compExam.timerMinutes! > 0) {
        _remainingSeconds = compExam.timerMinutes! * 60;
        _startTimer();
      }
    }
  }

  void _startTimer() {
    _examTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
          final minutes = _remainingSeconds ~/ 60;
          final seconds = _remainingSeconds % 60;
          _timerDisplay =
              '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
        });
      } else {
        timer.cancel();
        _handleTimeUp();
      }
    });
  }

  @override
  void dispose() {
    _examTimer?.cancel();
    super.dispose();
  }

  void _handleTimeUp() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF16213E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.timer_off_rounded, color: Colors.redAccent, size: 30),
            SizedBox(width: 10),
            Text('انتهى الوقت!', style: TextStyle(color: Colors.redAccent)),
          ],
        ),
        content: const Text(
          'لقد انتهى الوقت المخصص لهذا التحدي. سيتم تسليم إجاباتك الآن.',
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              Navigator.pop(context);
              _forceSubmitExam();
            },
            child: const Text(
              'تسليم الإجابات',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _forceSubmitExam() async {
    if (widget.customQuestions != null) {
      final duration = DateTime.now().difference(_examStartTime).inSeconds;
      await _submitExamLogic(
        context,
        ref,
        widget.exam,
        widget.customQuestions!,
        widget.inferredGradeName,
        duration,
      );
      return;
    }
    final questionsAsync = ref.read(questionsProvider(widget.exam.id));
    if (questionsAsync.hasValue && questionsAsync.value != null) {
      final duration = DateTime.now().difference(_examStartTime).inSeconds;
      await _submitExamLogic(
        context,
        ref,
        widget.exam,
        questionsAsync.value!,
        widget.inferredGradeName,
        duration,
      );
    }
  }

  Future<void> _loadProgress() async {
    final String examId = widget.exam.id;

    if (widget.customQuestions != null) {
      ref.read(currentQuestionIndexProvider(examId).notifier).state = 0;
      ref.read(examAnswersProvider(examId).notifier).state = {};
      ref.read(checkedQuestionsProvider(examId).notifier).state = {};
      if (mounted) setState(() => _isLoadingProgress = false);
      return;
    }

    final prefs = await SharedPreferences.getInstance();

    final savedIndex = prefs.getInt('exam_${examId}_index');
    if (savedIndex != null) {
      ref.read(currentQuestionIndexProvider(examId).notifier).state =
          savedIndex;
    } else if (widget.initialQuestionIndex > 0) {
      ref.read(currentQuestionIndexProvider(examId).notifier).state =
          widget.initialQuestionIndex;
    }

    final savedAnswersString = prefs.getString('exam_${examId}_answers');
    if (savedAnswersString != null) {
      try {
        final Map<String, dynamic> decoded = jsonDecode(savedAnswersString);
        ref.read(examAnswersProvider(examId).notifier).state = decoded.map(
          (key, value) => MapEntry(key, value as int),
        );
      } catch (e) {
        // Ignored
      }
    }

    final savedCheckedString = prefs.getString('exam_${examId}_checked');
    if (savedCheckedString != null) {
      try {
        final List<dynamic> decoded = jsonDecode(savedCheckedString);
        ref.read(checkedQuestionsProvider(examId).notifier).state = decoded
            .map((e) => e.toString())
            .toSet();
      } catch (e) {
        // Ignored
      }
    }

    if (mounted) {
      setState(() {
        _isLoadingProgress = false;
      });
    }
  }

  Future<void> _restartExam() async {
    final prefs = await SharedPreferences.getInstance();
    final String examId = widget.exam.id;

    await prefs.remove('exam_${examId}_index');
    await prefs.remove('exam_${examId}_answers');
    await prefs.remove('exam_${examId}_checked');

    ref.read(currentQuestionIndexProvider(examId).notifier).state = 0;
    ref.read(examAnswersProvider(examId).notifier).state = {};
    ref.read(checkedQuestionsProvider(examId).notifier).state = {};
  }

    Future<bool> _confirmExit(BuildContext context) async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.error.withAlpha(20),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.exit_to_app_rounded, color: AppColors.error, size: 24),
              ),
              const SizedBox(width: 12),
              const Text(
                'مغادرة الاختبار',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          content: const Text(
            'هل أنت متأكد من رغبتك في الخروج؟ سيتم حفظ تقدمك الحالي وإجاباتك لتتمكن من المتابعة لاحقاً.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
          ),
          actions: [
            TextButton(
              child: const Text(
                'متابعة الاختبار',
                style: TextStyle(color: AppColors.primaryAccent, fontWeight: FontWeight.bold),
              ),
              onPressed: () => Navigator.pop(context, false),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                'خروج وحفظ',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              onPressed: () => Navigator.pop(context, true),
            ),
          ],
        ),
      ),
    );
    if (shouldPop == true && context.mounted) {
      context.pop();
      return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingProgress) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.cyanGlow),
        ),
      );
    }

    final questionsAsync = ref.watch(questionsProvider(widget.exam.id));

    return ShowCaseWidget(
      builder: (context) {
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          final prefs = await SharedPreferences.getInstance();
          final hasShownPlayerCoach =
              prefs.getBool('has_shown_player_coach') ?? false;
          if (!hasShownPlayerCoach &&
              !_isLoadingProgress &&
              questionsAsync.value != null &&
              questionsAsync.value!.isNotEmpty) {
            if (mounted && context.mounted) {
              ShowCaseWidget.of(
                context,
              ).startShowCase([_bookmarkKey, _checkAnswerKey, _submitKey]);
              await prefs.setBool('has_shown_player_coach', true);
            }
          }
        });

        return PopScope(
          canPop: false,
          onPopInvoked: (didPop) async {
            if (didPop) return;
            await _confirmExit(context);
          },
          child: Scaffold(
            extendBodyBehindAppBar: true,
            appBar: AppBar(
              leading: IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: AppColors.textPrimary,
                    size: 16,
                  ),
                ),
                onPressed: () => _confirmExit(context),
              ),
              title: Text(
                widget.customTitle ?? widget.exam.title,
                style: const TextStyle(
                  color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18,
                ),
              ),
              backgroundColor: Colors.transparent,
              elevation: 0,
              centerTitle: true,
              iconTheme: const IconThemeData(color: AppColors.textPrimary),
              actions: [
                if (_timerDisplay != null)
                  Container(
                    margin: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _remainingSeconds < 60
                          ? AppColors.error.withOpacity(0.12)
                          : AppColors.warning.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _remainingSeconds < 60
                            ? AppColors.error
                            : AppColors.warning,
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.timer_outlined,
                          color: _remainingSeconds < 60
                              ? AppColors.error
                              : AppColors.warning,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _timerDisplay!,
                          style: TextStyle(
                            color: _remainingSeconds < 60
                                ? AppColors.error
                                : AppColors.warning,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                        ),
                      ],
                    ),
                  ),
                IconButton(
                  icon: const Icon(Icons.refresh, color: AppColors.textPrimary),
                  tooltip: 'إعادة الاختبار',
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => Directionality(
                        textDirection: TextDirection.rtl,
                        child: AlertDialog(
                          backgroundColor: AppColors.surface,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          title: const Row(
                            children: [
                              Icon(Icons.refresh_rounded, color: AppColors.primaryAccent, size: 24),
                              SizedBox(width: 10),
                              Text(
                                'إعادة الاختبار',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                            ],
                          ),
                          content: const Text(
                            'هل أنت متأكد من مسح جميع الإجابات والبدء من جديد؟',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
                          ),
                          actions: [
                            TextButton(
                              child: const Text(
                                'إلغاء',
                                style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                              ),
                              onPressed: () => Navigator.pop(context),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryAccent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text(
                                'نعم، أعد الاختبار',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            onPressed: () {
                              Navigator.pop(context);
                              _restartExam();
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                  },
                ),
              ],
            ),
            body: Stack(
              children: [
                // Background Gradient
                Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.backgroundGradient,
                  ),
                ),
                // Decorative Orbs
                Positioned(
                  top: 200,
                  left: -80,
                  child: _buildBlurOrb(color: AppColors.orbTeal, size: 250),
                ),
                Positioned(
                  bottom: 50,
                  right: -50,
                  child: _buildBlurOrb(color: AppColors.orbPink, size: 200),
                ),

                SafeArea(
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 800),
                      child: widget.customQuestions != null
                          ? _ExamInteraceBody(
                              exam: widget.exam,
                              questions: widget.customQuestions!,
                              bookmarkKey: _bookmarkKey,
                              checkAnswerKey: _checkAnswerKey,
                              submitKey: _submitKey,
                              onSubmit: () {
                                final duration = DateTime.now()
                                    .difference(_examStartTime)
                                    .inSeconds;
                                _submitExamLogic(
                                  context,
                                  ref,
                                  widget.exam,
                                  widget.customQuestions!,
                                  widget.inferredGradeName,
                                  duration,
                                );
                              },
                            )
                          : questionsAsync.when(
                        data: (questions) {
                          if (questions.isEmpty) {
                            return const Center(
                              child: Text(
                                'لا توجد أسئلة مضافة في هذا الاختبار بعد.',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                ),
                              ),
                            );
                          }

                          return _ExamInteraceBody(
                            exam: widget.exam,
                            questions: questions,
                            bookmarkKey: _bookmarkKey,
                            checkAnswerKey: _checkAnswerKey,
                            submitKey: _submitKey,
                            onSubmit: () {
                              final duration = DateTime.now()
                                  .difference(_examStartTime)
                                  .inSeconds;
                              _submitExamLogic(
                                context,
                                ref,
                                widget.exam,
                                questions,
                                widget.inferredGradeName,
                                duration,
                              );
                            },
                          );
                        },
                        loading: () => const Center(
                          child: CircularProgressIndicator(
                            color: Colors.tealAccent,
                          ),
                        ),
                        error: (e, st) => Center(
                          child: Text(
                            'حدث خطأ في تحميل الأسئلة: ${ErrorHandler.getErrorMessage(e)}',
                            style: const TextStyle(color: Colors.redAccent),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBlurOrb({required Color color, required double size}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withOpacity(0.15),
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 70.0, sigmaY: 70.0),
        child: Container(color: Colors.transparent),
      ),
    );
  }
}

Future<void> _submitExamLogic(
  BuildContext context,
  WidgetRef ref,
  BaseExam exam,
  List<QuestionModel> questions, [
  String? inferredGradeName,
  int? durationSeconds,
]) async {
  final String eId = exam.id;
  final answers = ref.read(examAnswersProvider(eId));
  final user = ref.read(authStateProvider).value;

  if (user == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('حدث خطأ: لم يتم العثور على بيانات المستخدم'),
        backgroundColor: Colors.redAccent,
      ),
    );
    return;
  }

  int score = 0;
  for (var q in questions) {
    if (answers[q.id] == q.correctAnswerIndex) {
      score++;
    }
  }

  // Determine if it's the first attempt
  bool isFirstTimer = true;
  try {
    final existingResults = await FirebaseFirestore.instance
        .collection('results')
        .where('userId', isEqualTo: user.id)
        .where('examId', isEqualTo: eId)
        .limit(1)
        .get();
    if (existingResults.docs.isNotEmpty) {
      isFirstTimer = false;
    }
  } catch (e) {
    debugPrint('Error checking previous results: $e');
  }

  String? subjectName;
  StudentGradeLevel? inferredGrade;

  try {
    // Attempt fast local grab
    final subjectsAsync = ref.read(subjectsProvider);
    if (subjectsAsync.hasValue && subjectsAsync.value != null) {
      final subject = subjectsAsync.value!.firstWhere(
        (s) => s.id == exam.subjectId,
      );
      subjectName = subject.name;
      inferredGrade = StudentGradeLevel.fromSubject(
        subject.grade,
        subject.stream,
      );
    }
  } catch (_) {}

  // Fallback to strict DB grab to guarantee Leaderboard visibility
  if (subjectName == null) {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('subjects')
          .doc(exam.subjectId)
          .get();
      if (doc.exists) {
        final data = doc.data();
        if (data != null) {
          subjectName = data['name'];
          inferredGrade = StudentGradeLevel.fromSubject(
            data['grade'],
            data['stream'],
          );
        }
      }
    } catch (_) {}
  }

  // Calculate Gamification Point for Competition
  int? finalEarnedPoints;
  if (exam is CompetitionExamModel) {
    final compExam = exam;
    if (compExam.rewardPoints != null && compExam.rewardPoints! > 0) {
      finalEarnedPoints = (score / questions.length * compExam.rewardPoints!)
          .round();
      if (finalEarnedPoints > 0 && isFirstTimer) {
        try {
          // Increment user points in firestore for global display if needed
          await FirebaseFirestore.instance
              .collection('users')
              .doc(user.id)
              .update({'points': FieldValue.increment(finalEarnedPoints)});
        } catch (_) {}
      }
    }
  }

  final result = ResultModel(
    id: FirebaseFirestore.instance.collection('results').doc().id,
    userId: user.id,
    examId: exam.id,
    examName: exam.title,
    subjectName: subjectName,
    score: score,
    totalQuestions: questions.length,
    selectedAnswers: answers,
    dateTaken: DateTime.now(),
    isFirstAttempt: isFirstTimer,
    studentGrade:
        inferredGradeName ?? inferredGrade?.name ?? user.gradeLevel?.name,
    earnedPoints: finalEarnedPoints,
    durationSeconds: durationSeconds,
  );

  ref.read(resultNotifierProvider.notifier).saveResult(result);

  // Reset Provider for next exam
  ref.read(currentQuestionIndexProvider(eId).notifier).state = 0;
  ref.read(examAnswersProvider(eId).notifier).state = {};
  ref.read(checkedQuestionsProvider(eId).notifier).state = {};

  SharedPreferences.getInstance().then((prefs) {
    prefs.remove('exam_${eId}_index');
    prefs.remove('exam_${eId}_answers');
    prefs.remove('exam_${eId}_checked');
  });

  context.go(
    '/student_exam_result',
    extra: {'exam': exam, 'questions': questions, 'selectedAnswers': answers},
  );
}

class _ExamInteraceBody extends ConsumerStatefulWidget {
  final BaseExam exam;
  final List<QuestionModel> questions;
  final GlobalKey bookmarkKey;
  final GlobalKey checkAnswerKey;
  final GlobalKey submitKey;
  final VoidCallback onSubmit;

  const _ExamInteraceBody({
    required this.exam,
    required this.questions,
    required this.bookmarkKey,
    required this.checkAnswerKey,
    required this.submitKey,
    required this.onSubmit,
  });

  @override
  ConsumerState<_ExamInteraceBody> createState() => _ExamInteraceBodyState();
}

class _ExamInteraceBodyState extends ConsumerState<_ExamInteraceBody> {
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    final initialIndex = ref.read(currentQuestionIndexProvider(widget.exam.id));
    _pageController = PageController(initialPage: initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  
  @override
  Widget build(BuildContext context) {
    final String eId = widget.exam.id;
    final currentIndex = ref.watch(currentQuestionIndexProvider(eId));
    final answers = ref.watch(examAnswersProvider(eId));
    final checkedQuestions = ref.watch(checkedQuestionsProvider(eId));

    final currentQuestion = widget.questions[currentIndex];
    final hasAnswered = answers.containsKey(currentQuestion.id);
    final isChecked = checkedQuestions.contains(currentQuestion.id);

    // Calculate progress
    double progress = (currentIndex + 1) / widget.questions.length;

    return Column(
      children: [
        // Progress Bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'السؤال رقم ${NumberFormatter.toEnDigits(currentIndex + 1)} من ${NumberFormatter.toEnDigits(widget.questions.length)}',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    '${NumberFormatter.toEnDigits(((currentIndex + 1) / widget.questions.length * 100).toInt())}%',
                    style: const TextStyle(
                      color: AppColors.cyanGlow,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: AppColors.border,
                  color: AppColors.cyanGlow,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Questions View
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.questions.length,
            onPageChanged: (idx) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                ref.read(currentQuestionIndexProvider(eId).notifier).state =
                    idx;
                SharedPreferences.getInstance().then((prefs) {
                  prefs.setInt('exam_${eId}_index', idx);
                });
              });
            },
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: _QuestionCard(
                  question: widget.questions[index],
                  index: index,
                  exam: widget.exam,
                  bookmarkKey: widget.bookmarkKey,
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 16),

        // Bottom Controls (Next, Previous, Submit)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(30),
              topRight: Radius.circular(30),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 15,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Previous Button (Always present, visibly disabled on question 0, active on question 1+)
              Expanded(
                child: Align(
                  alignment: Alignment.centerRight,
                  child: currentIndex > 0
                      ? ElevatedButton.icon(
                          onPressed: () {
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                            if (currentIndex > 0) {
                              ref.read(currentQuestionIndexProvider(eId).notifier).state = currentIndex - 1;
                            }
                          },
                          icon: const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 14,
                            color: AppColors.textPrimary,
                          ),
                          label: const Text(
                            'السابق',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF1F5F9),
                            foregroundColor: AppColors.textPrimary,
                            elevation: 0,
                            side: const BorderSide(
                              color: Color(0xFFCBD5E1),
                              width: 1.2,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 18,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        )
                      : Opacity(
                          opacity: 0.35,
                          child: ElevatedButton.icon(
                            onPressed: null,
                            icon: const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                              color: AppColors.textSecondary,
                            ),
                            label: const Text(
                              'السابق',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFF1F5F9),
                              elevation: 0,
                              side: const BorderSide(
                                color: Color(0xFFE2E8F0),
                                width: 1,
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 18,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                        ),
                ),
              ),

              // Check Answer Button
              Expanded(
                child: Center(
                  child: (!isChecked && hasAnswered)
                      ? Showcase(
                          key: widget.checkAnswerKey,
                          description: 'تحقق من إجابتك فوراً وتعرف على الشرح!',
                          child: TextButton.icon(
                            onPressed: () {
                              ref
                                  .read(checkedQuestionsProvider(eId).notifier)
                                  .update((state) {
                                    final newState = {
                                      ...state,
                                      currentQuestion.id,
                                    };
                                    SharedPreferences.getInstance().then((
                                      prefs,
                                    ) {
                                      prefs.setString(
                                        'exam_${eId}_checked',
                                        jsonEncode(newState.toList()),
                                      );
                                    });
                                    return newState;
                                  });
                            },
                            icon: const Icon(
                              Icons.check_circle,
                              color: Colors.amberAccent,
                              size: 20,
                            ),
                            label: const Text(
                              'تحقق',
                              style: TextStyle(
                                color: Colors.amberAccent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: TextButton.styleFrom(
                              backgroundColor: Colors.amberAccent.withOpacity(
                                0.1,
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                            ),
                          ),
                        )
                      : isChecked
                      ? Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'تم التحقق',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              ),

              // Next or Finish Button
              Expanded(
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Showcase(
                    key: widget.submitKey,
                    description: currentIndex == widget.questions.length - 1
                        ? 'قم بتسليم الامتحان بعد الإجابة على كل الأسئلة'
                        : 'انتقل للسؤال التالي',
                    child: currentIndex == widget.questions.length - 1
                        ? ElevatedButton.icon(
                            onPressed: () async {
                              if (answers.length < widget.questions.length) {
                                int firstUnanswered = -1;
                                for (int i = 0; i < widget.questions.length; i++) {
                                  if (!answers.containsKey(widget.questions[i].id)) {
                                    firstUnanswered = i;
                                    break;
                                  }
                                }

                                if (firstUnanswered != -1) {
                                  _pageController.animateToPage(
                                    firstUnanswered,
                                    duration: const Duration(milliseconds: 500),
                                    curve: Curves.easeInOut,
                                  );
                                }

                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text(
                                      'الرجاء الإجابة على جميع الأسئلة قبل تسليم الامتحان.',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    backgroundColor: Colors.redAccent,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                );
                                return;
                              }
                              widget.onSubmit();
                            },
                            icon: const Icon(
                              Icons.check_circle_outline_rounded,
                            ),
                            label: const Text(
                              'تسليم الإجابات',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.greenAccent.shade700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              elevation: 5,
                            ),
                          )
                        : ElevatedButton(
                            onPressed: () {
                              _pageController.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE94560),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              elevation: 5,
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'التالي',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_back_ios_rounded, size: 14),
                              ],
                            ),
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuestionCard extends ConsumerWidget {
  final QuestionModel question;
  final int index;
  final BaseExam exam;
  final GlobalKey bookmarkKey;

  const _QuestionCard({
    required this.question,
    required this.index,
    required this.exam,
    required this.bookmarkKey,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String examId = exam.id;
    final answers = ref.watch(examAnswersProvider(examId));
    final selectedOption = answers[question.id];
    final checkedQuestions = ref.watch(checkedQuestionsProvider(examId));
    final isChecked = checkedQuestions.contains(question.id);

    // Bookmarks variables
    final userAsync = ref.watch(authStateProvider);
    final isGuest = userAsync.value?.email.startsWith('guest_') ?? true;
    final userId = userAsync.value?.id;
    final isBookmarked = ref.watch(isQuestionBookmarkedProvider(question.id));

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.glassBorder, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Persistent Feedback Banner (shown after checking answer)
              if (isChecked) _buildFeedbackBanner(question, selectedOption),
              // Question Text Area
              Expanded(
                flex: 5,
                child: Container(
                  padding: const EdgeInsets.only(
                    top: 8.0,
                    left: 24.0,
                    right: 24.0,
                    bottom: 24.0,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight.withAlpha(120),
                    border: Border(
                      bottom: BorderSide(
                        color: AppColors.glassBorder,
                        width: 1.2,
                      ),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Top Row: Report Note & Bookmark Button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () =>
                                _showFeedbackDialog(context, ref, exam),
                            icon: const Icon(Icons.edit_note_rounded, size: 20),
                            label: const Text(
                              'إضافة ملاحظة',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.orangeAccent,
                              side: const BorderSide(
                                color: Colors.orangeAccent,
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                            ),
                          ),
                          if (!isGuest && userId != null)
                            Showcase(
                              key: bookmarkKey,
                              description:
                                  'احفظ هذا السؤال في المفضلة للرجوع إليه وقتما تشاء!',
                              child: IconButton(
                                onPressed: () async {
                                  final subjectsAsync = ref.read(
                                    subjectsProvider,
                                  );
                                  String sName = 'مادة مجهولة';
                                  if (subjectsAsync.hasValue &&
                                      subjectsAsync.value != null) {
                                    try {
                                      sName = subjectsAsync.value!
                                          .firstWhere(
                                            (s) => s.id == exam.subjectId,
                                          )
                                          .name;
                                    } catch (_) {}
                                  }

                                  await ref
                                      .read(bookmarkActionsProvider)
                                      .toggleBookmark(
                                        userId: userId,
                                        examId: examId,
                                        questionId: question.id,
                                        questionHtml: question.text,
                                        subjectName: sName,
                                        examTitle: exam.title,
                                        currentlyBookmarked: isBookmarked,
                                      );

                                  if (context.mounted) {
                                    ScaffoldMessenger.of(
                                      context,
                                    ).clearSnackBars();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          isBookmarked
                                              ? 'تمت الإزالة من المفضلة'
                                              : 'تمت الإضافة إلى المفضلة بنجاح!',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        backgroundColor: isBookmarked
                                            ? Colors.redAccent
                                            : Colors.greenAccent.shade700,
                                        behavior: SnackBarBehavior.floating,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  }
                                },
                                icon: Icon(
                                  isBookmarked
                                      ? Icons.star_rounded
                                      : Icons.star_border_rounded,
                                  color: isBookmarked
                                      ? Colors.amberAccent
                                      : Colors.white54,
                                  size: 28,
                                ),
                                tooltip: isBookmarked
                                    ? 'إزالة من المفضلة'
                                    : 'حفظ في المفضلة',
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: Center(
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (question.questionImageUrl != null &&
                                    question.questionImageUrl!.isNotEmpty) ...[
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Image.network(
                                      question.questionImageUrl!,
                                      height:
                                          220, // Increased height for better visibility
                                      fit: BoxFit.contain,
                                      loadingBuilder:
                                          (context, child, progress) {
                                            if (progress == null) return child;
                                            return const SizedBox(
                                              height: 220,
                                              child: Center(
                                                child:
                                                    CircularProgressIndicator(
                                                      color: Colors.tealAccent,
                                                    ),
                                              ),
                                            );
                                          },
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                _buildMixedText( question.text, fontFamily: question.fontFamily, color: AppColors.textPrimary,
                                  fontSize: question.fontFamily == 'Aldhabi'
                                      ? 32
                                      : 22,
                                  fontWeight: FontWeight.bold,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Options Area
              Expanded(
                flex: 4,
                child: ListView.builder(
                  padding: const EdgeInsets.all(20.0),
                  physics: const BouncingScrollPhysics(),
                  itemCount: question.options.length,
                  itemBuilder: (context, optIndex) {
                    final isSelected = selectedOption == optIndex;
                    final isCorrectOption =
                        optIndex == question.correctAnswerIndex;

                    Color borderColor = AppColors.glassBorder; Color bgColor = Colors.white; Color textColor = AppColors.textPrimary;
                    Color iconColor = AppColors.textTertiary;

                    if (isChecked) {
                      if (isCorrectOption) {
                        borderColor = AppColors.success;
                        bgColor = AppColors.success.withOpacity(0.12);
                        textColor = AppColors.success;
                        iconColor = AppColors.success;
                      } else if (isSelected) {
                        borderColor = AppColors.error;
                        bgColor = AppColors.error.withOpacity(0.12);
                        textColor = AppColors.error;
                        iconColor = AppColors.error;
                      }
                    } else if (isSelected) {
                      borderColor = AppColors.primaryAccent; bgColor = AppColors.primaryAccent.withAlpha(20); textColor = AppColors.primaryAccent; iconColor = AppColors.primaryAccent;
                    }

                    final String? optImageUrl =
                        (question.optionsImageUrls != null &&
                            question.optionsImageUrls!.length > optIndex)
                        ? question.optionsImageUrls![optIndex]
                        : null;

                    final String? optFont =
                        (question.optionsFontFamilies != null &&
                            question.optionsFontFamilies!.length > optIndex &&
                            question.optionsFontFamilies![optIndex].isNotEmpty)
                        ? question.optionsFontFamilies![optIndex]
                        : question.fontFamily;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: InkWell(
                        onTap: isChecked
                            ? null
                            : () {
                                final updatedMap = Map<String, int>.from(
                                  answers,
                                );
                                updatedMap[question.id] = optIndex;
                                ref
                                        .read(
                                          examAnswersProvider(examId).notifier,
                                        )
                                        .state =
                                    updatedMap;
                                SharedPreferences.getInstance().then((prefs) {
                                  prefs.setString(
                                    'exam_${examId}_answers',
                                    jsonEncode(updatedMap),
                                  );
                                });
                              },
                        borderRadius: BorderRadius.circular(16),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 16,
                          ),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: borderColor,
                              width:
                                  isSelected || (isChecked && isCorrectOption)
                                  ? 2
                                  : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: iconColor,
                                    width:
                                        (isSelected ||
                                            (isChecked && isCorrectOption))
                                        ? 6
                                        : 2,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              if (optImageUrl != null &&
                                  optImageUrl.isNotEmpty) ...[
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    optImageUrl,
                                    height: 48,
                                    width: 48,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Expanded(
                                child: _buildMixedText(
                                  question.options[optIndex],
                                  fontFamily: optFont,
                                  fontSize: optFont == 'Aldhabi' ? 32 : 18,
                                  fontWeight:
                                      isSelected ||
                                          (isChecked && isCorrectOption)
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                  color: textColor,
                                  textAlign: TextAlign.right,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMixedText(
    String text, {
    required double fontSize,
    required Color color,
    required String? fontFamily,
    required FontWeight fontWeight,
    TextAlign textAlign = TextAlign.right,
  }) {
    if (!text.contains('\$') &&
        !text.contains('\\[') &&
        !text.contains('\\(')) {
      return SizedBox(
        width: double.infinity,
        child: Text(
          text,
          textAlign: textAlign,
          textDirection: TextDirection.rtl,
          style: TextStyle(
            fontFamily: fontFamily,
            fontSize: fontSize,
            color: color,
            fontWeight: fontWeight,
            height: 1.6,
          ),
        ),
      );
    }

    // Use flutter_math_fork for native rendering
    return ArabicMathView(
      questionMath: text,
      fontSize: fontSize,
      textColor: color,
      fontWeight: fontWeight,
      textAlign: textAlign,
      fontFamily: fontFamily,
    );
  }

  /// Builds the persistent feedback banner shown after the student checks their answer.
  Widget _buildFeedbackBanner(QuestionModel question, int? selectedOption) {
    final isCorrect = selectedOption == question.correctAnswerIndex;
    final correctAnswer = question.options[question.correctAnswerIndex];

    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
      margin: const EdgeInsets.only(bottom: 0),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isCorrect
              ? [Colors.green.shade900.withOpacity(0.6), Colors.green.shade700.withOpacity(0.3)]
              : [Colors.red.shade900.withOpacity(0.6), Colors.red.shade700.withOpacity(0.3)],
          begin: Alignment.centerRight,
          end: Alignment.centerLeft,
        ),
        border: Border(
          bottom: BorderSide(
            color: isCorrect ? Colors.greenAccent : Colors.redAccent,
            width: 2,
          ),
        ),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (isCorrect ? Colors.greenAccent : Colors.redAccent).withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(
                color: isCorrect ? Colors.greenAccent : Colors.redAccent,
                width: 2,
              ),
            ),
            child: Icon(
              isCorrect ? Icons.check_rounded : Icons.close_rounded,
              color: isCorrect ? Colors.greenAccent : Colors.redAccent,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              textDirection: TextDirection.rtl,
              children: [
                Text(
                  isCorrect ? 'أحسنت! إجابة صحيحة 🎉' : 'إجابة خاطئة ❌',
                  textDirection: TextDirection.rtl,
                  style: TextStyle(
                    color: isCorrect ? Colors.greenAccent : Colors.redAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (!isCorrect) ...[
                  const SizedBox(height: 4),
                  Text(
                    'الإجابة الصحيحة: $correctAnswer',
                    textDirection: TextDirection.rtl,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showFeedbackDialog(BuildContext context, WidgetRef ref, BaseExam exam) {
    showDialog(
      context: context,
      builder: (context) => _QuestionObjectionDialog(
        exam: exam,
        question: question,
        questionIndex: index,
        ref: ref,
      ),
    );
  }
}

class _QuestionObjectionDialog extends StatefulWidget {
  final BaseExam exam;
  final QuestionModel question;
  final int questionIndex;
  final WidgetRef ref;

  const _QuestionObjectionDialog({
    required this.exam,
    required this.question,
    required this.questionIndex,
    required this.ref,
  });

  @override
  State<_QuestionObjectionDialog> createState() => _QuestionObjectionDialogState();
}

class _QuestionObjectionDialogState extends State<_QuestionObjectionDialog> {
  final _noteController = TextEditingController();
  XFile? _selectedImage;
  PlatformFile? _selectedAudio;
  String? _recordedAudioPath;
  bool _isUploading = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final img = await picker.pickImage(source: source, imageQuality: 85);
      if (img != null) {
        setState(() => _selectedImage = img);
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _pickAudio() async {
    try {
      final res = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'opus'],
      );
      if (res != null && res.files.isNotEmpty) {
        setState(() => _selectedAudio = res.files.first);
      }
    } catch (e) {
      debugPrint('Error picking audio: $e');
    }
  }

  Future<void> _submit() async {
    final note = _noteController.text.trim();
    if (note.isEmpty && _selectedImage == null && _selectedAudio == null) {
      return;
    }

    final user = widget.ref.read(authStateProvider).value;
    if (user == null) {
      Navigator.pop(context);
      return;
    }

    setState(() => _isUploading = true);

    try {
      String? imageUrl;
      String? audioUrl;

      if (_selectedImage != null) {
        imageUrl = await StorageService.uploadFilePath(_selectedImage!.path);
      }
      if (_recordedAudioPath != null) {
        audioUrl = await StorageService.uploadFilePath(_recordedAudioPath!);
      } else if (_selectedAudio != null) {
        audioUrl = await StorageService.uploadPlatformFile(_selectedAudio!);
      }

      final subjectsAsync = widget.ref.read(subjectsProvider);
      String subjectName = 'مادة مجهولة';
      String gradeName = 'غير محدد';

      if (subjectsAsync.hasValue && subjectsAsync.value != null) {
        try {
          final subject = subjectsAsync.value!.firstWhere(
            (s) => s.id == widget.exam.subjectId,
          );
          subjectName = subject.name;
          gradeName = subject.grade;
        } catch (_) {}
      }

      final feedback = QuestionFeedbackModel(
        id: const Uuid().v4(),
        userId: user.id,
        userName: user.name,
        examId: widget.exam.id,
        examName: widget.exam.title,
        gradeName: gradeName,
        subjectName: subjectName,
        questionId: widget.question.id,
        questionNumber: widget.questionIndex + 1,
        questionText: widget.question.text,
        note: note.isNotEmpty ? note : 'ملاحظة على السؤال مع مرفق',
        imageUrl: imageUrl,
        audioUrl: audioUrl,
        createdAt: DateTime.now(),
      );

      await widget.ref
          .read(questionFeedbackNotifierProvider.notifier)
          .submitFeedback(feedback);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم إرسال ملاحظتك وتدقيق السؤال بنجاح، شكراً لك!'),
            backgroundColor: AppColors.emeraldMint,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ أثناء الإرسال: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  
  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryAccent.withAlpha(20),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.edit_note_rounded, color: AppColors.primaryAccent, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'إضافة ملاحظة على سؤال #${widget.questionIndex + 1}',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Text(
                          'سيتم مراجعة السؤال وتصحيحه فوراً',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _noteController,
                maxLines: 4,
                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'اكتب تفاصيل ملاحظتك أو الخطأ الذي لاحظته...',
                  hintStyle: const TextStyle(color: AppColors.textPlaceholder, fontSize: 12),
                  filled: true,
                  fillColor: AppColors.surfaceLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primaryAccent),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (_selectedImage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryAccent.withAlpha(15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.image_rounded, size: 18, color: AppColors.primaryAccent),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _selectedImage!.name,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryAccent),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _selectedImage = null),
                        child: const Icon(Icons.close_rounded, size: 16, color: AppColors.error),
                      ),
                    ],
                  ),
                ),
              if (_selectedAudio != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.emeraldMint.withAlpha(15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.mic_rounded, size: 18, color: AppColors.emeraldMint),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _selectedAudio!.name,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.emeraldMint),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _selectedAudio = null),
                        child: const Icon(Icons.close_rounded, size: 16, color: AppColors.error),
                      ),
                    ],
                  ),
                ),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library_rounded, size: 16),
                      label: const Text('إرفاق صورة', style: TextStyle(fontSize: 11)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryAccent,
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: VoiceRecorderWidget(
                      onAudioChanged: (p) => setState(() => _recordedAudioPath = p),
                      onFilePicked: (f) => setState(() => _selectedAudio = f),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('إلغاء', style: TextStyle(color: AppColors.textSecondary)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isUploading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryAccent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      child: _isUploading
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('إرسال الملاحظة', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

