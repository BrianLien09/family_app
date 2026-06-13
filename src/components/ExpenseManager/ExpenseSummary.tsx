import { useMemo } from 'react';
import { ExpenseItem, FamilyMember, MEMBER_COLORS } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';

interface ExpenseSummaryProps {
  expenses: ExpenseItem[];
  selectedMember: FamilyMember | '全體';
}

export default function ExpenseSummary({ expenses, selectedMember }: ExpenseSummaryProps) {
  // 1. 計算總覽數字
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    expenses.forEach(item => {
      if (item.type === 'income') income += item.amount;
      else expense += item.amount;
    });
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    };
  }, [expenses]);

  // 2. 圓餅圖資料
  const pieData = useMemo(() => {
    const expenseOnly = expenses.filter(e => e.type === 'expense');
    
    if (selectedMember === '全體') {
      // 全體視角：看「誰花最多」
      const memberMap: Record<string, number> = {};
      expenseOnly.forEach(e => {
        memberMap[e.member] = (memberMap[e.member] || 0) + e.amount;
      });
      return Object.entries(memberMap)
        .map(([name, value]) => ({ name, value, color: MEMBER_COLORS[name as FamilyMember] }))
        .sort((a, b) => b.value - a.value);
    } else {
      // 個人視角：看「花在哪裡」
      const catMap: Record<string, number> = {};
      expenseOnly.forEach(e => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      });
      // 給分類隨機產生一些好看的顏色
      const COLORS = ['#fb7185', '#f472b6', '#c084fc', '#818cf8', '#38bdf8', '#2dd4bf', '#34d399', '#a3e635', '#facc15', '#fb923c'];
      return Object.entries(catMap)
        .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
        .sort((a, b) => b.value - a.value);
    }
  }, [expenses, selectedMember]);

  // 3. 折線圖資料（每日收支趨勢）
  const lineData = useMemo(() => {
    const dateMap: Record<string, { date: string, income: number, expense: number }> = {};
    
    // 先找出範圍內的所有日期並排序
    const dates = Array.from(new Set(expenses.map(e => e.date))).sort();
    
    dates.forEach(d => {
      dateMap[d] = { date: d.substring(5), income: 0, expense: 0 }; // 顯示 MM-DD
    });

    expenses.forEach(e => {
      if (e.type === 'income') {
        dateMap[e.date].income += e.amount;
      } else {
        dateMap[e.date].expense += e.amount;
      }
    });

    return Object.values(dateMap);
  }, [expenses]);

  return (
    <div className="space-y-6 mb-8">
      {/* 數字卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-center items-center text-center">
          <span className="text-xs sm:text-sm text-[#3d3a36] mb-1">總收入</span>
          <span className="text-lg sm:text-2xl font-bold text-[#5f7186]">${totalIncome.toLocaleString()}</span>
        </div>
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-center items-center text-center">
          <span className="text-xs sm:text-sm text-[#3d3a36] mb-1">總支出</span>
          <span className="text-lg sm:text-2xl font-bold text-[#b87e6b]">${totalExpense.toLocaleString()}</span>
        </div>
        <div className="glass-card p-4 sm:p-6 flex flex-col justify-center items-center text-center">
          <span className="text-xs sm:text-sm text-[#3d3a36] mb-1">結餘</span>
          <span className={`text-lg sm:text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-[#b87e6b]'}`}>
            ${balance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 圖表區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 圓餅圖 */}
        <div className="glass-card p-4 h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-[#3d3a36] mb-4">
            {selectedMember === '全體' ? '各成員支出佔比' : '支出分類分佈'}
          </h3>
          <div className="flex-1 relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#ffffff', border: '2px dashed #b87e6b', borderRadius: '12px', boxShadow: '0 8px 24px rgba(61, 58, 54, 0.12)' }}
                    itemStyle={{ color: '#3d3a36', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#3d3a36] text-sm">
                尚無支出紀錄
              </div>
            )}
          </div>
        </div>

        {/* 折線圖 */}
        <div className="glass-card p-4 h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-[#3d3a36] mb-4">每日收支趨勢</h3>
          <div className="flex-1 relative">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '2px dashed #b87e6b', borderRadius: '12px', boxShadow: '0 8px 24px rgba(61, 58, 54, 0.12)' }}
                    labelStyle={{ color: '#3d3a36', fontWeight: 'bold', marginBottom: '4px' }}
                    itemStyle={{ color: '#3d3a36' }}
                  />
                  <Line type="monotone" dataKey="expense" name="支出" stroke="#fb7185" strokeWidth={2} dot={{ r: 3, fill: '#fb7185' }} />
                  <Line type="monotone" dataKey="income" name="收入" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#3d3a36] text-sm">
                尚無紀錄
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
