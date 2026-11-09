import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Sidebar, NavItemIndex } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './views/OverviewView';
import { GradesView } from './views/GradesView';
import { SubjectsView } from './views/SubjectsView';
import { AcademicYearsView } from './views/AcademicYearsView';
import { ExamsView } from './views/ExamsView';
import { PdfExamsView } from './views/PdfExamsView';
import { ResultsView } from './views/ResultsView';
import { QuestionsView } from './views/QuestionsView';
import { FeedbacksView } from './views/FeedbacksView';
import { UsersView } from './views/UsersView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { AdmissionView } from './views/AdmissionView';
import { CompetitionsView } from './views/CompetitionsView';
import { MaterialsView } from './views/MaterialsView';
import { MessagesView } from './views/MessagesView';
import { LeaderboardView } from './views/LeaderboardView';
import { LoginView } from './views/LoginView';
import { QuestionEditorModal } from './components/questions/QuestionEditorModal';
import { BulkImportModal } from './components/questions/BulkImportModal';
import { 
  GradeItem, 
  Subject, 
  Exam, 
  AcademicYear, 
  Question, 
  QuestionFeedback, 
  StudentResult, 
  UserModel, 
  AppConfig, 
  DashboardStats, 
  SupportMessage,
  PREDEFINED_GRADES 
} from './types';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  onAuthStateChanged,
  signOut,
  User
} from './services/firebase';

export const App: React.FC = () => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [bypassAuth, setBypassAuth] = useState<boolean>(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Navigation Index
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // If viewing questions inside an exam
  const [activeExamForQuestions, setActiveExamForQuestions] = useState<Exam | null>(null);

  // Real-time Data States from Firebase Firestore
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentExamQuestions, setCurrentExamQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [feedbacks, setFeedbacks] = useState<QuestionFeedback[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  const [appConfig, setAppConfig] = useState<AppConfig>({
    latestVersion: '1.0.8',
    downloadUrl: 'https://github.com/hilme119/exam-yemen-app/releases/latest/download/ExamYemen.apk',
    releaseNotes: 'تحديث شامل لواجهات التطبيق، إزالة النصوص والحشوات الزائدة، وفصل مواد العلمي والأدبي بدقة عالية.',
    forceUpdate: false,
  });

  // Modals state
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Direct fast load for all collections
  const loadDataDirectly = async () => {
    setIsLoadingData(true);
    setFirestoreError(null);
    try {
      const [gradesSnap, subjectsSnap, yearsSnap, examsSnap, usersSnap, feedbacksSnap, resultsSnap, messagesSnap, configSnap] = await Promise.all([
        getDocs(collection(db, 'grades')),
        getDocs(collection(db, 'subjects')),
        getDocs(collection(db, 'academic_years')),
        getDocs(collection(db, 'exams')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'question_feedbacks')),
        getDocs(collection(db, 'results')),
        getDocs(collection(db, 'messages')),
        getDoc(doc(db, 'settings', 'app_config'))
      ]);

      if (!gradesSnap.empty) {
        setGrades(gradesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GradeItem)));
      } else {
        setGrades([
          { id: 'grade9', name: 'الصف التاسع الأساسي', order: 1, hasStreams: true, streams: ['عام', 'إنجليزي'] },
          { id: 'grade12', name: 'الثالث الثانوي', order: 2, hasStreams: true, streams: ['علمي', 'أدبي', 'علمي إنجليزي', 'أدبي إنجليزي'] },
        ]);
      }
      setSubjects(subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
      setYears(yearsSnap.docs.map(d => ({ 
        id: d.id, 
        yearLabel: d.data().yearLabel || d.data().year || '',
        ...d.data() 
      } as AcademicYear)));
      setExams(examsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserModel)));
      setFeedbacks(feedbacksSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionFeedback)));
      setResults(resultsSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentResult)));
      setMessages(messagesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage)));
      if (configSnap.exists()) {
        setAppConfig(configSnap.data() as AppConfig);
      }
    } catch (err: any) {
      console.warn('Initial direct fetch warning:', err);
      if (err.code === 'permission-denied') {
        setFirestoreError('قواعد أمان فايربيس الحالية تطلب تسجيل دخول بصلاحية مسؤول لقراءة وتعديل قاعدة البيانات. يرجى تسجيل الدخول بحساب الإدارة.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser && !bypassAuth) return;
    loadDataDirectly();

    // 1. Grades listener
    const unsubGrades = onSnapshot(collection(db, 'grades'), (snap) => {
      setFirestoreError(null);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as GradeItem));
      if (data.length === 0) {
        setGrades([
          { id: 'grade9', name: 'الصف التاسع الأساسي', order: 1, hasStreams: true, streams: ['عام', 'إنجليزي'] },
          { id: 'grade12', name: 'الثالث الثانوي', order: 2, hasStreams: true, streams: ['علمي', 'أدبي', 'علمي إنجليزي', 'أدبي إنجليزي'] },
        ]);
      } else {
        setGrades(data);
      }
    }, (err) => {
      console.warn('Grades Firestore sync:', err);
      if (err.code === 'permission-denied') {
        setFirestoreError('قواعد أمان فايربيس الحالية تطلب تسجيل دخول بصلاحية مسؤول لقراءة وتعديل قاعدة البيانات. يرجى تسجيل الدخول بحساب الإدارة.');
      }
      setGrades([
        { id: 'grade9', name: 'الصف التاسع الأساسي', order: 1, hasStreams: true, streams: ['عام', 'إنجليزي'] },
        { id: 'grade12', name: 'الثالث الثانوي', order: 2, hasStreams: true, streams: ['علمي', 'أدبي', 'علمي إنجليزي', 'أدبي إنجليزي'] },
      ]);
    });

    // 2. Subjects listener
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      setFirestoreError(null);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      setSubjects(data);
    }, (err) => {
      console.warn('Subjects Firestore sync:', err);
      if (err.code === 'permission-denied') {
        setFirestoreError('قواعد أمان فايربيس الحالية تطلب تسجيل دخول بصلاحية مسؤول لقراءة وتعديل قاعدة البيانات. يرجى تسجيل الدخول بحساب الإدارة.');
      }
    });

    // 3. Academic Years listener
    const unsubYears = onSnapshot(collection(db, 'academic_years'), (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        yearLabel: d.data().yearLabel || d.data().year || '',
        ...d.data() 
      } as AcademicYear));
      setYears(data);
    }, (err) => console.warn('Years Firestore sync:', err));

    // 4. Exams listener
    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) => {
      setFirestoreError(null);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam));
      setExams(data);
    }, (err) => {
      console.warn('Exams Firestore sync:', err);
      if (err.code === 'permission-denied') {
        setFirestoreError('قواعد أمان فايربيس الحالية تطلب تسجيل دخول بصلاحية مسؤول لقراءة وتعديل قاعدة البيانات. يرجى تسجيل الدخول بحساب الإدارة.');
      }
    });

    // 5. Results listener
    const unsubResults = onSnapshot(collection(db, 'results'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentResult));
      setResults(data);
    }, (err) => console.warn('Results Firestore sync:', err));

    // 6. Users listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserModel));
      setUsers(data);
    }, (err) => console.warn('Users Firestore sync:', err));

    // 7. Question Feedbacks listener
    const unsubFeedbacks = onSnapshot(collection(db, 'question_feedbacks'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionFeedback));
      setFeedbacks(data);
    }, (err) => console.warn('Feedbacks Firestore sync:', err));

    // 8. App Config Doc listener
    const unsubConfig = onSnapshot(doc(db, 'settings', 'app_config'), (docSnap) => {
      if (docSnap.exists()) {
        setAppConfig(docSnap.data() as AppConfig);
      }
    }, (err) => console.warn('AppConfig Firestore sync:', err));

    // 9. Messages listener
    const unsubMessages = onSnapshot(collection(db, 'messages'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage));
      setMessages(data);
    }, (err) => console.warn('Messages Firestore sync:', err));

    return () => {
      unsubGrades();
      unsubSubjects();
      unsubYears();
      unsubExams();
      unsubResults();
      unsubUsers();
      unsubFeedbacks();
      unsubConfig();
      unsubMessages();
    };
  }, [currentUser, bypassAuth, refreshKey]);

  // Real-time Questions Listener for Active Exam
  useEffect(() => {
    if (!activeExamForQuestions) {
      setCurrentExamQuestions([]);
      return;
    }

    const unsubQuestions = onSnapshot(
      collection(db, 'exams', activeExamForQuestions.id, 'questions'),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        data.sort((a, b) => {
          const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
        setCurrentExamQuestions(data);
      },
      (err) => console.warn('Exam Questions Firestore sync:', err)
    );

    return () => unsubQuestions();
  }, [activeExamForQuestions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    await loadDataDirectly();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await signOut(auth);
      setBypassAuth(false);
    }
  };

  // --- CRUD Handlers directly saving to Firestore ---

  // Grades Handlers
  const handleAddGrade = async (grade: GradeItem) => {
    try {
      await setDoc(doc(db, 'grades', grade.id), grade);
    } catch (e) {
      console.error('Error adding grade:', e);
      setGrades(prev => [...prev, grade]);
    }
  };

  const handleUpdateGrade = async (grade: GradeItem) => {
    try {
      await updateDoc(doc(db, 'grades', grade.id), grade as any);
    } catch (e) {
      console.error('Error updating grade:', e);
      setGrades(prev => prev.map(g => g.id === grade.id ? grade : g));
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'grades', id));
    } catch (e) {
      console.error('Error deleting grade:', e);
      setGrades(prev => prev.filter(g => g.id !== id));
    }
  };

  // Subjects Handlers
  const handleAddSubject = async (subject: Subject) => {
    try {
      await setDoc(doc(db, 'subjects', subject.id), subject);
    } catch (e) {
      console.error('Error adding subject:', e);
      setSubjects(prev => [subject, ...prev]);
    }
  };

  const handleUpdateSubject = async (subject: Subject) => {
    try {
      await updateDoc(doc(db, 'subjects', subject.id), subject as any);
    } catch (e) {
      console.error('Error updating subject:', e);
      setSubjects(prev => prev.map(s => s.id === subject.id ? subject : s));
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (e) {
      console.error('Error deleting subject:', e);
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  // Academic Years Handlers
  const handleAddYear = async (year: AcademicYear) => {
    try {
      await setDoc(doc(db, 'academic_years', year.id), year);
    } catch (e) {
      console.error('Error adding year:', e);
      setYears(prev => [year, ...prev]);
    }
  };

  const handleUpdateYear = async (year: AcademicYear) => {
    try {
      await updateDoc(doc(db, 'academic_years', year.id), year as any);
    } catch (e) {
      console.error('Error updating year:', e);
      setYears(prev => prev.map(y => y.id === year.id ? year : y));
    }
  };

  const handleDeleteYear = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'academic_years', id));
    } catch (e) {
      console.error('Error deleting year:', e);
      setYears(prev => prev.filter(y => y.id !== id));
    }
  };

  // Exams Handlers
  const handleAddExam = async (exam: Exam) => {
    try {
      await setDoc(doc(db, 'exams', exam.id), exam);
    } catch (e) {
      console.error('Error adding exam:', e);
      setExams(prev => [exam, ...prev]);
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'exams', id));
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error('Error deleting exam:', e);
      setExams(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleBulkDeleteExams = async (ids: string[]) => {
    try {
      const promises = ids.map(id => deleteDoc(doc(db, 'exams', id)));
      await Promise.all(promises);
      setExams(prev => prev.filter(e => !ids.includes(e.id)));
    } catch (e) {
      console.error('Error bulk deleting exams:', e);
      setExams(prev => prev.filter(e => !ids.includes(e.id)));
    }
  };

  // Questions Handlers
  const handleSaveQuestion = async (question: Question) => {
    if (!activeExamForQuestions) return;
    const examId = activeExamForQuestions.id;

    try {
      await setDoc(doc(db, 'exams', examId, 'questions', question.id), question);
      await updateDoc(doc(db, 'exams', examId), {
        questionsCount: currentExamQuestions.length + 1,
      });
    } catch (e) {
      console.error('Error saving question:', e);
      setCurrentExamQuestions(prev => {
        const exists = prev.some(q => q.id === question.id);
        return exists ? prev.map(q => q.id === question.id ? question : q) : [question, ...prev];
      });
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!activeExamForQuestions) return;
    const examId = activeExamForQuestions.id;

    try {
      await deleteDoc(doc(db, 'exams', examId, 'questions', qId));
    } catch (e) {
      console.error('Error deleting question:', e);
      setCurrentExamQuestions(prev => prev.filter(q => q.id !== qId));
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!activeExamForQuestions) return;
    const examId = activeExamForQuestions.id;

    for (const q of currentExamQuestions) {
      try {
        await deleteDoc(doc(db, 'exams', examId, 'questions', q.id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleBulkImport = async (questions: Question[]) => {
    if (!activeExamForQuestions) return;
    const examId = activeExamForQuestions.id;

    for (const q of questions) {
      try {
        await setDoc(doc(db, 'exams', examId, 'questions', q.id), q);
      } catch (e) {
        console.error('Bulk import item error:', e);
      }
    }
  };

  // Users Handlers
  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'student') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error('Error updating user role:', e);
    }
  };

  const handleSendDirectMessage = async (userId: string, messageText: string, subjectText: string) => {
    try {
      const msgId = 'msg_' + Date.now();
      await setDoc(doc(db, 'messages', msgId), {
        id: msgId,
        userId,
        userName: users.find(u => u.id === userId)?.name || 'طالب',
        userEmail: users.find(u => u.id === userId)?.email || '',
        subject: subjectText,
        message: messageText,
        createdAt: new Date(),
        isRead: false,
        isFromAdmin: true,
        isReadByStudent: false,
      });
    } catch (e) {
      console.error('Error sending direct message:', e);
      throw e;
    }
  };

  // Feedback Handlers
  const handleResolveFeedback = async (
    feedbackId: string,
    replyMessage?: string,
    replyImageUrl?: string,
    replyAudioUrl?: string
  ) => {
    const updateData: any = {
      status: 'resolved' as const,
      isReadByAdmin: true,
      isReadByStudent: false,
      adminReply: replyMessage || 'تم مراجعة السؤال وتصحيحه بنجاح، شكراً لملاحظتك القيمة.',
    };
    if (replyImageUrl) updateData.adminReplyImageUrl = replyImageUrl;
    if (replyAudioUrl) updateData.adminReplyAudioUrl = replyAudioUrl;
    try {
      await updateDoc(doc(db, 'question_feedbacks', feedbackId), updateData);
    } catch (e) {
      console.error(e);
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, ...updateData } : f));
    }
  };

  const handleRejectFeedback = async (feedbackId: string) => {
    const updateData: { status: 'rejected'; isReadByAdmin: boolean } = { status: 'rejected', isReadByAdmin: true };
    try {
      await updateDoc(doc(db, 'question_feedbacks', feedbackId), updateData);
    } catch (e) {
      console.error(e);
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, ...updateData } : f));
    }
  };

  // App Config Handler
  const handleSaveAppConfig = async (newConfig: AppConfig) => {
    try {
      await setDoc(doc(db, 'settings', 'app_config'), newConfig);
      setAppConfig(newConfig);
    } catch (e) {
      console.error('Error saving app config:', e);
      throw e;
    }
  };

  // If loading auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated
  if (!currentUser && !bypassAuth) {
    return (
      <LoginView
        onSuccess={() => {}}
      />
    );
  }

  const pendingFeedbacks = feedbacks.filter(f => f.status === 'pending' || (!f.status && !f.isReadByAdmin)).length;
  const unreadMessagesCount = messages.filter(m => !m.isRead && !m.adminReply).length;

  const dashboardStats: DashboardStats = {
    totalStudents: users.length,
    totalExams: exams.length,
    totalQuestions: exams.reduce((acc, curr) => acc + (curr.questionsCount || 0), 0),
    pendingFeedbacks,
    totalSubjects: subjects.length,
    unreadMessages: unreadMessagesCount,
    totalPdfExams: exams.filter(e => e.isPdf).length,
  };

  const getPageTitle = (idx: number) => {
    switch (idx) {
      case 0: return 'لوحة تحكم الإدارة';
      case 1: return 'إدارة المواد الدراسية';
      case 2: return 'اختبارات قبول الجامعات';
      case 3: return 'المسابقات والتحديات';
      case 4: return 'إدارة الأعوام الدراسية';
      case 5: return 'إدارة الاختبارات الوزارية';
      case 6: return 'نماذج الـ PDF الرسمية';
      case 7: return 'سجل نتائج الطلاب والتقارير';
      case 8: return 'صندوق ملاحظات واعتراضات الطلاب';
      case 9: return 'إدارة الطلاب والمستخدمين';
      case 10: return 'الإشعارات والتنبيهات الفورية';
      case 11: return 'رسائل الطلاب المباشرة';
      case 12: return 'المحتوى التعليمي والملازم';
      case 13: return 'الصفوف والمراحل الدراسية';
      case 14: return 'إعدادات التطبيق والصيانة';
      case 15: return 'لوحة الصدارة';
      default: return 'لوحة التحكم';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-cairo" dir="rtl">
      {/* Sidebar matching Flutter Drawer / NavigationRail */}
      <Sidebar
        selectedIndex={selectedIndex}
        onSelectIndex={(idx) => {
          setSelectedIndex(idx);
          setActiveExamForQuestions(null);
        }}
        unreadFeedbacksCount={pendingFeedbacks}
        unreadMessagesCount={unreadMessagesCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isFirebaseConnected={!firestoreError}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50/70">
        <Header
          title={getPageTitle(selectedIndex)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onRefreshData={handleRefresh}
          isRefreshing={isRefreshing || isLoadingData}
          currentUserEmail={currentUser?.email}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-5 sm:p-7 w-full max-w-7xl mx-auto space-y-6">
          {/* Firestore Security Rules Alert Banner if permission denied */}
          {firestoreError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block text-sm">تنبيه أذونات قاعدة بيانات فايربيس</span>
                  <span className="text-amber-800 mt-0.5 block leading-relaxed">{firestoreError}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setBypassAuth(false);
                  setCurrentUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shrink-0 shadow-xs"
              >
                تسجيل الدخول كمسؤول
              </button>
            </div>
          )}

          {/* If viewing questions for a specific exam inside Index 5 */}
          {activeExamForQuestions ? (
            <QuestionsView
              exam={activeExamForQuestions}
              questions={currentExamQuestions}
              onBack={() => setActiveExamForQuestions(null)}
              onOpenAddQuestion={() => {
                setEditingQuestion(null);
                setIsQuestionEditorOpen(true);
              }}
              onOpenEditQuestion={(q) => {
                setEditingQuestion(q);
                setIsQuestionEditorOpen(true);
              }}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
              onDeleteQuestion={handleDeleteQuestion}
              onDeleteAllQuestions={handleDeleteAllQuestions}
            />
          ) : (
            <>
              {selectedIndex === 0 && (
                <OverviewView
                  stats={dashboardStats}
                  users={users}
                  results={results}
                  feedbacks={feedbacks}
                  onNavigateIndex={setSelectedIndex}
                  isLoading={isLoadingData}
                />
              )}

              {selectedIndex === 1 && (
                <SubjectsView
                  subjects={subjects}
                  grades={grades}
                  onAddSubject={handleAddSubject}
                  onUpdateSubject={handleUpdateSubject}
                  onDeleteSubject={handleDeleteSubject}
                />
              )}

              {selectedIndex === 2 && <AdmissionView />}
              {selectedIndex === 3 && <CompetitionsView />}

              {selectedIndex === 4 && (
                <AcademicYearsView
                  years={years}
                  onAddYear={handleAddYear}
                  onUpdateYear={handleUpdateYear}
                  onDeleteYear={handleDeleteYear}
                />
              )}

              {selectedIndex === 5 && (
                <ExamsView
                  exams={exams}
                  subjects={subjects}
                  years={years}
                  grades={grades}
                  questionsMap={{}}
                  onAddExam={handleAddExam}
                  onDeleteExam={handleDeleteExam}
                  onBulkDeleteExams={handleBulkDeleteExams}
                  onOpenQuestions={(exam) => setActiveExamForQuestions(exam)}
                />
              )}

              {selectedIndex === 6 && (
                <PdfExamsView
                  exams={exams}
                  subjects={subjects}
                  years={years}
                  grades={grades}
                  onAddExam={handleAddExam}
                  onDeleteExam={handleDeleteExam}
                />
              )}

              {selectedIndex === 7 && (
                <ResultsView
                  results={results}
                  users={users}
                />
              )}

              {selectedIndex === 8 && (
                <FeedbacksView
                  feedbacks={feedbacks}
                  users={users}
                  onResolveFeedback={handleResolveFeedback}
                  onRejectFeedback={handleRejectFeedback}
                  onEditQuestion={(qId) => {
                    const found = currentExamQuestions.find(q => q.id === qId);
                    setEditingQuestion(found || {
                      id: qId,
                      text: '',
                      type: 'mcq',
                      options: ['', '', '', ''],
                      correctAnswerIndex: 0,
                    });
                    setIsQuestionEditorOpen(true);
                  }}
                />
              )}

              {selectedIndex === 9 && (
                <UsersView
                  users={users}
                  onUpdateRole={handleUpdateUserRole}
                  onSendDirectMessage={handleSendDirectMessage}
                />
              )}

              {selectedIndex === 10 && <NotificationsView />}
              {selectedIndex === 11 && <MessagesView users={users} />}
              {selectedIndex === 12 && <MaterialsView subjects={subjects} grades={grades} years={years} />}
              
              {selectedIndex === 13 && (
                <GradesView
                  grades={grades}
                  onAddGrade={handleAddGrade}
                  onUpdateGrade={handleUpdateGrade}
                  onDeleteGrade={handleDeleteGrade}
                />
              )}

              {selectedIndex === 14 && (
                <SettingsView
                  config={appConfig}
                  onSaveConfig={handleSaveAppConfig}
                />
              )}

              {selectedIndex === 15 && (
                <LeaderboardView
                  results={results}
                  users={users}
                  grades={grades}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Question Editor Modal */}
      <QuestionEditorModal
        isOpen={isQuestionEditorOpen}
        onClose={() => setIsQuestionEditorOpen(false)}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        examTitle={activeExamForQuestions?.title}
      />

      {/* Global Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        examTitle={activeExamForQuestions?.title}
      />
    </div>
  );
};

export default App;
