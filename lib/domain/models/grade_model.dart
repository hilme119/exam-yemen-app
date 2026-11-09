class GradeModel {
  final String id;
  final String name;
  final String iconName; // e.g. "looks_one_rounded" to render an icon
  final String colorHex; // e.g. "FF00BCD4"
  final int order;
  final bool hasStreams; // if true, it uses streams
  final List<String>?
  streams; // e.g. ["scientific", "literary"] OR ["علمي", "أدبي"]

  GradeModel({
    required this.id,
    required this.name,
    this.iconName = 'school_rounded',
    this.colorHex = 'FF00BCD4', // Default Cyan
    required this.order,
    this.hasStreams = false,
    this.streams,
  });

  factory GradeModel.fromJson(Map<String, dynamic> json) {
    return GradeModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      iconName: json['iconName'] as String? ?? 'school_rounded',
      colorHex: json['colorHex'] as String? ?? 'FF00BCD4',
      order: json['order'] as int? ?? 0,
      hasStreams: json['hasStreams'] as bool? ?? false,
      streams: (json['streams'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'iconName': iconName,
      'colorHex': colorHex,
      'order': order,
      'hasStreams': hasStreams,
      'streams': streams,
    };
  }
}
