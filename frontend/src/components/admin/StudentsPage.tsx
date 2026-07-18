import React from 'react';
import { Users, Search, Filter, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Class, Student } from '../../types';
import { t } from '../../i18n';

interface StudentsPageProps {
  students: Student[];
  classes: Class[];
  filteredStudents: Student[];
  paginatedStudents: Student[];
  totalStudentPages: number;
  studentPage: number;
  studentsPerPage: number;
  studentSearch: string;
  studentClassFilter: string;
  setStudentSearch: React.Dispatch<React.SetStateAction<string>>;
  setStudentClassFilter: React.Dispatch<React.SetStateAction<string>>;
  setStudentPage: React.Dispatch<React.SetStateAction<number>>;
  onDeleteStudent: (id: string) => Promise<void>;
  onOpenCreateStudent: () => void;
  onOpenEditStudent: (student: Student) => Promise<void>;
}

export default function StudentsPage({
  students,
  classes,
  filteredStudents,
  paginatedStudents,
  totalStudentPages,
  studentPage,
  studentsPerPage,
  studentSearch,
  studentClassFilter,
  setStudentSearch,
  setStudentClassFilter,
  setStudentPage,
  onDeleteStudent,
  onOpenCreateStudent,
  onOpenEditStudent,
}: StudentsPageProps) {
  return (
    <div id="students-tab-view" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.manageStudentsTitle')}</h2>
          <p className="text-sm text-slate-500">{t('admin.manageStudentsDescription')}</p>
        </div>
        <button
          type="button"
          id="add-student-btn"
          onClick={onOpenCreateStudent}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
        >
          <UserPlus className="w-4 h-4" />
          {t('admin.enrollStudent')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="student-search-input"
            type="text"
            placeholder={t('admin.studentSearchPlaceholder')}
            value={studentSearch}
            onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-slate-800 transition-colors"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-48">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <select
              id="student-class-filter"
              value={studentClassFilter}
              onChange={(e) => { setStudentClassFilter(e.target.value); setStudentPage(1); }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{t('admin.allClasses')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">{t('admin.name')}</th>
                <th className="py-4 px-6">{t('admin.rollNumber')}</th>
                <th className="py-4 px-6">{t('admin.email')}</th>
                <th className="py-4 px-6">{t('admin.classAssignment')}</th>
                <th className="py-4 px-6">{t('admin.gender')}</th>
                <th className="py-4 px-6 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {paginatedStudents.map(student => {
                const allClassIds = Array.from(new Set([student.classId, ...(student.classIds || [])].filter(Boolean)));
                const studentClasses = classes.filter(c => allClassIds.includes(c.id));
                return (
                  <tr key={student.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{student.name}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-500">{student.rollNumber}</td>
                    <td className="py-3.5 px-6 text-slate-500">{student.email}</td>
                    <td className="py-3.5 px-6">
                      {studentClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {studentClasses.map(cls => (
                            <span key={cls.id} className="py-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold">
                              {cls.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="py-1 px-2.5 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold">
                          {t('admin.unassignedBadge')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{t(`admin.gender${student.gender}` as any)}</td>
                    <td className="py-3.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenEditStudent(student)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer inline-flex"
                        title={t('admin.editStudent')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t('admin.removeStudentConfirm', { studentName: student.name }))) {
                            onDeleteStudent(student.id);
                            if (paginatedStudents.length === 1 && studentPage > 1) {
                              setStudentPage(studentPage - 1);
                            }
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer inline-flex"
                        title={t('admin.deleteStudent')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2.5 stroke-1 text-slate-300" />
                    {t('admin.noStudentsMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {t('admin.showingStudents', {
                start: Math.min(filteredStudents.length, (studentPage - 1) * studentsPerPage + 1),
                end: Math.min(filteredStudents.length, studentPage * studentsPerPage),
                total: filteredStudents.length,
              })}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={studentPage === 1}
                onClick={() => setStudentPage(studentPage - 1)}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                {t('admin.prev')}
              </button>
              {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setStudentPage(p)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    studentPage === p ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={studentPage === totalStudentPages}
                onClick={() => setStudentPage(studentPage + 1)}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                {t('admin.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
