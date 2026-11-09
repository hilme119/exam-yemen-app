import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './views/HomeView';
import { SubjectsView } from './views/SubjectsView';
import { ExamsListView } from './views/ExamsListView';
import { ExamPlayerView } from './views/ExamPlayerView';
import { ExamResultView } from './views/ExamResultView';
import { ResultsHistoryView } from './views/ResultsHistoryView';
import { LibraryView } from './views/LibraryView';
import { UniversitiesView } from './views/UniversitiesView';
import { CompetitionsView } from './views/CompetitionsView';
import { LeaderboardView } from './views/LeaderboardView';
import { FeedbacksView } from './views/FeedbacksView';
import {
  StudentUser,
  SubjectModel,
  ExamModel,
  QuestionModel,
  ResultModel,
  GradeModel
} from './types';
import {
  auth,
  onAuthStateChanged,
  signOut,
  db,
  doc,
  getDoc,
  collection,
  getDocs
} from './services/firebase';

export const App: React.FC = () => {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Curricula Grade & Stream Selection
  const [grades, setGrades] = useState<GradeModel[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('grade12');
  const [selectedStream, setSelectedStream] = useState<string>('scientific');
  const [selectedSubject, setSelectedSubject] = useState<SubjectModel | null>(null);

  // Active Exam & Questions State
  const [activeExam, setActiveExam] = useState<ExamModel | null>(null);
  const [customQuestions, setCustomQuestions] = useState<QuestionModel[] | undefined>(undefined);
  const [customExamTitle, setCustomExamTitle] = useState<string | undefined>(undefined);

  // Exam Result State
  const [activeResult, setActiveResult] = useState<ResultModel | null>(null);
  const [resultQuestions, setResultQuestions] = useState<QuestionModel[]>([]);

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Feedbacks Prefilled Context
  const [prefilledFeedback, setPrefilledFeedback] = useState<{
    examId: string;
    examName: string;
    questionId: string;
    questionNumber: number;
    questionText: string;
  } | null>(null);

  // Global exams count
  const [totalExamsCount, setTotalExamsCount] = useState(0);

  // Check saved guest user or Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentUser({
              id: user.uid,
              name: data.displayName || data.name || user.displayName || 'طالب متميز',
              email: user.email || '',
              gradeLevel: data.gradeLevel,
              points: data.points || 150,
              isGuest: false,
            });
          } else {
            setCurrentUser({
              id: user.uid,
              name: user.displayName || 'طالب متميز',
              email: user.email || '',
              isGuest: false,
              points: 150,
            });
          }
        } catch (e) {
          console.error('Error fetching user document:', e);
        }
      } else {
        // Check localStorage guest session
        const savedGuest = localStorage.getItem('exam_yemen_guest_user');
        if (savedGuest) {
          try {
            setCurrentUser(JSON.parse(savedGuest));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });

    // Fetch dynamic grades from Firestore 'grades' collection
    getDocs(collection(db, 'grades'))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GradeModel));
        if (list.length > 0) {
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setGrades(list);
          setSelectedGrade((prev) => {
            if (list.some((g) => g.id === prev)) return prev;
            return list[0].id;
          });
        }
      })
      .catch((e) => console.warn('Grades fetch warning:', e));

    // Count exams for banner stats
    getDocs(collection(db, 'exams'))
      .then((snap) => setTotalExamsCount(snap.docs.length))
      .catch((e) => console.warn(e));

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('exam_yemen_guest_user');
    setCurrentUser(null);
    setCurrentTab('home');
  };

  const handleLoginSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    if (user.isGuest) {
      localStorage.setItem('exam_yemen_guest_user', JSON.stringify(user));
    }
  };

  // Start an Exam
  const handleStartExam = (
    exam: ExamModel,
    overrideQuestions?: QuestionModel[],
    overrideTitle?: string
  ) => {
    setActiveExam(exam);
    setCustomQuestions(overrideQuestions);
    setCustomExamTitle(overrideTitle);
    setCurrentTab('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exam Finished
  const handleFinishExam = (result: ResultModel, questions: QuestionModel[]) => {
    setActiveResult(result);
    setResultQuestions(questions);

    // Save to local storage for instant offline history
    const existing = localStorage.getItem('exam_yemen_student_results');
    let historyList: ResultModel[] = [];
    if (existing) {
      try {
        historyList = JSON.parse(existing);
      } catch (e) {
        historyList = [];
      }
    }
    historyList.unshift(result);
    localStorage.setItem(
      'exam_yemen_student_results',
      JSON.stringify(historyList.slice(0, 100))
    );

    // If user is logged in, give points bonus
    if (currentUser && !currentUser.isGuest) {
      const earnedPoints = Math.round(result.score * 10);
      setCurrentUser((prev) => (prev ? { ...prev, points: (prev.points || 0) + earnedPoints } : null));
    }

    setCurrentTab('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retake Mistakes Only
  const handleRetakeMistakes = (wrongQuestions: QuestionModel[], examOverride?: ExamModel) => {
    const targetExam = examOverride || activeExam;
    if (!targetExam) return;

    handleStartExam(
      targetExam,
      wrongQuestions,
      `إعادة حل الأخطاء (${wrongQuestions.length} سؤال) - ${targetExam.title}`
    );
  };

  // Open Feedback Modal with Prefilled Question
  const handleReportQuestion = (q: QuestionModel, num: number) => {
    setPrefilledFeedback({
      examId: activeExam?.id || 'exam',
      examName: activeExam?.title || 'نموذج وزاري',
      questionId: q.id,
      questionNumber: num,
      questionText: q.text,
    });
    setCurrentTab('feedbacks');
  };

  // Review Past Result
  const handleReviewPastResult = (
    result: ResultModel,
    exam: ExamModel,
    questions: QuestionModel[]
  ) => {
    setActiveExam(exam);
    setActiveResult(result);
    setResultQuestions(questions);
    setCurrentTab('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'curricula') {
            setSelectedSubject(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'home' && (
          <HomeView
            currentUser={currentUser}
            grades={grades}
            selectedGrade={selectedGrade}
            onChangeGrade={setSelectedGrade}
            selectedStream={selectedStream}
            onChangeStream={setSelectedStream}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              if (tab === 'curricula') {
                setSelectedSubject(null);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            totalExamsCount={totalExamsCount}
          />
        )}

        {currentTab === 'curricula' && !selectedSubject && (
          <SubjectsView
            selectedGrade={selectedGrade}
            selectedStream={selectedStream}
            onSelectSubject={(subj) => setSelectedSubject(subj)}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'curricula' && selectedSubject && (
          <ExamsListView
            subject={selectedSubject}
            currentUser={currentUser}
            onStartExam={(exam) => handleStartExam(exam)}
            onBack={() => setSelectedSubject(null)}
          />
        )}

        {currentTab === 'player' && activeExam && (
          <ExamPlayerView
            exam={activeExam}
            customQuestions={customQuestions}
            customTitle={customExamTitle}
            currentUser={currentUser}
            onFinishExam={handleFinishExam}
            onExit={() => {
              if (selectedSubject) {
                setCurrentTab('curricula');
              } else {
                setCurrentTab('home');
              }
            }}
          />
        )}

        {currentTab === 'result' && activeResult && activeExam && (
          <ExamResultView
            result={activeResult}
            questions={resultQuestions}
            exam={activeExam}
            currentUser={currentUser}
            onRetakeFull={() => handleStartExam(activeExam)}
            onRetakeMistakes={(wrongs) => handleRetakeMistakes(wrongs, activeExam)}
            onBackToList={() => {
              if (selectedSubject) {
                setCurrentTab('curricula');
              } else {
                setCurrentTab('home');
              }
            }}
            onGoHome={() => setCurrentTab('home')}
            onOpenReportModal={handleReportQuestion}
          />
        )}

        {currentTab === 'history' && (
          <ResultsHistoryView
            currentUser={currentUser}
            onReviewResult={handleReviewPastResult}
            onRetakeMistakes={(wrongs, exam) => handleRetakeMistakes(wrongs, exam)}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'admission' && (
          <UniversitiesView
            onStartExam={(exam) => handleStartExam(exam)}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'competition' && (
          <CompetitionsView
            currentUser={currentUser}
            onStartExam={(exam) => handleStartExam(exam)}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView onGoHome={() => setCurrentTab('home')} />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            currentUser={currentUser}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'feedbacks' && (
          <FeedbacksView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onGoHome={() => setCurrentTab('home')}
            prefilledQuestion={prefilledFeedback}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 منصة اختبارات اليمن. جميع الحقوق محفوظة لوزارة التربية والتعليم والجامعات اليمنية 🇾🇪</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentTab('feedbacks')} className="hover:text-blue-600 transition-colors">
              ملاحظاتي واعتراضاتي
            </button>
            <button onClick={() => setCurrentTab('library')} className="hover:text-blue-600 transition-colors">
              المكتبة الرقمية
            </button>
            <button onClick={() => setCurrentTab('leaderboard')} className="hover:text-blue-600 transition-colors">
              لوحة الشرف
            </button>
          </div>
        </div>
      </footer>

      {/* Student Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
