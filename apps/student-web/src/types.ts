export interface StudentUser {
  id: string;
  name: string;
  email: string;
  gradeLevel?: 'grade9' | 'grade12_sci' | 'grade12_lit';
  gradeName?: string;
  points?: number;
  isGuest?: boolean;
  avatarUrl?: string;
}

export interface SubjectModel {
  id: string;
  name: string;
  grade: string; // 'grade9', 'grade12'
  stream?: string; // 'scientific', 'literary'
  imageUrl?: string;
  order?: number;
}

export interface ExamModel {
  id: string;
  subjectId: string;
  title: string;
  academicYear: string;
  isPdf: boolean;
  pdfUrl?: string;
  subjectName?: string;
  gradeName?: string;
  questionsCount?: number;
  durationMinutes?: number;
}

export interface QuestionModel {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  hint?: string;
  questionImageUrl?: string;
  optionsImageUrls?: string[];
  optionsFontFamilies?: string[];
  fontFamily?: string;
}

export interface ResultModel {
  id: string;
  userId: string;
  examId: string;
  score: number;
  totalQuestions: number;
  dateTaken: any; // Timestamp or ISO string
  selectedAnswers: Record<string, number>;
  subjectName?: string;
  examName?: string;
  percentage?: number;
  studentGrade?: string;
  durationSeconds?: number;
}

export interface UniversityModel {
  id: string;
  name: string;
  logoUrl?: string;
  city?: string;
  description?: string;
  order?: number;
}

export interface MajorModel {
  id: string;
  universityId: string;
  name: string;
  facultyName?: string;
}

export interface AdmissionExamModel {
  id: string;
  universityId: string;
  majorId: string;
  subjectId: string;
  title: string;
  academicYear: string;
  questionsCount?: number;
  durationMinutes?: number;
}

export interface CompetitionExamModel {
  id: string;
  title: string;
  semesterId: string;
  subjectId: string;
  pointsAwarded: number;
  durationMinutes: number;
  questionsCount?: number;
}

export interface GradeModel {
  id: string;
  name: string;
  order?: number;
  hasStreams?: boolean;
  streams?: string[];
}

export interface AcademicYearModel {
  id: string;
  yearLabel: string;
  isCurrent?: boolean;
}

export interface LearningMaterialModel {
  id: string;
  subjectId: string;
  title: string;
  pdfUrl?: string;
  url?: string;
  fileUrl?: string;
  grade?: string;
  gradeId?: string;
  academicYear?: string;
  type?: string;
  description?: string;
  fileSizeBytes?: number;
}

export interface QuestionFeedbackModel {
  id: string;
  userId: string;
  userName: string;
  examId: string;
  examName: string;
  gradeName?: string;
  subjectName?: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  note: string;
  imageUrl?: string;
  audioUrl?: string;
  adminReply?: string;
  adminReplyImageUrl?: string;
  adminReplyAudioUrl?: string;
  createdAt: any;
  status?: 'pending' | 'resolved' | 'rejected';
  isReadByAdmin?: boolean;
  isReadByStudent?: boolean;
  isStarred?: boolean;
}

