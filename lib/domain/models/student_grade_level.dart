enum StudentGradeLevel {
  grade9('تاسع'),
  grade9English('تاسع قسم إنجليزي'),
  sec3Scientific('ثالث ثانوي علمي'),
  sec3ScientificEnglish('ثالث ثانوي علمي قسم إنجليزي'),
  sec3Literary('ثالث ثانوي أدبي'),
  sec3LiteraryEnglish('ثالث ثانوي أدبي قسم إنجليزي');

  final String displayName;
  const StudentGradeLevel(this.displayName);

  factory StudentGradeLevel.fromString(String value) {
    return StudentGradeLevel.values.firstWhere(
      (e) => e.name == value,
      orElse: () => StudentGradeLevel.grade9,
    );
  }

  static StudentGradeLevel? fromSubject(String gradeId, String? stream) {
    if (gradeId == 'grade9') {
      if (stream == 'english') return StudentGradeLevel.grade9English;
      return StudentGradeLevel.grade9;
    } else if (gradeId == 'grade12') {
      if (stream == 'scientific') return StudentGradeLevel.sec3Scientific;
      if (stream == 'scientific_english') {
        return StudentGradeLevel.sec3ScientificEnglish;
      }
      if (stream == 'literary') return StudentGradeLevel.sec3Literary;
      if (stream == 'literary_english') {
        return StudentGradeLevel.sec3LiteraryEnglish;
      }
    }
    return null;
  }
}
