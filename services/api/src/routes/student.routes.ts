import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';

const router = Router();

// 1. Get Subjects by Grade
router.get('/subjects', async (req: Request, res: Response) => {
  try {
    const { grade } = req.query;
    let query: FirebaseFirestore.Query = db.collection('subjects');
    if (grade) {
      query = query.where('grade', '==', grade);
    }
    const snap = await query.get();
    const subjects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Available Exams for a Subject
router.get('/exams', async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.query;
    let query: FirebaseFirestore.Query = db.collection('exams');
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    const snap = await query.get();
    const exams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: exams });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Exam Questions (for student solving session)
router.get('/exams/:id/questions', async (req: Request, res: Response) => {
  try {
    const examId = String(req.params.id);
    const isPracticeMode = req.query.practice === 'true';

    const snap = await db.collection('exams').doc(examId).collection('questions').get();
    const questions = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        type: data.type,
        options: data.options,
        questionImageUrl: data.questionImageUrl,
        // In actual timed test, keep correctAnswer hidden until submission
        ...(isPracticeMode && {
          correctAnswerIndex: data.correctAnswerIndex,
          explanation: data.explanation,
        }),
      };
    });

    res.json({ success: true, data: questions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Submit Exam Answers & Calculate Score
router.post('/exams/:id/submit', async (req: Request, res: Response) => {
  try {
    const examId = String(req.params.id);
    const { studentId, studentName, studentGrade, userAnswers } = req.body;
    // userAnswers: Record<questionId, selectedOptionIndex>

    const snap = await db.collection('exams').doc(examId).collection('questions').get();
    let totalQuestions = snap.docs.length;
    let correctAnswersCount = 0;
    const detailedReview: any[] = [];

    snap.docs.forEach(doc => {
      const q = doc.data();
      const studentChoice = userAnswers[doc.id];
      const isCorrect = studentChoice === q.correctAnswerIndex;

      if (isCorrect) correctAnswersCount++;

      detailedReview.push({
        questionId: doc.id,
        text: q.text,
        studentChoice,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const percentage = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
    const isPassed = percentage >= 50;

    const resultDoc = {
      examId,
      studentId: studentId || 'guest',
      studentName: studentName || 'طالب مجهول',
      studentGrade: studentGrade || '',
      score: correctAnswersCount,
      totalQuestions,
      percentage,
      isPassed,
      createdAt: new Date().toISOString(),
    };

    // Save result in Firestore
    const resRef = await db.collection('results').add(resultDoc);

    res.json({
      success: true,
      resultId: resRef.id,
      summary: {
        score: correctAnswersCount,
        totalQuestions,
        percentage,
        isPassed,
      },
      review: detailedReview,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Submit Question Objection / Feedback
router.post('/feedbacks', async (req: Request, res: Response) => {
  try {
    const { examId, examTitle, questionId, questionText, studentId, studentName, userComment } = req.body;
    const docData = {
      examId,
      examTitle: examTitle || '',
      questionId,
      questionText: questionText || '',
      studentId: studentId || 'anonymous',
      studentName: studentName || 'طالب',
      userComment,
      status: 'pending',
      isReadByAdmin: false,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('question_feedbacks').add(docData);
    res.json({ success: true, id: ref.id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Leaderboard (أوائل الجمهورية)
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('results')
      .orderBy('percentage', 'desc')
      .limit(20)
      .get();

    const leaders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: leaders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

