import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Search,
  Sparkles,
  User,
  Flame,
  Star,
  GraduationCap
} from 'lucide-react';
import { StudentUser } from '../types';
import { db, collection, getDocs, query } from '../services/firebase';
import { toEnDigits } from '../utils/numberFormatter';

interface LeaderboardStudent {
  id: string;
  name: string;
  gradeLevel?: string;
  points: number;
  examsCount: number;
  avgScore: number;
  rank?: number;
}

interface LeaderboardViewProps {
  currentUser: StudentUser | null;
  onGoHome: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser, onGoHome }) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | 'grade9' | 'sec3Scientific' | 'sec3Literary'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch users from 'users' collection
      const userSnap = await getDocs(collection(db, 'users'));
      const studentMap = new Map<string, LeaderboardStudent>();

      userSnap.docs.forEach((d) => {
        const u = d.data();
        studentMap.set(d.id, {
          id: d.id,
          name: u.displayName || u.name || 'طالب متميز',
          gradeLevel: u.gradeLevel || 'sec3Scientific',
          points: u.points || 0,
          examsCount: 0,
          avgScore: 0,
        });
      });

      // 2. Fetch results from 'results' collection to compute real exam metrics
      try {
        const resSnap = await getDocs(collection(db, 'results'));
        const examCounts: Record<string, number> = {};
        const scoreSums: Record<string, number> = {};

        resSnap.docs.forEach((d) => {
          const r = d.data();
          const uid = r.userId;
          if (!uid || uid === 'guest') return;

          const pct = r.percentage ?? (r.score / Math.max(1, r.totalQuestions)) * 100;
          examCounts[uid] = (examCounts[uid] || 0) + 1;
          scoreSums[uid] = (scoreSums[uid] || 0) + pct;
        });

        // Update studentMap with calculated stats
        studentMap.forEach((st, uid) => {
          const count = examCounts[uid] || 0;
          const sum = scoreSums[uid] || 0;
          st.examsCount = count;
          st.avgScore = count > 0 ? Math.round(sum / count) : 0;
          if (st.points === 0 && count > 0) {
            st.points = Math.round(sum * 10);
          }
        });
      } catch (err) {
        console.warn('Could not aggregate all results', err);
      }

      let list = Array.from(studentMap.values());

      // If database is new/empty, provide inspiring demo leaderboard preview
      if (list.length < 3) {
        list = [
          { id: '1', name: 'أحمد نبيل العولقي', points: 3450, examsCount: 28, avgScore: 98, gradeLevel: 'sec3Scientific' },
          { id: '2', name: 'سارة عبدالرحمن الأهدل', points: 3200, examsCount: 25, avgScore: 96, gradeLevel: 'sec3Scientific' },
          { id: '3', name: 'محمد خالد الوصابي', points: 2950, examsCount: 23, avgScore: 94, gradeLevel: 'grade9' },
          { id: '4', name: 'فاطمة هشام الحرازي', points: 2800, examsCount: 21, avgScore: 92, gradeLevel: 'sec3Literary' },
          { id: '5', name: 'أسامة ماجد البركاني', points: 2600, examsCount: 19, avgScore: 90, gradeLevel: 'sec3Scientific' },
          { id: '6', name: 'رغد فؤاد الشميري', points: 2450, examsCount: 18, avgScore: 89, gradeLevel: 'grade9' },
        ];
      }

      // Sort by points descending
      list.sort((a, b) => b.points - a.points);
      list.forEach((st, idx) => {
        st.rank = idx + 1;
      });

      setStudents(list);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = gradeFilter === 'all' || s.gradeLevel === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [students, searchQuery, gradeFilter]);

  const top1 = filteredStudents[0];
  const top2 = filteredStudents[1];
  const top3 = filteredStudents[2];
  const remaining = filteredStudents.slice(3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-6 md:p-8 text-white shadow-soft text-center relative overflow-hidden">
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md mb-2">
            <Trophy className="w-4 h-4 text-yellow-200" />
            <span>لوحة الصدارة 🏆</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            ترتيب الطلاب الأكثر تفاعلاً وتميزاً
          </h1>
          <p className="text-xs md:text-sm text-amber-100">
            تكريم الطلاب الأكثر اجتهاداً وحلاً للاختبارات الوزارية والتحديات.
          </p>
        </div>
      </div>

      {/* Grade Filters & Search */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-soft border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setGradeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              gradeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الترتيب العام
          </button>
          <button
            onClick={() => setGradeFilter('grade9')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              gradeFilter === 'grade9'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الصف التاسع
          </button>
          <button
            onClick={() => setGradeFilter('sec3Scientific')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              gradeFilter === 'sec3Scientific'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ثالث ثانوي (علمي)
          </button>
          <button
            onClick={() => setGradeFilter('sec3Literary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              gradeFilter === 'sec3Literary'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ثالث ثانوي (أدبي)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن طالب..."
            className="w-full pl-3 pr-10 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">جاري احتساب النقاط وتحديث لوحة الصدارة...</span>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (Desktop & Tablet) */}
          {filteredStudents.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-8 pb-4 max-w-2xl mx-auto">
              {/* Rank 2 (Silver) */}
              <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-soft text-center flex flex-col items-center order-1">
                <div className="relative mb-2">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-black text-slate-700 text-base md:text-lg">
                    {top2.name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-sm">
                    2
                  </span>
                </div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 line-clamp-1 mt-2">
                  {top2.name}
                </h4>
                <span className="text-[11px] font-bold text-amber-600 mt-1">
                  {toEnDigits(top2.points)} نقطة
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {toEnDigits(top2.examsCount)} اختبار
                </span>
              </div>

              {/* Rank 1 (Gold - Taller Podium) */}
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-5 md:p-6 border-2 border-amber-300 shadow-lg text-center flex flex-col items-center order-2 -translate-y-4">
                <Crown className="w-7 h-7 text-amber-500 mb-1 animate-bounce" />
                <div className="relative mb-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-100 border-3 border-amber-400 flex items-center justify-center font-black text-amber-800 text-lg md:text-2xl shadow-sm">
                    {top1.name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-sm">
                    1
                  </span>
                </div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 line-clamp-1 mt-2">
                  {top1.name}
                </h4>
                <span className="text-xs font-black text-amber-600 mt-1">
                  {toEnDigits(top1.points)} نقطة
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {toEnDigits(top1.examsCount)} اختبار • متوسط {toEnDigits(top1.avgScore)}%
                </span>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-soft text-center flex flex-col items-center order-3">
                <div className="relative mb-2">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center font-black text-amber-800 text-base md:text-lg">
                    {top3.name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    3
                  </span>
                </div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 line-clamp-1 mt-2">
                  {top3.name}
                </h4>
                <span className="text-[11px] font-bold text-amber-600 mt-1">
                  {toEnDigits(top3.points)} نقطة
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {toEnDigits(top3.examsCount)} اختبار
                </span>
              </div>
            </div>
          )}

          {/* Full Ranked List */}
          <div className="bg-white rounded-3xl p-4 md:p-6 shadow-soft border border-slate-200 divide-y divide-slate-100">
            {filteredStudents.map((st, idx) => {
              const rank = idx + 1;
              const isCurrentUser = currentUser?.id === st.id;

              return (
                <div
                  key={st.id}
                  className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                    isCurrentUser ? 'bg-amber-50/70 border border-amber-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-amber-950'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-800'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {toEnDigits(rank)}
                    </span>

                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                      {st.name.charAt(0)}
                    </div>

                    <div>
                      <h4 className="text-xs md:text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>{st.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                            أنت
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        تم إنجاز {toEnDigits(st.examsCount)} اختبار • متوسط {toEnDigits(st.avgScore)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs md:text-sm font-black text-amber-600 block">
                      {toEnDigits(st.points)} نقطة
                    </span>
                    <span className="text-[10px] text-slate-400">نقاط التميز</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};