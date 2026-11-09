import pdfplumber
import pandas as pd
import re
import argparse
import os

def convert_yemen_exam(pdf_path, excel_path):
    print(f"جاري قراءة الملف: {pdf_path}")
    
    questions = {}
    answers = {}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"عدد صفحات الملف: {len(pdf.pages)}")
            
            # الخطوة الأولى: استخراج جدول الإجابات من الصفحة الأخيرة (أو من كامل الصفحات)
            # للبحث عن نمط مثل: "ر.س" و "الاجابة الصحيحة"
            print("جاري استخراج جدول الإجابات...")
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # تنظيف الخلايا
                        cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                        
                        # نبحث عن الأرقام. جداول مفتاح الإجابات غالباً تكون متكررة.
                        # سنحاول إيجاد أزواج (رقم السؤال، والإجابة)
                        # في النموذج، كل كتلة إجابات تحتوي على 5 أعمدة. نحن نهتم برقم السؤال والإجابة الصحيحة.
                        
                        # نستخرج كل الأرقام الموجودة في الصف
                        numbers = []
                        for cell in cleaned_row:
                            if cell.isdigit():
                                numbers.append(int(cell))
                                
                        # إذا كان الصف يحتوي على رقم سؤال (مثل من 1 لـ 50) ورقم إجابة (من 1 لـ 4) بجانبه
                        # هذه خوارزمية مبسطة للبحث داخل الجدول المدمج
                        if numbers:
                            # نعلم أن أرقام الأسئلة تتراوح من 1 إلى 50، والإجابات من 1 إلى 4
                            for i in range(len(numbers)):
                                if 1 <= numbers[i] <= 50:
                                    q_num = numbers[i]
                                    # الإجابة الصحيحة غالباً تكون الخلية التي تسبق أو تلي خلية رقم السؤال
                                    # نبحث عن الإجابة المحتملة (1، 2، 3، 4) في الأرقام المجاورة
                                    if i + 1 < len(numbers) and 1 <= numbers[i+1] <= 4:
                                        answers[q_num] = numbers[i+1]
                                    elif i - 1 >= 0 and 1 <= numbers[i-1] <= 4:
                                        answers[q_num] = numbers[i-1]
            
            print(f"تم استخراج عدد {len(answers)} إجابة من جدول الإجابات.")

            # الخطوة الثانية: استخراج نص الأسئلة والخيارات
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
                    
            # تنظيف وتجهيز النص
            lines = full_text.split('\n')
            
            current_q_num = 0
            
            # بناء هيكل الأسئلة
            for q_num in range(1, 51):
                questions[q_num] = {
                    'نص السؤال': '',
                    'نوع السؤال (mcq, true_false)': 'true_false' if q_num <= 20 else 'mcq',
                    'الخيار الأول': 'صواب' if q_num <= 20 else '',
                    'الخيار الثاني': 'خطأ' if q_num <= 20 else '',
                    'الخيار الثالث': '',
                    'الخيار الرابع': '',
                    'رقم الإجابة الصحيحة (1-4)': answers.get(q_num, '')
                }

            print("جاري تحليل نصوص الأسئلة...")
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # التقاط أرقام الأسئلة (1 إلى 50)
                # صيغة صح وخطأ عادة ما تكون:  " 1 ) اشتمل القرآن..." أو "1 ("
                match_q = re.search(r'(\d+)\s*[\(\)\.]', line)
                if match_q:
                    extracted_num = int(match_q.group(1))
                    if 1 <= extracted_num <= 50:
                        current_q_num = extracted_num
                        # نحذف رقم السؤال من بداية أو نهاية السطر
                        cleaned_text = re.sub(r'\d+\s*[\(\)\.]', '', line).strip()
                        if cleaned_text:
                            questions[current_q_num]['نص السؤال'] += cleaned_text + ' '
                        continue
                
                # إذا كنا داخل سؤال موضوعي (21 - 50)، نحاول التقاط الخيارات
                if 21 <= current_q_num <= 50:
                    # قد تأتي الخيارات في سطر واحد هكذا: "العلم  4  الظن  3  الشك  2  الجهل  1"
                    # هذه الخوارزمية تحاول التقاط الأرقام (1، 2، 3، 4) وما بينها
                    opts_match = re.findall(r'([^\d]+)\s*(\d)', line)
                    if opts_match and len(opts_match) >= 2:
                        for text_part, num_part in opts_match:
                            opt_num = int(num_part)
                            opt_text = text_part.strip()
                            if opt_num == 1: questions[current_q_num]['الخيار الأول'] = opt_text
                            if opt_num == 2: questions[current_q_num]['الخيار الثاني'] = opt_text
                            if opt_num == 3: questions[current_q_num]['الخيار الثالث'] = opt_text
                            if opt_num == 4: questions[current_q_num]['الخيار الرابع'] = opt_text
                        continue
                        
                # إذا لم يكن الخط سطر خيارات، نعتبره تكملة للسؤال الحالي
                if current_q_num > 0 and len(questions[current_q_num]['نص السؤال']) < 250:
                    # تفادي إضافة رؤوس الصفحات كالسنة الدراسية أو اسم المادة
                    if "اختبار الشهادة" not in line and "المادة" not in line:
                         questions[current_q_num]['نص السؤال'] += line + ' '

        # ترتيب البيانات للـ Excel
        output_list = []
        for q_num in range(1, 51):
            if questions[q_num]['نص السؤال']:
                output_list.append(questions[q_num])

        df = pd.DataFrame(output_list)
        df.to_excel(excel_path, index=False)
        print(f"تم بنجاح! تم إنشاء الملف المكتمل: {excel_path}")
        print("يمكنك الآن فتح ملف الـ Excel لمراجعته.")

    except Exception as e:
        print(f"حدث خطأ أثناء قراءة الملف: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="أداة استخراج نماذج الوزارة (اليمن)")
    parser.add_argument("pdf_path", help="مسار ملف الـ PDF")
    parser.add_argument("excel_path", help="مسار ملف الـ Excel المراد إنشاؤه")
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf_path):
        print("ملف الـ PDF غير موجود!")
    else:
        convert_yemen_exam(args.pdf_path, args.excel_path)
