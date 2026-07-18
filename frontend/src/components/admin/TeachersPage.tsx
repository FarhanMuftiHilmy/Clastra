import React from 'react';
import { UserCheck, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Teacher } from '../../types';
import { t } from '../../i18n';

interface TeachersPageProps {
  teachers: Teacher[];
  onDeleteTeacher: (id: string) => Promise<void>;
  onOpenCreateTeacher: () => void;
  onOpenEditTeacher: (teacher: Teacher) => void;
}

export default function TeachersPage({ teachers, onDeleteTeacher, onOpenCreateTeacher, onOpenEditTeacher }: TeachersPageProps) {
  return (
    <div id="teachers-tab-view" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.manageTeachersTitle')}</h2>
          <p className="text-sm text-slate-500">{t('admin.manageTeachersDescription')}</p>
        </div>
        <button
          type="button"
          id="add-teacher-btn"
          onClick={onOpenCreateTeacher}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
        >
          <UserPlus className="w-4 h-4" />
          {t('admin.addTeacherButton')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">{t('admin.name')}</th>
                <th className="py-4 px-6">{t('admin.email')}</th>
                <th className="py-4 px-6">{t('admin.teacherFormSubject')}</th>
                <th className="py-4 px-6 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {teachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-slate-50/55 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">{teacher.name}</td>
                  <td className="py-3.5 px-6 text-slate-500">{teacher.email}</td>
                  <td className="py-3.5 px-6">
                    <span className="py-1 px-2.5 bg-violet-50 text-violet-700 rounded-lg text-[11px] font-bold">
                      {teacher.subject}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenEditTeacher(teacher)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer inline-flex"
                      title={t('admin.teacherEditTitle')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('admin.deleteTeacherConfirm', { teacherName: teacher.name }))) {
                          onDeleteTeacher(teacher.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer inline-flex"
                      title={t('admin.teacherDeleteTitle')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-slate-400 text-xs">
                    <UserCheck className="w-8 h-8 mx-auto mb-2.5 stroke-1 text-slate-300" />
                    {t('admin.noTeachersRegistered')}
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
