import React from 'react';
import { Users, School, UserCheck, BarChart3, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Class, Teacher, AttendanceRecord } from '../../types';
import { asArray } from '../../utils/safe';

interface OverviewPageProps {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  overallAttendanceRate: number;
  classAttendanceData: Array<{ className: string; 'Attendance Rate (%)': number; 'Student Count': number }>;
  statusStats: Array<{ name: string; value: number; color: string }>;
  attendanceRecords: AttendanceRecord[];
  classes: Class[];
  teachers: Teacher[];
}

export default function OverviewPage({
  totalStudents,
  totalClasses,
  totalTeachers,
  overallAttendanceRate,
  classAttendanceData,
  statusStats,
  attendanceRecords,
  classes,
  teachers,
}: OverviewPageProps) {
  return (
    <div id="overview-tab-view" className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
        <p className="text-sm text-slate-500">Real-time indicators across Springfield High classes and demographics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{totalStudents}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Classes</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{totalClasses}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <School className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Teachers</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{totalTeachers}</h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Attendance</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{overallAttendanceRate}%</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-800">Class Attendance Performance</h4>
            <span className="text-[11px] text-indigo-600 bg-indigo-50 py-0.5 px-2 rounded-full font-semibold">Target: 95%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="className" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="Attendance Rate (%)" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <h4 className="text-sm font-bold text-slate-800">Attendance State Breakdown</h4>
          {statusStats.length > 0 ? (
            <>
              <div className="h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusStats} innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} instances`, 'Total']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{overallAttendanceRate}%</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Present Rate</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {statusStats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                    <span className="text-slate-500 font-medium">{stat.name}:</span>
                    <span className="text-slate-800 font-bold ml-auto">{stat.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-8">
              <AlertCircle className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              No submissions recorded yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3.5 p-5">
        <h4 className="text-sm font-bold text-slate-800">Latest Submissions</h4>
        <div className="divide-y divide-slate-100">
          {asArray(attendanceRecords).slice(-3).reverse().map((rec, idx) => {
            const cls = classes.find(c => c.id === rec?.classId);
            const teacher = teachers.find(t => t.id === rec?.submittedBy);
            const studentsForRecord = asArray(rec?.students);
            const presentCount = studentsForRecord.filter(s => s?.status === 'Present').length;
            const submittedAt = rec?.submittedAt ? new Date(rec.submittedAt).toLocaleDateString() : 'Unknown date';

            return (
              <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {cls?.name?.substring(0, 2) || 'CL'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{cls?.name || 'Classroom'}</h5>
                    <p className="text-[10px] text-slate-400">By {teacher?.name || 'Assigned Teacher'} • {submittedAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">{presentCount} / {studentsForRecord.length} Present</span>
                  <p className="text-[10px] text-emerald-500 font-bold">Submitted Successfully</p>
                </div>
              </div>
            );
          })}
          {attendanceRecords.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No attendance reports submitted today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
