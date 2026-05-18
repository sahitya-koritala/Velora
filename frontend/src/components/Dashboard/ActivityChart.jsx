import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_DATA = [
 { day: "Mon", queries: 45, successful: 38 },
 { day: "Tue", queries: 62, successful: 55 },
 { day: "Wed", queries: 78, successful: 70 },
 { day: "Thu", queries: 56, successful: 48 },
 { day: "Fri", queries: 91, successful: 82 },
 { day: "Sat", queries: 34, successful: 30 },
 { day: "Sun", queries: 28, successful: 25 },
];

export default function ActivityChart({ data = MOCK_DATA }) {
 return (
 <div className="glass-card-premium rounded-xl border border-divider p-5">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-semibold text-primary-dark ">Search Activity</h3>
 <p className="text-xs text-secondary-blue mt-0.5">Queries over the last 7 days</p>
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
 <ResponsiveContainer width="100%" height={220}>
 <AreaChart data={data}>
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
 <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
 <Tooltip
 contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
 />
 <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} fill="url(#colorQueries)" />
 <Area type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} fill="url(#colorSuccessful)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 );
}
