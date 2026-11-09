import 'student_grade_level.dart';

enum UserRole { admin, student }

class UserModel {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String? profilePictureUrl;
  final StudentGradeLevel? gradeLevel;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.profilePictureUrl,
    this.gradeLevel,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] == 'admin' ? UserRole.admin : UserRole.student,
      profilePictureUrl: json['profilePictureUrl'] as String?,
      gradeLevel: json['gradeLevel'] != null
          ? StudentGradeLevel.fromString(json['gradeLevel'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role.name,
      if (profilePictureUrl != null) 'profilePictureUrl': profilePictureUrl,
      if (gradeLevel != null) 'gradeLevel': gradeLevel!.name,
    };
  }
}
