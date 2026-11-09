// Comprehensive TypeScript Data Types for ExamYemen Admin Web

export interface PredefinedGrade {
  id: string;
  stream: string | null;
  name: string;
  label?: string;
  gradeId?: string;
  streamId?: string | null;
}

export const PREDEFINED_GRADES: PredefinedGrade[] = [
  { id: 'grade9', stream: null, name: 'الصف التاسع الأساسي', label: 'الصف التاسع الأساسي', gradeId: 'grade9', streamId: null },
  { id: 'grade9', stream: 'english', name: 'التاسع - قسم إنجليزي', label: 'التاسع - قسم إنجليزي', gradeId: 'grade9', streamId: 'english' },
  { id: 'grade12', stream: 'scientific', name: 'الثالث الثانوي - علمي', label: 'الثالث الثانوي - علمي', gradeId: 'grade12', streamId: 'scientific' },
  { id: 'grade12', stream: 'literary', name: 'الثالث الثانوي - أدبي', label: 'الثالث الثانوي - أدبي', gradeId: 'grade12', streamId: 'literary' },
  { id: 'grade12', stream: 'scientific_english', name: 'الثالث الثانوي - علمي (إنجليزي)', label: 'الثالث الثانوي - علمي (إنجليزي)', gradeId: 'grade12', streamId: 'scientific_english' },
  { id: 'grade12', stream: 'literary_english', name: 'الثالث الثانوي - أدبي (إنجليزي)', label: 'الثالث الثانوي - أدبي (إنجليزي)', gradeId: 'grade12', streamId: 'literary_english' },
];

export interface GradeItem {
  id: string;
  name: string;
  iconName?: string;
  colorHex?: string;
  order: number;
  hasStreams: boolean;
  streams?: string[];
}

export interface Subject {
  id: string;
  name: string;
  grade: string; // 'grade9' | 'grade12'
  stream?: string | null; // 'scientific' | 'literary' | 'english' | null
  imageUrl?: string | null;
  iconName?: string;
  createdAt?: string;
  order?: number;
}

export interface AcademicYear {
  id: string;
  yearLabel: string;
  year?: string;
  isActive?: boolean;
}

export type QuestionType = 'mcq' | 'trueFalse';

export interface Question {
  id: string;
  text: string;
  questionImageUrl?: string | null;
  type: QuestionType;
  options: string[];
  optionsImageUrls?: (string | null)[];
  correctAnswerIndex: number;
  explanation?: string;
  fontFamily?: string | null;
  optionsFontFamilies?: (string | null)[];
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  academicYear: string;
  year?: string;
  grade?: string;
  stream?: string | null;
  isPdf?: boolean;
  pdfUrl?: string | null;
  subjectName?: string | null;
  gradeName?: string | null;
  durationMinutes?: number;
  questionsCount?: number;
  createdAt?: string;
}

export interface QuestionFeedback {
  id: string;
  examId: string;
  examTitle?: string;
  examName?: string;
  questionId: string;
  questionNumber?: number;
  questionText?: string;
  studentId?: string;
  userId?: string;
  studentName?: string;
  userName?: string;
  gradeName?: string;
  subjectName?: string;
  note?: string;
  message?: string;
  userComment?: string;
  createdAt: any;
  status?: 'pending' | 'resolved' | 'rejected';
  imageUrl?: string;
  audioUrl?: string;
  adminReply?: string;
  adminReplyImageUrl?: string;
  adminReplyAudioUrl?: string;
  isReadByAdmin: boolean;
  isReadByStudent?: boolean;
  isStarred?: boolean;
}

export interface StudentResult {
  id: string;
  userId: string;
  studentName?: string;
  userName?: string;
  userEmail?: string;
  examId: string;
  examTitle: string;
  examName?: string;
  subjectName?: string;
  gradeName?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: any;
  dateTaken?: any;
  createdAt?: any;
  userAnswers?: Record<string, number>;
  selectedAnswers?: Record<string, any>;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  gradeLevel?: string;
  grade?: string;
  governorate?: string;
  profilePictureUrl?: string | null;
  fcmToken?: string | null;
  createdAt?: any;
  lastActive?: any;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentName?: string;
  studentEmail?: string;
  subject: string;
  message: string;
  createdAt: any;
  repliedAt?: any;
  isRead: boolean;
  isFromAdmin?: boolean;
  isReadByStudent?: boolean;
  adminReply?: string;
  imageUrl?: string;
  audioUrl?: string;
  adminReplyImageUrl?: string;
  adminReplyAudioUrl?: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  grade: string;
  academicYear?: string;
  type: 'summary' | 'video' | 'book' | 'worksheet' | 'pdf' | 'exam';
  url?: string;
  fileUrl?: string;
  description?: string;
  fileSize?: string;
  sizeBytes?: number;
  views?: number;
  downloads?: number;
  createdAt?: any;
}

export interface AdmissionUniversity {
  id: string;
  name: string;
  location?: string;
  city?: string;
  imageUrl?: string;
  order?: number;
  majorsCount?: number;
}
export type UniversityAdmission = AdmissionUniversity;

export interface AdmissionMajor {
  id: string;
  universityId: string;
  name: string;
  order?: number;
}

export interface AdmissionSubject {
  id: string;
  majorId: string;
  name: string;
  order?: number;
}

export interface AdmissionExam {
  id: string;
  admissionSubjectId?: string;
  subjectId?: string;
  title: string;
  academicYear: string;
  year?: string;
  durationMinutes?: number;
  questionsCount?: number;
  isPdf?: boolean;
  pdfUrl?: string;
}

export interface CompetitionSemester {
  id: string;
  name: string;
  order?: number;
  isActive?: boolean;
}

export interface CompetitionSubject {
  id: string;
  semesterId: string;
  name: string;
  order?: number;
  grade?: string;
}

export interface CompetitionExam {
  id: string;
  competitionSubjectId?: string;
  subjectId?: string;
  title: string;
  academicYear?: string;
  durationMinutes?: number;
  questionsCount?: number;
  points?: number;
  isActive?: boolean;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  participantsCount: number;
  status: 'upcoming' | 'active' | 'ended';
  prizes?: string;
}

export interface AppConfig {
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  totalQuestions: number;
  pendingFeedbacks: number;
  totalSubjects: number;
  unreadMessages: number;
  totalPdfExams: number;
}
