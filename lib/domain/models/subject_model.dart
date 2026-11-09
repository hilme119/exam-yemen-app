class SubjectModel {
  final String id;
  final String name;
  final String grade;
  final String? stream;
  final String? imageUrl;
  final DateTime? createdAt;

  SubjectModel({
    required this.id,
    required this.name,
    required this.grade,
    this.stream,
    this.imageUrl,
    this.createdAt,
  });

  factory SubjectModel.fromJson(Map<String, dynamic> json) {
    return SubjectModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      grade: json['grade'] as String? ?? '',
      stream: json['stream'] as String?,
      imageUrl: json['imageUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'grade': grade,
      if (stream != null) 'stream': stream,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SubjectModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
