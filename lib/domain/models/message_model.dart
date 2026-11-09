import 'package:cloud_firestore/cloud_firestore.dart';

class MessageModel {
  final String id;
  final String userId;
  final String userName;
  final String userEmail;
  final String subject;
  final String message;
  final String? imageUrl;
  final String? audioUrl;
  final Timestamp createdAt;
  final bool isRead;
  final String? adminReply;
  final String? adminReplyImageUrl;
  final String? adminReplyAudioUrl;
  final Timestamp? repliedAt;
  final bool isReadByStudent;
  final bool isFromAdmin;

  MessageModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userEmail,
    required this.subject,
    required this.message,
    this.imageUrl,
    this.audioUrl,
    required this.createdAt,
    this.isRead = false,
    this.adminReply,
    this.adminReplyImageUrl,
    this.adminReplyAudioUrl,
    this.repliedAt,
    this.isReadByStudent = false,
    this.isFromAdmin = false,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json, String id) {
    return MessageModel(
      id: id,
      userId: json['userId'] as String? ?? '',
      userName: json['userName'] as String? ?? '',
      userEmail: json['userEmail'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      message: json['message'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      audioUrl: json['audioUrl'] as String?,
      createdAt: json['createdAt'] as Timestamp? ?? Timestamp.now(),
      isRead: json['isRead'] as bool? ?? false,
      adminReply: json['adminReply'] as String?,
      adminReplyImageUrl: json['adminReplyImageUrl'] as String?,
      adminReplyAudioUrl: json['adminReplyAudioUrl'] as String?,
      repliedAt: json['repliedAt'] as Timestamp?,
      isReadByStudent: json['isReadByStudent'] as bool? ?? false,
      isFromAdmin: json['isFromAdmin'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'userName': userName,
      'userEmail': userEmail,
      'subject': subject,
      'message': message,
      if (imageUrl != null && imageUrl!.isNotEmpty) 'imageUrl': imageUrl,
      if (audioUrl != null && audioUrl!.isNotEmpty) 'audioUrl': audioUrl,
      'createdAt': createdAt,
      'isRead': isRead,
      if (adminReply != null && adminReply!.isNotEmpty) 'adminReply': adminReply,
      if (adminReplyImageUrl != null && adminReplyImageUrl!.isNotEmpty) 'adminReplyImageUrl': adminReplyImageUrl,
      if (adminReplyAudioUrl != null && adminReplyAudioUrl!.isNotEmpty) 'adminReplyAudioUrl': adminReplyAudioUrl,
      if (repliedAt != null) 'repliedAt': repliedAt,
      'isReadByStudent': isReadByStudent,
      'isFromAdmin': isFromAdmin,
    };
  }
}
