import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  final db = FirebaseFirestore.instance;

  await db.collection('app_config').doc('version_info').set({
    'latestVersion': '1.0.4',
    'forceUpdate': false,
    'updateUrl': 'https://yemen-national-exam-system.web.app/ExamYemen.apk',
    'releaseNotes':
        'تحديث جديد يضم:\n- المرشد التفاعلي للاستخدام\n- حل مشكلة الأزرار الافتتاحية\n- القدرة على مراسلة الإدارة\n- تصحيح لغة وأرقام التواريخ',
  }, SetOptions(merge: true));

  print('Successfully updated the Firebase DB to version 1.0.4!');
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Center(
          child: Text('Done updating Firebase version info to 1.0.4'),
        ),
      ),
    ),
  );
}
