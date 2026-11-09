import pandas as pd

df = pd.read_excel('g:/ExamYemen/math_model_p45_2024_2025_formatted.xlsx')
print("Columns:", list(df.columns))
print(df.head(2))
