import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const EMPTY_WEEK = [
  { day: "Mon", queries: 0, successful: 0 },
  { day: "Tue", queries: 0, successful: 0 },
  { day: "Wed", queries: 0, successful: 0 },
  { day: "Thu", queries: 0, successful: 0 },
  { day: "Fri", queries: 0, successful: 0 },
  { day: "Sat", queries: 0, successful: 0 },
  { day: "Sun", queries: 0, successful: 0 },
];

export default function ActivityChart({ data, loading }) {
  const chartData = data?.length > 0 ? data : EMPTY_WEEK;
  const totalWeek = chartData.reduce((sum, d) => sum + (d.queries || 0), 0);

  return (
    <div className="glass-card-premium rounded-xl border border-divider p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-primary-dark">Search Activity</h3>
          <p className="text-xs text-secondary-blue mt-0.5">
            {loading
              ? "Loading search data..."
              : `${totalWeek} searches in the last 7 days (documents not included)`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-secondary-blue">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-secondary-blue">Successful</span>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-secondary-blue animate-pulse">
          Updating chart...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSuccessful" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} fill="url(#colorQueries)" />
            <Area type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} fill="url(#colorSuccessful)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
