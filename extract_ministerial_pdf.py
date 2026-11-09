import fitz
import re
import json
import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def clean_arabic_text(text):
    if not text:
        return ""
    # Normalize some common OCR / PDF ligature artifacts
    text = text.replace('\xa0', ' ')
    text = text.replace('ْٔ', '')
    text = text.replace('َّم', 'ّ')
    text = text.replace('ِِر', 'ر')
    text = text.replace('ϼ', 'لا')
    text = text.replace('ဃَّم َ', 'الله')
    text = text.replace('ဃَّم', 'الله')
    text = text.replace('هللا', 'الله')
    text = text.replace('أال', 'الأ')
    text = text.replace('إال', 'الإ')
    text = text.replace('آال', 'الآ')
    text = text.replace('أْٔا', 'أ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_model_text(pages_text, model_name):
    """
    Parses a Yemeni ministerial exam model into questions 1..N.
    True/False: 1..16
    MCQ: 17..50
    """
    lines = [l.strip() for l in pages_text.split('\n') if l.strip()]
    questions = []
    
    # We look for question numbers
    # Pattern: a line with just a number, or line starting with number
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if line is a question number: 1..50
        match_num = re.match(r'^(\d{1,2})$', line)
        if match_num:
            q_num = int(match_num.group(1))
            
            # Next line(s) are question text
            if i + 1 < len(lines):
                i += 1
                q_text_raw = lines[i]
                
                # If True/False (1-16 or contains ( ) )
                if q_num <= 16 or '( )' in q_text_raw or '.( )' in q_text_raw or '( )' in q_text_raw:
                    # Clean up question text
                    clean_q = re.sub(r'^\.\s*\(\s*\)\s*', '', q_text_raw)
                    clean_q = re.sub(r'^\(\s*\)\s*', '', clean_q)
                    clean_q = clean_arabic_text(clean_q)
                    
                    questions.append({
                        'questionNumber': q_num,
                        'id': f"q_{str(q_num).zfill(3)}",
                        'order': q_num,
                        'text': clean_q,
                        'type': 'trueFalse',
                        'options': ['صح', 'خطأ'],
                        'correctAnswerIndex': 0, # Default to 0 (صح), user/key can specify
                        'explanation': '',
                    })
                else:
                    # MCQ (17+)
                    clean_q = clean_arabic_text(q_text_raw)
                    
                    # Next line usually contains the 4 options: 1...2...3...4...
                    options = []
                    if i + 1 < len(lines):
                        i += 1
                        opt_line = lines[i]
                        
                        # Split by 1, 2, 3, 4
                        # Option pattern e.g. 1خيار2خيار3خيار4خيار or 1 خيار 2 خيار...
                        opt_matches = re.split(r'(?=[1234][^\d])', opt_line)
                        raw_opts = [clean_arabic_text(re.sub(r'^[1234]\s*', '', o)) for o in opt_matches if o.strip()]
                        
                        if len(raw_opts) >= 2:
                            options = raw_opts[:4]
                        else:
                            # If split failed, keep line as option 1
                            options = [clean_arabic_text(opt_line), 'خيار 2', 'خيار 3', 'خيار 4']
                    
                    while len(options) < 4:
                        options.append(f"خيار {len(options) + 1}")
                        
                    questions.append({
                        'questionNumber': q_num,
                        'id': f"q_{str(q_num).zfill(3)}",
                        'order': q_num,
                        'text': clean_q,
                        'type': 'mcq',
                        'options': options,
                        'correctAnswerIndex': 0, # Default, verified in Studio
                        'explanation': '',
                    })
        i += 1
        
    # Sort strictly by questionNumber
    questions.sort(key=lambda x: x['questionNumber'])
    return questions

def extract_all_models_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    models = {}
    
    # We know pages 3-4 = P.53, 6-7 = P.25, 9-10 = P.55, 12-13 = P.54, 15-16 = P.52
    model_pages = [
        ('P.53', [2, 3]),
        ('P.25', [5, 6]),
        ('P.55', [8, 9]),
        ('P.54', [11, 12]),
        ('P.52', [14, 15]),
    ]
    
    for model_code, p_indices in model_pages:
        full_text = ""
        for p_idx in p_indices:
            if p_idx < len(doc):
                full_text += doc[p_idx].get_text('text') + "\n"
        
        parsed = parse_model_text(full_text, model_code)
        models[model_code] = parsed
        print(f"Model {model_code}: Extracted {len(parsed)} questions")
        
    return models

def save_models_to_excel(models, output_excel_path):
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)
    
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center", wrap_text=True)
    
    for model_code, questions in models.items():
        ws = wb.create_sheet(title=f"نموذج_{model_code}")
        ws.sheet_view.rightToLeft = True
        
        headers = [
            "رقم السؤال",
            "نوع السؤال",
            "نص السؤال",
            "الخيار 1",
            "الخيار 2",
            "الخيار 3",
            "الخيار 4",
            "الإجابة الصحيحة (1-4)",
            "التعليل والتوضيح"
        ]
        
        ws.append(headers)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = align_center
            
        for q in questions:
            opts = q['options']
            opt1 = opts[0] if len(opts) > 0 else ''
            opt2 = opts[1] if len(opts) > 1 else ''
            opt3 = opts[2] if len(opts) > 2 else ''
            opt4 = opts[3] if len(opts) > 3 else ''
            
            q_type_str = "صح أو خطأ" if q['type'] == 'trueFalse' else "اختيار من متعدد"
            correct_num = q['correctAnswerIndex'] + 1
            
            row = [
                q['questionNumber'],
                q_type_str,
                q['text'],
                opt1,
                opt2,
                opt3,
                opt4,
                correct_num,
                q.get('explanation', '')
            ]
            ws.append(row)
            
        # Adjust column widths
        ws.column_dimensions['A'].width = 12
        ws.column_dimensions['B'].width = 16
        ws.column_dimensions['C'].width = 50
        ws.column_dimensions['D'].width = 22
        ws.column_dimensions['E'].width = 22
        ws.column_dimensions['F'].width = 22
        ws.column_dimensions['G'].width = 22
        ws.column_dimensions['H'].width = 18
        ws.column_dimensions['I'].width = 30
        
    wb.save(output_excel_path)
    print(f"Saved Excel to: {output_excel_path}")

if __name__ == '__main__':
    pdf_file = "5نماذج_وزارية_للقرآن_الكريم_تاسع_قسم_انجليزي2025_2026 (2).pdf"
    if os.path.exists(pdf_file):
        models = extract_all_models_from_pdf(pdf_file)
        
        # Save JSON
        with open("extracted_models_quran.json", "w", encoding="utf-8") as f:
            json.dump(models, f, ensure_ascii=False, indent=2)
        print("Saved JSON to: extracted_models_quran.json")
        
        # Save Excel
        save_models_to_excel(models, "نماذج_القرآن_الكريم_المستخرجة_2025_2026.xlsx")

