import { Router, Response } from 'express';
import { db, messaging } from '../config/firebase';
import { AuthenticatedRequest, authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// In production, enable: router.use(authenticateToken, requireAdmin);
// For dev / initial wiring, we provide direct endpoints with fallback

// 1. Dashboard Statistics
router.get('/stats', async (_req, res: Response) => {
  try {
    const [studentsSnap, examsSnap, subjectsSnap, feedbacksSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'student').count().get(),
      db.collection('exams').count().get(),
      db.collection('subjects').count().get(),
      db.collection('question_feedbacks').where('status', '==', 'pending').count().get(),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents: studentsSnap.data().count,
        totalExams: examsSnap.data().count,
        totalSubjects: subjectsSnap.data().count,
        pendingFeedbacks: feedbacksSnap.data().count,
        totalQuestions: 1540,
        unreadMessages: 2,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Subjects Management
router.get('/subjects', async (_req, res: Response) => {
  try {
    const snap = await db.collection('subjects').get();
    const subjects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/subjects', async (req, res: Response) => {
  try {
    const { id, name, grade, stream, imageUrl } = req.body;
    const subjectId = id || 'sub_' + Date.now();
    const data = {
      name,
      grade,
      stream: stream || null,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
    };
    await db.collection('subjects').doc(subjectId).set(data);
    res.json({ success: true, data: { id: subjectId, ...data } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Exams & Questions Management
router.get('/exams', async (req, res: Response) => {
  try {
    const { subjectId, academicYear } = req.query;
    let queryRef: FirebaseFirestore.Query = db.collection('exams');

    if (subjectId) queryRef = queryRef.where('subjectId', '==', subjectId);
    if (academicYear) queryRef = queryRef.where('academicYear', '==', academicYear);

    const snap = await queryRef.get();
    const exams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: exams });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/exams', async (req, res: Response) => {
  try {
    const { id, title, subjectId, academicYear, durationMinutes, subjectName, gradeName } = req.body;
    const examId = id || 'exam_' + Date.now();
    const data = {
      title,
      subjectId,
      academicYear,
      durationMinutes: durationMinutes || 60,
      subjectName,
      gradeName,
      questionsCount: 0,
      createdAt: new Date().toISOString(),
    };
    await db.collection('exams').doc(examId).set(data);
    res.json({ success: true, data: { id: examId, ...data } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/exams/:id/questions', async (req, res: Response) => {
  try {
    const examId = String(req.params.id);
    const snap = await db.collection('exams').doc(examId).collection('questions').get();
    const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: questions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/exams/:id/questions', async (req, res: Response) => {
  try {
    const examId = String(req.params.id);
    const { id, text, type, options, correctAnswerIndex, explanation, questionImageUrl } = req.body;
    const questionId = id || 'q_' + Date.now();
    const data = {
      text,
      type: type || 'mcq',
      options: options || [],
      correctAnswerIndex: correctAnswerIndex ?? 0,
      explanation: explanation || null,
      questionImageUrl: questionImageUrl || null,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('exams').doc(examId).collection('questions').doc(questionId).set(data);
    res.json({ success: true, data: { id: questionId, ...data } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk Import Questions
router.post('/exams/:id/bulk-questions', async (req, res: Response) => {
  try {
    const examId = String(req.params.id);
    const questions: any[] = req.body.questions || [];

    if (!questions.length) {
      res.status(400).json({ success: false, message: 'قائمة الأسئلة فارغة' });
      return;
    }

    const batch = db.batch();
    const examRef = db.collection('exams').doc(examId);

    questions.forEach((q, idx) => {
      const qId = q.id || `q_bulk_${Date.now()}_${idx}`;
      const qRef = examRef.collection('questions').doc(qId);
      batch.set(qRef, {
        text: q.text,
        type: q.type || 'mcq',
        options: q.options || [],
        correctAnswerIndex: q.correctAnswerIndex ?? 0,
        explanation: q.explanation || null,
        questionImageUrl: q.questionImageUrl || null,
        createdAt: new Date().toISOString(),
      });
    });

    await batch.commit();

    // Update questionsCount in exam doc
    await examRef.update({
      questionsCount: adminIncrement(questions.length),
    });

    res.json({ success: true, count: questions.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Notifications Broadcast (FCM)
router.post('/notifications/broadcast', async (req, res: Response) => {
  try {
    const { title, body, topic } = req.body;
    const targetTopic = topic || 'all_students';

    const messagePayload = {
      notification: { title, body },
      topic: targetTopic,
    };

    await messaging.send(messagePayload);
    res.json({ success: true, message: 'تم إرسال الإشعار بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. App Config & Maintenance
router.get('/config', async (_req, res: Response) => {
  try {
    const docSnap = await db.collection('config').doc('app_config').get();
    if (!docSnap.exists) {
      res.json({
        success: true,
        data: {
          minAppVersion: '2.0.0',
          latestAppVersion: '2.0.1',
          isMaintenanceMode: false,
          maintenanceMessage: '',
        }
      });
      return;
    }
    res.json({ success: true, data: docSnap.data() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/config', async (req, res: Response) => {
  try {
    await db.collection('config').doc('app_config').set(req.body, { merge: true });
    res.json({ success: true, data: req.body });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function adminIncrement(val: number) {
  // Helper for Firestore increment
  const { FieldValue } = require('firebase-admin/firestore');
  return FieldValue.increment(val);
}

export default router;

