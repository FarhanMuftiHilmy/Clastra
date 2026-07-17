import React from 'react';
import { School, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Class, Student, Teacher } from '../../types';

interface ClassesPageProps {
  classes: Class[];
  students: Student[];
  teachers: Teacher[];
  filteredClasses: Class[];
  classSearch: string;
  setClassSearch: React.Dispatch<React.SetStateAction<string>>;
  onDeleteClass: (id: string) => Promise<void>;
  onOpenCreateClass: () => void;
  onOpenEditClass: (cls: Class) => void;
}

export default function ClassesPage({
  classes,
  students,
  teachers,
  filteredClasses,
  classSearch,
  setClassSearch,
  onDeleteClass,
  onOpenCreateClass,
  onOpenEditClass,
}: ClassesPageProps) {
  return (
    <div id="classes-tab-view" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Classes</h2>
          <p className="text-sm text-slate-500">Set up curriculum classes, allocate rooms, and assign primary instructors</p>
        </div>
        <button
          type="button"
          id="add-class-btn"
          onClick={onOpenCreateClass}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" />
          Create New Class
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="class-search-input"
            type="text"
            placeholder="Search by class name, grade, room number, or teacher name..."
            value={classSearch}
            onChange={(e) => setClassSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-slate-800 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClasses.map(cls => {
          const teacher = teachers.find(t => t.id === cls.teacherId);
          const classStudents = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id));

          return (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <span className="py-1 px-2.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                    Grade {cls.grade} • {cls.room}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{cls.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenEditClass(cls)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Edit Class"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deleting class ${cls.name} will unassign its students. Continue?`)) {
                        onDeleteClass(cls.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete Class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Instructor</p>
                  <p className="font-bold text-slate-800">{teacher ? teacher.name : 'Unassigned Class'}</p>
                </div>
                {teacher && (
                  <span className="py-0.5 px-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                    {teacher.subject}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Student Roster ({classStudents.length} enrolled)</span>
                  <span>Ratio: {classStudents.length}/30</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(classStudents.length / 30) * 100}%` }}></div>
                </div>
                {classStudents.length > 0 ? (
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {classStudents.map(s => s.name).join(', ')}
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-500 font-medium">Empty roster. Assign students under "Manage Students".</p>
                )}
              </div>
            </div>
          );
        })}
        {filteredClasses.length === 0 && (
          <div className="col-span-2 py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <School className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300" />
            No classes configured. Tap "Create New Class" to begin.
          </div>
        )}
      </div>
    </div>
  );
}
