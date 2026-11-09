const admin = require('firebase-admin');

// Ensure you replace this path with the actual path to your service account key if it's different.
// The user previously had a file that looked like 'exam-yemen-firebase-adminsdk.json' but the python script failed. Let's try to find it.
const serviceAccount = require('./exam-yemen-national-system-firebase-adminsdk-32oal-dedae74d4c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAppConfig() {
  const docRef = db.collection('settings').doc('app_config');
  
  await docRef.set({
    latestVersion: '1.0.4', 
    forceUpdate: false,
    downloadUrl: 'https://github.com/hilme119/exam-yemen-app/releases/latest/download/ExamYemen.apk',
    releaseNotes: 'تحديث جديد يضم:\n- المرشد التفاعلي للاستخدام\n- حل مشكلة الأزرار الافتتاحية\n- القدرة على مراسلة الإدارة\n- تصحيح لغة وأرقام التواريخ'
  }, { merge: true });

  console.log('Successfully updated app_config in Firestore!');
}

updateAppConfig().catch(console.error);
