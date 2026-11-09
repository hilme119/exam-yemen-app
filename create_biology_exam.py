import json
import csv
import os

exam_data = {
  "exam_info": {
    "title": "اختبار الأحياء - الشهادة الثانوية العامة (القسم العلمي)",
    "year": "2025/2026 - 1447هـ",
    "form_code": "P.28",
    "subject": "الأحياء",
    "grade": "الثالث الثانوي (علمي)",
    "total_questions": 50
  },
  "questions": [
    # ---- أسئلة الصواب والخطأ (1 - 20) ----
    {
      "id": "bio_p28_1",
      "number": 1,
      "question": "الحزمة العصبية عبارة عن مجموعة من الألياف العصبية المحاطة بنسيج ضام غني بالأوعية الدموية.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_2",
      "number": 2,
      "question": "ناقل طفيل الملاريا ذكر بعوض الأنوفليس.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_3",
      "number": 3,
      "question": "توجد فئران صفراء اللون متماثلة الجينات حية في الطبيعة.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_4",
      "number": 4,
      "question": "عملية تضاعف DNA تبدأ من نقاط منشأ التضاعف العديدة.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_5",
      "number": 5,
      "question": "عند استنساخ النعجة دولي وضعت الخلية الجسدية في وسط غذائي غني بالمواد الغذائية.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_6",
      "number": 6,
      "question": "بكتيريا ميثانوجينيك تنتج إنزيم الكيموزين صناعياً.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_7",
      "number": 7,
      "question": "تكون ثمرة الموز دون تلقيح يُعد مثالاً للثمار العذرية.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_8",
      "number": 8,
      "question": "الشفرة UCC تُعد مثالاً لتوقف بناء البروتين.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_9",
      "number": 9,
      "question": "يستخدم وعاء Digester في إنتاج الدواء.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_10",
      "number": 10,
      "question": "عند تقريب شريحة من الليمون من أنفك تشعر بطعم الليمون بسبب ذوبان الغازات المتطايرة في اللعاب مؤثرة في براعم التذوق.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_11",
      "number": 11,
      "question": "إذا أراد المزارع تكوين جذور عرضية في عملية التكاثر الخضري بالعقل فإنه يستخدم الأوكسينات.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_12",
      "number": 12,
      "question": "لمقاومة ملوحة التربة يلجأ المزارعون إلى طريقة التطعيم في النبات.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_13",
      "number": 13,
      "question": "في الوراثة المندلية زوجان تركيبهما الجيني لصفة ما (Rr) فإن احتمال ظهور التركيب الجيني (rr) في النسل 75%.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_14",
      "number": 14,
      "question": "تستخدم بصمة DNA في التحقق من هوية مجرم إذا ترك شعرة في موقع الجريمة.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_15",
      "number": 15,
      "question": "تحتوي القوقعة على مستقبلات الصوت والقنوات الهلالية تحتوي على مستقبلات التوازن.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_16",
      "number": 16,
      "question": "يفرز هرمون الأنسولين من خلايا ألفا البنكرياسية، وهرمون الجلوكاجون من خلايا بيتا.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_17",
      "number": 17,
      "question": "الشخص الذي يستطيع قراءة الرقم (42) يكون غير مصاب بعمى الألوان.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_18",
      "number": 18,
      "question": "التركيب الجيني لشخص مصاب إصابة كاملة بالثلاسيميا (H^F H^F).",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_19",
      "number": 19,
      "question": "إذا كانت فصيلة دم الرجل (A) نقي، وزوجته (O) فإن نسبة ظهور التركيب الجيني (I^A i) في النسل 25%.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_20",
      "number": 20,
      "question": "رجل موجب العامل الرايزيسي سليم من مرض الهيموفيليا (DDX^H Y) وزوجته موجبة العامل حاملة لجين المرض (DDX^H X^h) فإن احتمال ظهور التركيب الجيني (DDX^H Y) في النسل الناتج 100%.",
      "type": "true_false",
      "options": ["صح", "خطأ"],
      "correctAnswerIndex": 1
    },

    # ---- أسئلة الاختيار من متعدد (21 - 50) ----
    {
      "id": "bio_p28_21",
      "number": 21,
      "question": "أي مما يأتي مستقبل للبرودة في الجلد؟",
      "type": "mcq",
      "options": ["نهايات روفيني", "نهايات عصبية حرة", "حويصلات ميسنر", "نهايات كراوس"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_22",
      "number": 22,
      "question": "أي من مناطق اللسان أكثر تذوقاً للطعم الحلو؟",
      "type": "mcq",
      "options": ["الجانبان الخلفيان", "مؤخرة اللسان", "الجانبان الأماميان", "مقدمة اللسان"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_23",
      "number": 23,
      "question": "يفرز هرمون الثيروكسين من:",
      "type": "mcq",
      "options": ["نخاع الكظرية", "الدرقية", "قشرة الكظرية", "النخامية"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_24",
      "number": 24,
      "question": "تتسع الشعب الهوائية لدخول كمية كبيرة من الأكسجين إليها بتأثير هرمون:",
      "type": "mcq",
      "options": ["الأستروجين", "التستوستيرون", "الأدرينالين", "الأندروجين"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_25",
      "number": 25,
      "question": "يسيطر على الانحاء الضوئي في النبات هرمون:",
      "type": "mcq",
      "options": ["الإيثيلين", "الجبريلين", "السيتوكينين", "الأوكسين"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_26",
      "number": 26,
      "question": "تحتوي خلايا ذكر النحل على مجموعة كروموسومية:",
      "type": "mcq",
      "options": ["أحادية", "ثنائية", "ثلاثية", "رباعية"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_27",
      "number": 27,
      "question": "أي من التراكيب الآتية يفرز مادة مخاطية غنية بالفركتوز؟",
      "type": "mcq",
      "options": ["غدة البروستات", "الوعاء الناقل", "غدتا كوبر", "الحويصلتان المنويتان"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_28",
      "number": 28,
      "question": "إحدى الصفات الآتية متأثرة بالجنس:",
      "type": "mcq",
      "options": ["الثلاسيميا", "البول السكري", "الصلع الوراثي", "عمى الألوان"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_29",
      "number": 29,
      "question": "عدد التراكيب الجينية لفصائل الدم الأربع:",
      "type": "mcq",
      "options": ["اثنان", "أربعة", "ستة", "ثمانية"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_30",
      "number": 30,
      "question": "التقاط صورة بالأشعة السينية للحمض النووي DNA كان على يد:",
      "type": "mcq",
      "options": ["روزاليندا", "فرانسيس", "ماكلاود", "أوزوالد"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_31",
      "number": 31,
      "question": "الأنواع الثلاثة للحمض RNA يتم نسخها من حمض DNA في:",
      "type": "mcq",
      "options": ["السيتوبلازم", "الميتوكندريا", "الرايبوسوم", "النواة"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_32",
      "number": 32,
      "question": "يدخل في تنظيم عملية الإحساس في دودة الأرض:",
      "type": "mcq",
      "options": ["عقدة دماغية", "بروتوبلازم", "خيوط عصبية", "شبكة عصبية"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_33",
      "number": 33,
      "question": "يشكل الجزء الخلفي للدماغ:",
      "type": "mcq",
      "options": ["المخ", "ساق الدماغ", "المخيخ", "الحبل الشوكي"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_34",
      "number": 34,
      "question": "الجهاز العصبي الجارسمبثاوي يقوم بـ:",
      "type": "mcq",
      "options": ["تثبيط إفراز اللعاب", "تقليل ضربات القلب", "رفع ضغط الدم", "توسيع حدقة العين"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_35",
      "number": 35,
      "question": "أي من الغدد الآتية تفرز هرمون الباراثورمون؟",
      "type": "mcq",
      "options": ["جزر لانجر هانز", "النخامية", "الجاردريقة", "الكظرية"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_36",
      "number": 36,
      "question": "الهرمون الذي يؤثر على الألياف العضلية المحيطة بالحويصلات الثديية أثناء الرضاعة:",
      "type": "mcq",
      "options": ["الأنسولين", "الفازوبرسين", "الأوكسيتوسين", "البرولاكتين"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_37",
      "number": 37,
      "question": "الفطر الذي يستطيع الفرد الواحد منه إنتاج 500.000 بوغاً عندما يتكاثر لاجنسياً:",
      "type": "mcq",
      "options": ["البراميسيوم", "الإسفنج", "عش الغراب", "الهيدرا"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_38",
      "number": 38,
      "question": "معادلة حموضة المهبل والسائل المنوي بسبب إفرازات:",
      "type": "mcq",
      "options": ["البروستات", "البربخ", "الحويصلتان المنويتان", "الإحليل"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_39",
      "number": 39,
      "question": "ماذا يحدث للجنين في الشهور الثلاثة الثانية؟",
      "type": "mcq",
      "options": ["تتكون الأصابع", "تتكون الأظافر", "يتشكل الوجه", "تسمع دقات القلب"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_40",
      "number": 40,
      "question": "اختار مندل نبات الباقلاء في تجاربه بسبب أن:",
      "type": "mcq",
      "options": ["أزهاره خنثى", "أصنافه تحمل صفات متشابهة", "يمكن زراعته مرة واحدة في العام", "أزهاره أحادية الجنس"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_41",
      "number": 41,
      "question": "أي مما يلي يُعد مثالاً لوراثة السيادة المشتركة؟",
      "type": "mcq",
      "options": ["الشعر في أبقار الشورت هورن", "فقر دم البحر الأبيض", "لون الفئران الصفراء", "البادرات البيضاء في الذرة"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_42",
      "number": 42,
      "question": "هرمون البوفين يُعطى للأبقار لزيادة:",
      "type": "mcq",
      "options": ["حليبها", "صوفها", "شحمها", "لحمها"],
      "correctAnswerIndex": 0
    },
    {
      "id": "bio_p28_43",
      "number": 43,
      "question": "عند زواج رجل بفتاة التركيب الجيني لكليهما (TTBb) فإن النسبة المئوية لاحتمال ظهور التركيب الجيني (TTBB) في النسل:",
      "type": "mcq",
      "options": ["100", "75", "50", "25"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_44",
      "number": 44,
      "question": "تتكون مقلة العين من ثلاث طبقات نسجية، والشبكية من ...... طبقات من الخلايا.",
      "type": "mcq",
      "options": ["اثنتان", "ثلاث", "أربع", "خمس"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_45",
      "number": 45,
      "question": "يتمثل التكاثر اللاجنسي بالقطع والتجديد في الإنسان بتجديد ما يستأصل من الكبد جراحياً، وفي اليوجلينا بـ:",
      "type": "mcq",
      "options": ["التبرعم", "الانشطار", "التجرثم", "التبوغ"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_46",
      "number": 46,
      "question": "جميع التراكيب الآتية توجد في حبة اللقاح الناضجة بعد الإنبات ما عدا:",
      "type": "mcq",
      "options": ["أنبوبة اللقاح", "النواة الأنبوبية", "نوى الخلايا السمتية", "النواتان الذكريتان"],
      "correctAnswerIndex": 2
    },
    {
      "id": "bio_p28_47",
      "number": 47,
      "question": "الطيور تنتمي إلى النمط الكروموسومي الجنسي (ZW-ZZ) وينتمي إلى النمط (XX-XY):",
      "type": "mcq",
      "options": ["النطاط", "ذبابة الفاكهة", "النملة", "النحلة"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_48",
      "number": 48,
      "question": "جميع الشفرات الوراثية الآتية توجد في RNA ما عدا:",
      "type": "mcq",
      "options": ["CUA", "UUC", "ACU", "TAC"],
      "correctAnswerIndex": 3
    },
    {
      "id": "bio_p28_49",
      "number": 49,
      "question": "تبدأ الفطريات في إنتاج البنسلين في الأوعية الخاصة بعد حوالي ...... ساعة.",
      "type": "mcq",
      "options": ["46", "40", "30", "24"],
      "correctAnswerIndex": 1
    },
    {
      "id": "bio_p28_50",
      "number": 50,
      "question": "يبين الشكل المقابل رسم تخطيطي لتراكيب في التشابك العصبي، حيث يشير السهم إلى:",
      "type": "mcq",
      "options": ["الشق التشابكي", "النواقل العصبية", "الزر الطرفي", "الحويصلة التشابكية"],
      "correctAnswerIndex": 3,
      "has_image": True,
      "image_description": "رسم تخطيطي للتشابك العصبي والزر الطرفي مع سهم يشير إلى الحويصلة التشابكية"
    }
  ]
}

# 1. حفظ ملف JSON
json_path = 'biology_exam_p28.json'
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(exam_data, f, ensure_ascii=False, indent=2)

print(f"تم حفظ JSON بنجاح في: {json_path}")

# 2. حفظ ملف CSV
csv_path = 'biology_exam_p28.csv'
with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["نص السؤال", "النوع (MCQ أو TF)", "الخيار الأول (أو صح)", "الخيار الثاني (أو خطأ)", "الخيار الثالث", "الخيار الرابع", "رقم الإجابة الصحيحة (0-3)"])
    
    for q in exam_data["questions"]:
        q_type = "TF" if q["type"] == "true_false" else "MCQ"
        opts = q["options"]
        opt1 = opts[0] if len(opts) > 0 else ""
        opt2 = opts[1] if len(opts) > 1 else ""
        opt3 = opts[2] if len(opts) > 2 else ""
        opt4 = opts[3] if len(opts) > 3 else ""
        
        writer.writerow([q["question"], q_type, opt1, opt2, opt3, opt4, q["correctAnswerIndex"]])

print(f"تم حفظ CSV بنجاح في: {csv_path}")
