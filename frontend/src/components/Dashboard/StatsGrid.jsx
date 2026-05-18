import React from "react";
import { motion } from "framer-motion";

export default function StatsGrid({ stats }) {
 return (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <motion.div
 key={stat.label}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.08 }}
 className="relative overflow-hidden rounded-xl glass-card-premium border border-divider p-5"
 >
 <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${stat.color} opacity-5 transform translate-x-8 -translate-y-8`} />
 <div className="flex items-start justify-between">
 <div>
 <p className="text-xs font-medium uppercase tracking-wider text-secondary-blue">{stat.label}</p>
 <p className="text-2xl font-bold mt-1 text-primary-dark ">{stat.value}</p>
 </div>
 <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
 <stat.icon className={`w-4 h-4 ${stat.color.replace("bg-", "text-")}`} />
 </div>
 </div>
 {stat.change && (
 <p className={`text-xs mt-2 ${stat.change > 0 ? "text-primary-dark0" : "text-rose-500"}`}>
 {stat.change > 0 ? "↑" : "↓"} {Math.abs(stat.change)}% from last period
 </p>
 )}
 </motion.div>
 ))}
 </div>
 );
}
