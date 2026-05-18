import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { ShieldAlert, Activity, BarChart2, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function SecurityInsightsWidget() {
    const { data: logs = [] } = useQuery({
        queryKey: ['recent-audit-logs'],
        queryFn: () => [],
    });

    const criticalAlerts = logs.filter(l => l.severity === 'critical');
    const recentAlerts = criticalAlerts.slice(0, 3);

    // AI Summary Mock
    const summary = criticalAlerts.length > 0
        ? `System detected ${criticalAlerts.length} critical security events today, primarily related to rapid repeated searches and unauthorized access attempts.`
        : `Normal activity baseline. No critical security events detected today. Search volume is within bounds.`;

    return (
        <div className="glass-card-premium overflow-hidden mt-6 mb-8">
            <div className="p-4 border-b border-divider flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                    <ShieldAlert className="w-5 h-5" />
                    Security Insights & Alerts
                </div>
                <span className="text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-full flex items-center gap-1.5 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Live
                </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Alerts & Timeline */}
                <div className="md:col-span-2 space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-secondary-blue" /> Recent Suspicious Activity Timeline
                    </h4>

                    {recentAlerts.length > 0 ? (
                        <div className="space-y-4 pl-2 mt-4">
                            {recentAlerts.map((alert, i) => (
                                <div key={alert.id} className="relative flex items-start gap-4">
                                    <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-slate-200" style={{ display: i === recentAlerts.length - 1 ? 'none' : 'block' }} />
                                    <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-rose-500 bg-white mt-1 z-10" />
                                    <div className="flex-1 bg-white/50 p-3 rounded-lg border border-divider">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-slate-700 text-xs">{alert.user_id || 'Unknown'}</span>
                                            <time className="text-[10px] font-mono text-secondary-blue">{format(new Date(alert.created_date || Date.now()), "HH:mm:ss")}</time>
                                        </div>
                                        <p className="text-xs text-slate-600">{alert.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-white/50 rounded-lg border border-dashed border-divider">
                            <span className="text-sm text-primary-dark font-medium tracking-wide">CLEAR</span>
                            <p className="text-xs text-secondary-blue mt-1">No suspicious activity detected</p>
                        </div>
                    )}
                </div>

                {/* AI Summary and Heatmap */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-indigo-400" /> AI Threat Summary
                        </h4>
                        <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50 text-xs leading-relaxed text-indigo-800 font-medium">
                            {summary}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                            <BarChart2 className="w-4 h-4 text-amber-500" /> Activity Heatmap
                        </h4>
                        {/* Visual mock of a heatmap */}
                        <div className="grid grid-cols-6 gap-1 p-2 bg-white/50 rounded-lg border border-divider">
                            {Array.from({ length: 24 }).map((_, i) => {
                                const isHighActivity = logs.filter(l => new Date(l.created_date || Date.now()).getHours() === i).length > 2;
                                return (
                                    <div key={i} className={`h-4 rounded-sm transition-colors ${isHighActivity ? 'bg-indigo-500' : 'bg-slate-200 hover:bg-slate-300'}`} title={`Hour ${i}`} />
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-secondary-blue mt-1.5 px-1 font-mono">
                            <span>00:00</span>
                            <span>12:00</span>
                            <span>23:59</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
