enum QuestionType { mcq, trueFalse }

class QuestionModel {
  final String id;
  final String text;
  final String? questionImageUrl;
  final QuestionType type;
  final List<String> options;
  final List<String>? optionsImageUrls;
  final int correctAnswerIndex;
  final String? fontFamily;
  final List<String>? optionsFontFamilies;
  final String? explanation;

  QuestionModel({
    required this.id,
    required this.text,
    this.questionImageUrl,
    this.type = QuestionType.mcq,
    required this.options,
    this.optionsImageUrls,
    required this.correctAnswerIndex,
    this.fontFamily,
    this.optionsFontFamilies,
    this.explanation,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      questionImageUrl: json['questionImageUrl'],
      type: QuestionType.values.firstWhere(
        (e) => e.name == (json['type'] ?? QuestionType.mcq.name),
        orElse: () => QuestionType.mcq,
      ),
      options: List<String>.from(json['options'] ?? []),
      optionsImageUrls: json['optionsImageUrls'] != null
          ? List<String>.from(json['optionsImageUrls'])
          : null,
      correctAnswerIndex: json['correctAnswerIndex'] ?? 0,
      fontFamily: json['fontFamily'],
      optionsFontFamilies: json['optionsFontFamilies'] != null
          ? List<String>.from(json['optionsFontFamilies'])
          : null,
      explanation: json['explanation'] as String? ?? json['hint'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      if (questionImageUrl != null) 'questionImageUrl': questionImageUrl,
      'type': type.name,
      'options': options,
      if (optionsImageUrls != null) 'optionsImageUrls': optionsImageUrls,
      'correctAnswerIndex': correctAnswerIndex,
      if (fontFamily != null) 'fontFamily': fontFamily,
      if (optionsFontFamilies != null)
        'optionsFontFamilies': optionsFontFamilies,
      if (explanation != null) 'explanation': explanation,
    };
  }
}
