const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Common function to send notification to a specific user token
async function sendToUserToken(userId, title, body) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log(`User document not found for ID: ${userId}`);
      return;
    }
    
    const userData = userDoc.data();
    const token = userData ? userData.fcmToken : null;
    
    if (!token) {
      console.log(`No FCM token found for user ID: ${userId}`);
      return;
    }
    
    const payload = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      android: {
        notification: {
          channelId: 'examyemen_notifications',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };
    
    await admin.messaging().send(payload);
    console.log(`Successfully sent notification to user ${userId}`);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

// Common function to send notification to a topic
async function sendToTopic(topic, title, body) {
  const payload = {
    topic: topic,
    notification: {
      title: title,
      body: body,
    },
    android: {
      notification: {
        channelId: 'examyemen_notifications',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };
  
  try {
    await admin.messaging().send(payload);
    console.log(`Successfully sent notification to topic: ${topic}`);
  } catch (error) {
    console.error(`Error sending notification to topic ${topic}:`, error);
  }
}

// 1. Triggered when a message is created (Student to Admin OR Admin Direct Message to Student)
exports.onMessageCreated = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    if (!message) return null;

    const isFromAdmin = message.isFromAdmin === true;
    const userId = message.userId; // This is the student's ID
    const senderName = message.userName || 'طالب';
    const subject = message.subject || 'موضوع غير محدد';
    const text = message.message || '';

    if (isFromAdmin) {
      // Message from Admin to Student
      // Notify the specific student
      await sendToUserToken(
        userId,
        'رسالة جديدة من الإدارة',
        `${subject}: ${text.substring(0, 100)}`
      );
    } else {
      // Message from Student to Admin
      // Notify the admins topic
      await sendToTopic(
        'admins',
        `رسالة جديدة من ${senderName}`,
        `${subject}: ${text.substring(0, 100)}`
      );
    }
    return null;
  });

// 2. Triggered when a message is updated (e.g. Admin replies to a student message)
exports.onMessageUpdated = functions.firestore
  .document('messages/{messageId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) return null;

    // Check if admin reply was newly added or modified
    const hadReply = beforeData.adminReply !== undefined && beforeData.adminReply !== null;
    const hasReply = afterData.adminReply !== undefined && afterData.adminReply !== null;
    const replyChanged = beforeData.adminReply !== afterData.adminReply;

    if (hasReply && (!hadReply || replyChanged)) {
      // Admin replied to student message
      // Notify the student (userId is the student ID)
      const userId = afterData.userId;
      const subject = afterData.subject || 'موضوع غير محدد';
      const replyText = afterData.adminReply || '';

      await sendToUserToken(
        userId,
        'رد جديد من الإدارة',
        `على موضوع (${subject}): ${replyText.substring(0, 100)}`
      );
    }
    return null;
  });

// 3. Triggered when student feedback is created (Student feedback on a question)
exports.onFeedbackCreated = functions.firestore
  .document('question_feedbacks/{feedbackId}')
  .onCreate(async (snap, context) => {
    const feedback = snap.data();
    if (!feedback) return null;

    const senderName = feedback.userName || 'طالب';
    const subjectName = feedback.subjectName || '';
    const note = feedback.note || '';

    await sendToTopic(
      'admins',
      `ملاحظة جديدة على سؤال (${subjectName})`,
      `${senderName}: ${note.substring(0, 100)}`
    );
    return null;
  });

// 4. Triggered when student feedback is updated (e.g. Admin replies to question feedback)
exports.onFeedbackUpdated = functions.firestore
  .document('question_feedbacks/{feedbackId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) return null;

    // Check if admin reply was newly added or modified
    const hadReply = beforeData.adminReply !== undefined && beforeData.adminReply !== null;
    const hasReply = afterData.adminReply !== undefined && afterData.adminReply !== null;
    const replyChanged = beforeData.adminReply !== afterData.adminReply;

    if (hasReply && (!hadReply || replyChanged)) {
      // Admin replied to feedback
      // Notify the student
      const userId = afterData.userId;
      const replyText = afterData.adminReply || '';
      const subjectName = afterData.subjectName || '';

      await sendToUserToken(
        userId,
        'رد جديد على ملاحظتك',
        `على سؤال (${subjectName}): ${replyText.substring(0, 100)}`
      );
    }
    return null;
  });
