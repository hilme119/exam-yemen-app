class AcademicYearModel {
  final String id;
  final String yearLabel; // e.g., "2024-2025"
  final bool isArchived;

  AcademicYearModel({
    required this.id,
    required this.yearLabel,
    this.isArchived = false,
  });

  factory AcademicYearModel.fromJson(Map<String, dynamic> json) {
    return AcademicYearModel(
      id: json['id'] as String? ?? '',
      yearLabel: json['yearLabel'] as String? ?? '',
      isArchived: json['isArchived'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'yearLabel': yearLabel, 'isArchived': isArchived};
  }
}
