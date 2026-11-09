import 'package:firedart/firedart.dart';

void main() async {
  Firestore.initialize('yemen-national-exam-system');
  
  // Since we don't have straightforward admin SDK for Dart, 
  // and we don't want to mess up user's PC with Node.js/Firestore rules right now
  // Lets do it via a quick node script if possible, or just tell the user to do it in Firebase Console.
}
