import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Search, 
  Download, 
  Sparkles, 
  User, 
  CheckCircle2, 
  Calendar,
  Filter,
  Zap,
  Flame,
  Star,
  GraduationCap
} from 'lucide-react';
import { StudentResult, UserModel, GradeItem } from '../types';
import { formatEnNumber, toEnDigits } from '../utils/formatters';

interface LeaderboardViewProps {
  results: StudentResult[];
  users: UserModel[];
  grades?: GradeItem[];
}

// Exactly matching StudentGradeLevel enum in Flutter (lib/domain/models/student_grade_level.dart)
type AppGradeTab = 
  | 'all'
  | 'grade9'
  | 'grade9English'
  | 'sec3Scientific'
  | 'sec3ScientificEnglish'
  | 'sec3Literary'
  | 'sec3LiteraryEnglish';

const GRADE_TABS: { id: AppGradeTab; label: string }[] = [
  { id: 'all', label: 'الكل (الترتيب العام)' },
  { id: 'grade9', label: 'تاسع' },
  { id: 'grade9English', label: 'تاسع قسم إنجليزي' },
  { id: 'sec3Scientific', label: 'ثالث ثانوي علمي' },
  { id: 'sec3ScientificEnglish', label: 'ثالث ثانوي علمي (إنجليزي)' },
  { id: 'sec3Literary', label: 'ثالث ثانوي أدبي' },
  { id: 'sec3LiteraryEnglish', label: 'ثالث ثانوي أدبي (إنجليزي)' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  results,
  users,
  grades = [],
}) => {
  const [selectedTab, setSelectedTab] = useState<AppGradeTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map users for instant lookup O(1)
  const userMap = useMemo(() => {
    const map = new Map<string, UserModel>();
    users.forEach(u => {
      if (u.id) map.set(u.id, u);
    });
    return map;
  }, [users]);

  // Compute Leaderboard EXACTLY like Flutter app (lib/features/student/providers/leaderboard_provider.dart)
  const leaderboardData = useMemo(() => {
    // 1. Group results by user and find the best score per exam (prevent farming identical attempts)
    // Map: userId -> { examId -> { score, totalQuestions, studentGrade } }
    const userBestExamScores: Record<string, Record<string, { score: number; totalQuestions: number; grade: string }>> = {};

    results.forEach((r) => {
      const uid = r.userId;
      if (!uid) return;

      // Skip competition results as done in Flutter leaderboard_provider.dart
      if ((r as any).earnedPoints !== undefined && (r as any).earnedPoints !== null) {
        return;
      }

      const score = Number(r.score) || 0;
      const totalQ = Number(r.totalQuestions) || 50;
      const examId = r.examId || 'general';
      const studentGrade = (r as any).studentGrade || (r as any).gradeName || '';

      if (!userBestExamScores[uid]) {
        userBestExamScores[uid] = {};
      }

      const existing = userBestExamScores[uid][examId];
      if (!existing || score > existing.score) {
        userBestExamScores[uid][examId] = {
          score,
          totalQuestions: totalQ,
          grade: studentGrade,
        };
      }
    });

    // 2. Build aggregated student leaderboard items
    const list: Array<{
      userId: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
      role: string;
      gradeKey: string;
      gradeDisplayName: string;
      totalScore: number;
      examsCount: number;
      totalQuestions: number;
      accuracy: number;
    }> = [];

    Object.keys(userBestExamScores).forEach((uid) => {
      const examMap = userBestExamScores[uid];
      const user = userMap.get(uid);

      // We only rank students (or users who took exams)
      const isStudent = !user || user.role === 'student';
      if (!isStudent && user?.role === 'admin') return;

      let totalScore = 0;
      let totalQuestions = 0;
      let examsCount = 0;
      let inferredGrade = user?.gradeLevel || user?.grade || '';

      Object.values(examMap).forEach((item) => {
        totalScore += item.score;
        totalQuestions += item.totalQuestions;
        examsCount++;
        if (!inferredGrade && item.grade) {
          inferredGrade = item.grade;
        }
      });

      // Normalize grade to AppGradeTab key
      const lowerG = (inferredGrade || '').toLowerCase();
      let gradeKey: AppGradeTab = 'grade9';
      let gradeDisplayName = 'الصف التاسع';

      if (lowerG.includes('sec3scientificenglish') || (lowerG.includes('scientific') && lowerG.includes('english'))) {
        gradeKey = 'sec3ScientificEnglish';
        gradeDisplayName = 'ثالث ثانوي علمي (إنجليزي)';
      } else if (lowerG.includes('sec3literaryenglish') || (lowerG.includes('literary') && lowerG.includes('english'))) {
        gradeKey = 'sec3LiteraryEnglish';
        gradeDisplayName = 'ثالث ثانوي أدبي (إنجليزي)';
      } else if (lowerG.includes('grade9english') || (lowerG.includes('grade9') && lowerG.includes('english')) || lowerG.includes('انجليزي')) {
        gradeKey = 'grade9English';
        gradeDisplayName = 'تاسع قسم إنجليزي';
      } else if (lowerG.includes('sec3scientific') || lowerG.includes('scientific') || lowerG.includes('علمي') || lowerG.includes('عملي')) {
        gradeKey = 'sec3Scientific';
        gradeDisplayName = 'ثالث ثانوي علمي';
      } else if (lowerG.includes('sec3literary') || lowerG.includes('literary') || lowerG.includes('أدبي') || lowerG.includes('ادبي')) {
        gradeKey = 'sec3Literary';
        gradeDisplayName = 'ثالث ثانوي أدبي';
      } else if (lowerG.includes('grade12') || lowerG.includes('ثانوي')) {
        gradeKey = 'sec3Scientific';
        gradeDisplayName = 'الثالث الثانوي';
      } else {
        gradeKey = 'grade9';
        gradeDisplayName = 'الصف التاسع';
      }

      const studentName = user?.name || (uid ? `طالب (${uid.slice(0, 6)})` : 'طالب');
      const studentEmail = user?.email || '';
      const avatarUrl = user?.profilePictureUrl || null;
      const accuracy = totalQuestions > 0 ? Math.min(Math.round((totalScore / totalQuestions) * 100), 100) : 0;

      list.push({
        userId: uid,
        name: studentName,
        email: studentEmail,
        avatarUrl,
        role: user?.role || 'student',
        gradeKey,
        gradeDisplayName,
        totalScore,
        examsCount,
        totalQuestions,
        accuracy,
      });
    });

    // 3. Sort by totalScore descending (exact Flutter leaderboard sort)
    list.sort((a, b) => b.totalScore - a.totalScore);

    return list;
  }, [results, userMap]);

  // Filter based on active tab and search query
  const filteredLeaderboard = useMemo(() => {
    return leaderboardData.filter((item) => {
      // Tab filter
      let matchesTab = true;
      if (selectedTab !== 'all') {
        matchesTab = item.gradeKey === selectedTab;
      }

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.userId.toLowerCase().includes(q) ||
        item.gradeDisplayName.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [leaderboardData, selectedTab, searchQuery]);

  // Top 3 Podium
  const top1 = filteredLeaderboard[0];
  const top2 = filteredLeaderboard[1];
  const top3 = filteredLeaderboard[2];
  const restList = filteredLeaderboard.slice(3);

  // CSV Export for the Leaderboard
  const handleExportCsv = () => {
    const headers = ['الترتيب', 'اسم الطالب', 'المرحلة الدراسية', 'إجمالي النقاط المكتسبة', 'عدد الامتحانات المنجزة', 'معدل الدقة', 'البريد الإلكتروني', 'معرف الحساب'];
    const rows = filteredLeaderboard.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.gradeDisplayName}"`,
      item.totalScore,
      item.examsCount,
      `${item.accuracy}%`,
      item.email,
      item.userId,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `لوحة_الصدارة_تطبيق_اختبارات_اليمن_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* App Leaderboard Header matching Flutter app */}
      <div className="calm-panel p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Trophy Icon in Glowing Circle (matching Flutter App) */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Trophy className="w-9 h-9 fill-slate-950" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                لوحة الصدارة
              </h1>
              {/* Live Badge (matching Flutter App) */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>مباشر</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              تحدَّ زملاءك وتصدَّر القائمة! الترتيب التنافسي المباشر للطلاب ونقاط الإنجاز في التطبيق.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>تصدير كشف الصدارة (CSV)</span>
        </button>
      </div>

      {/* Grade Level Tabs (Matching Flutter StudentGradeLevel) */}
      <div className="calm-panel p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {GRADE_TABS.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input & Count Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-1">
        <div className="text-xs text-slate-500 font-medium">
          إجمالي المتصدرين: <strong className="text-slate-900 font-bold">{formatEnNumber(filteredLeaderboard.length)}</strong> طالب
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو المعرف..."
            className="w-full pr-9 pl-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* TOP 3 PODIUM (منصة المتصدرين - 🏆 المتصدرون) */}
      {filteredLeaderboard.length > 0 && (
        <div className="calm-panel p-6 sm:p-8 bg-gradient-to-b from-amber-50/40 via-white to-slate-50/50 border border-amber-200/80">
          <div className="text-center mb-6">
            <span className="text-sm font-extrabold text-amber-700 tracking-wide uppercase flex items-center justify-center gap-1.5">
              <span>🏆</span>
              <span>المتصدرون</span>
            </span>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto pt-4 pb-2">
            {/* Rank 2 (Silver) */}
            {top2 ? (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 bg-slate-100 shadow-md flex items-center justify-center overflow-hidden">
                    {top2.avatarUrl ? (
                      <img src={top2.avatarUrl} alt={top2.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -left-1 w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center border-2 border-white shadow-xs font-mono">
                    2
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px]" title={top2.name}>
                  {top2.name}
                </h3>
                <span className="text-[10px] text-slate-500 block truncate max-w-[110px]">
                  {top2.gradeDisplayName}
                </span>

                <div className="mt-3 w-full bg-gradient-to-t from-slate-200 to-slate-100 border border-slate-300 rounded-t-2xl py-3 px-2 text-center h-28 flex flex-col justify-center shadow-xs">
                  <span className="text-lg sm:text-xl font-black text-slate-800 font-mono">
                    {formatEnNumber(top2.totalScore)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">نقطة</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {formatEnNumber(top2.examsCount)} امتحان
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Rank 1 (Gold) - Center & Tallest */}
            {top1 ? (
              <div className="flex-1 flex flex-col items-center text-center -mt-6">
                <div className="relative mb-2">
                  {/* Glowing Crown on Top */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                    <Crown className="w-7 h-7 fill-amber-400 text-amber-500" />
                  </div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 bg-amber-50 shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-amber-400/20">
                    {top1.avatarUrl ? (
                      <img src={top1.avatarUrl} alt={top1.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-amber-600" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -left-1 w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-white shadow-xs font-mono">
                    1
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[140px]" title={top1.name}>
                  {top1.name}
                </h3>
                <span className="text-[11px] font-bold text-amber-700 block truncate max-w-[130px]">
                  {top1.gradeDisplayName}
                </span>

                <div className="mt-3 w-full bg-gradient-to-t from-amber-400 to-yellow-300 border border-amber-400 rounded-t-2xl py-4 px-2 text-center h-36 flex flex-col justify-center shadow-md">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                    {formatEnNumber(top1.totalScore)}
                  </span>
                  <span className="text-xs font-black text-slate-900">نقطة</span>
                  <span className="text-[10px] font-bold text-slate-800 mt-1 font-mono">
                    {formatEnNumber(top1.examsCount)} امتحان منجز
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Rank 3 (Bronze) */}
            {top3 ? (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-300 bg-orange-50 shadow-md flex items-center justify-center overflow-hidden">
                    {top3.avatarUrl ? (
                      <img src={top3.avatarUrl} alt={top3.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-orange-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -left-1 w-7 h-7 rounded-full bg-orange-300 text-orange-950 font-black text-xs flex items-center justify-center border-2 border-white shadow-xs font-mono">
                    3
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px]" title={top3.name}>
                  {top3.name}
                </h3>
                <span className="text-[10px] text-slate-500 block truncate max-w-[110px]">
                  {top3.gradeDisplayName}
                </span>

                <div className="mt-3 w-full bg-gradient-to-t from-orange-200 to-orange-100 border border-orange-300 rounded-t-2xl py-3 px-2 text-center h-24 flex flex-col justify-center shadow-xs">
                  <span className="text-lg sm:text-xl font-black text-orange-950 font-mono">
                    {formatEnNumber(top3.totalScore)}
                  </span>
                  <span className="text-[10px] font-bold text-orange-900">نقطة</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {formatEnNumber(top3.examsCount)} امتحان
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      )}

      {/* RANKINGS LIST (المركز الرابع فما فوق) */}
      <div className="calm-panel overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            جدول الترتيب والنقاط التراكمية
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {formatEnNumber(filteredLeaderboard.length)} متصدر
          </span>
        </div>

        {filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">لم يتم تسجيل أي نقاط بعد في هذا القسم</p>
            <p className="text-xs text-slate-400">ستظهر لوحة الصدارة فور حل الطلاب للاختبارات في التطبيق.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">الترتيب</th>
                  <th className="py-3 px-4">الطالب</th>
                  <th className="py-3 px-4">المرحلة الدراسية</th>
                  <th className="py-3 px-4 text-center">إجمالي النقاط</th>
                  <th className="py-3 px-4 text-center">الامتحانات المنجزة</th>
                  <th className="py-3 px-4 text-center">معدل الدقة</th>
                  <th className="py-3 px-4 text-left">معرف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaderboard.map((student, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr 
                      key={student.userId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        rank === 1 ? 'bg-amber-50/40 font-bold' :
                        rank === 2 ? 'bg-slate-50/50' :
                        rank === 3 ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center font-mono">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-orange-950 font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-slate-200">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              student.name.charAt(0) || 'ط'
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]" title={student.name}>
                              {student.name}
                            </span>
                            {student.email && (
                              <span className="text-[11px] text-slate-400 font-mono block truncate max-w-[180px]">
                                {student.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                          {student.gradeDisplayName}
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-black text-amber-600 font-mono">
                          {formatEnNumber(student.totalScore)}
                        </span>
                        <span className="text-[10px] text-slate-400 mr-1">نقطة</span>
                      </td>

                      {/* Exams Count */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {formatEnNumber(student.examsCount)}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono font-bold">
                          <span className={student.accuracy >= 75 ? 'text-emerald-600' : student.accuracy >= 50 ? 'text-blue-600' : 'text-slate-500'}>
                            {toEnDigits(student.accuracy)}%
                          </span>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="py-3 px-4 text-left">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                          {student.userId.substring(0, 10)}...
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
