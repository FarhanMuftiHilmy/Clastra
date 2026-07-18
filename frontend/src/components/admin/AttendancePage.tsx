import React from 'react';
import { Filter, Search, Calendar, Download, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { Class } from '../../types';
import { t } from '../../i18n';

interface AttendanceLogItem {
  id: string;
  date: string;
  className: string;
  studentName: string;
  rollNumber: string;
  status: 'Present' | 'Sick' | 'Excused' | 'Absent';
  submittedBy: string;
}

interface AttendancePageProps {
  classes: Class[];
  filteredAttendanceLogs: AttendanceLogItem[];
  attendanceSearch: string;
  attendanceClassFilter: string;
  attendanceDateFilter: string;
  attendanceStatusFilter: string;
  setAttendanceSearch: React.Dispatch<React.SetStateAction<string>>;
  setAttendanceClassFilter: React.Dispatch<React.SetStateAction<string>>;
  setAttendanceDateFilter: React.Dispatch<React.SetStateAction<string>>;
  setAttendanceStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  onExportAttendance: () => void;
  onRefreshAttendance: () => Promise<void>;
  isRefreshingAttendance: boolean;
}

export default function AttendancePage({
  classes,
  filteredAttendanceLogs,
  attendanceSearch,
  attendanceClassFilter,
  attendanceDateFilter,
  attendanceStatusFilter,
  setAttendanceSearch,
  setAttendanceClassFilter,
  setAttendanceDateFilter,
  setAttendanceStatusFilter,
  onExportAttendance,
  onRefreshAttendance,
  isRefreshingAttendance,
}: AttendancePageProps) {
  const attendanceStatusLabels: Record<AttendanceLogItem['status'], string> = {
    Present: t('admin.attendanceStatusPresent'),
    Sick: t('admin.attendanceStatusSick'),
    Excused: t('admin.attendanceStatusExcused'),
    Absent: t('admin.attendanceStatusAbsent'),
  };

  const formatClassLabel = (cls: Class) => `Grade ${cls.grade} - ${cls.name}`;

  return (
    <div id="attendance-tab-view" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.attendancePageTitle')}</h2>
          <p className="text-sm text-slate-500">{t('admin.attendancePageDescription')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="refresh-attendance-btn"
            onClick={onRefreshAttendance}
            disabled={isRefreshingAttendance}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" />
            {isRefreshingAttendance ? t('admin.attendanceRefreshing') : t('admin.attendanceRefreshLedger')}
          </button>

          <button
            type="button"
            id="export-attendance-btn"
            onClick={onExportAttendance}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
          >
            <Download className="w-4 h-4" />
            {t('admin.attendanceExportCsv')}
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          {t('admin.attendanceFilterHeading')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              id="attendance-search-student"
              type="text"
              placeholder={t('admin.attendanceSearchPlaceholder')}
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </div>

          <div>
            <select
              id="attendance-class-dropdown"
              value={attendanceClassFilter}
              onChange={(e) => setAttendanceClassFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{t('admin.attendanceAllClasses')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{formatClassLabel(c)}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <input
              id="attendance-date-picker"
              type="date"
              value={attendanceDateFilter}
              onChange={(e) => setAttendanceDateFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              id="attendance-status-dropdown"
              value={attendanceStatusFilter}
              onChange={(e) => setAttendanceStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{t('admin.attendanceAllStatuses')}</option>
              <option value="Present">{t('admin.attendanceStatusPresent')}</option>
              <option value="Sick">{t('admin.attendanceStatusSick')}</option>
              <option value="Excused">{t('admin.attendanceStatusExcused')}</option>
              <option value="Absent">{t('admin.attendanceStatusAbsent')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">{t('admin.attendanceHeaderDate')}</th>
                <th className="py-4 px-6">{t('admin.attendanceHeaderClass')}</th>
                <th className="py-4 px-6">{t('admin.attendanceHeaderStudent')}</th>
                <th className="py-4 px-6">{t('admin.attendanceHeaderRoll')}</th>
                <th className="py-4 px-6">{t('admin.attendanceHeaderStatus')}</th>
                <th className="py-4 px-6">{t('admin.attendanceHeaderRegisteredBy')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredAttendanceLogs.map((log) => {
                let badgeStyle = '';
                if (log.status === 'Present') badgeStyle = 'bg-emerald-50 text-emerald-700';
                else if (log.status === 'Sick') badgeStyle = 'bg-amber-50 text-amber-700';
                else if (log.status === 'Excused') badgeStyle = 'bg-blue-50 text-blue-700';
                else if (log.status === 'Absent') badgeStyle = 'bg-red-50 text-red-700';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-900">{log.date}</td>
                    <td className="py-3 px-6 font-semibold">{log.className}</td>
                    <td className="py-3 px-6 text-slate-800">{log.studentName}</td>
                    <td className="py-3 px-6 font-mono text-slate-500">{log.rollNumber}</td>
                    <td className="py-3 px-6">
                      <span className={`py-1 px-2.5 rounded-lg text-[11px] font-bold ${badgeStyle}`}>
                        {attendanceStatusLabels[log.status]}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-500 font-medium">{log.submittedBy}</td>
                  </tr>
                );
              })}
              {filteredAttendanceLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2.5 stroke-1 text-slate-300" />
                    {t('admin.attendanceNoMatchingLogs')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
