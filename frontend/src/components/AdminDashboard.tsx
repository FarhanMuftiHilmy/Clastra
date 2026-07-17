/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, School, UserCheck, BarChart3, Download, Plus, Search, 
  Filter, Edit2, Trash2, Calendar, FileSpreadsheet, LogOut, Check, 
  X, AlertCircle, RefreshCw, Layers, Award, UserPlus, ArrowRight,
  GraduationCap, Shield
} from 'lucide-react';
import { Student, Class, Teacher, AttendanceRecord, AttendanceStatus, Admin } from '../types';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, LineChart, Line, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import AdminManagement from './AdminManagement';

interface AdminDashboardProps {
  students: Student[];
  classes: Class[];
  teachers: Teacher[];
  admins: Admin[];
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (student: Omit<Student, 'id'>, classIds?: string[]) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onAssignStudentToClass: (studentId: string, classId: string) => Promise<void>;
  onRemoveStudentFromClass: (studentId: string, classId: string) => Promise<void>;
  onGetStudentClassIds: (studentId: string) => Promise<string[]>;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  onUpdateTeacher: (teacher: Teacher) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onAddAdmin: (admin: Omit<Admin, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateAdmin: (admin: Admin) => Promise<void>;
  onDeleteAdmin: (id: string) => Promise<void>;
  onAddClass: (cls: Omit<Class, 'id'>) => Promise<void>;
  onUpdateClass: (cls: Class) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
  onLogout: () => void;
  adminName: string;
  currentAdminRole?: 'super' | 'limited' | null;
}

type TabType = 'overview' | 'students' | 'classes' | 'teachers' | 'admins' | 'attendance' | 'reports';

export default function AdminDashboard({
  students: studentsProp,
  classes: classesProp,
  teachers: teachersProp,
  admins: adminsProp,
  attendanceRecords: attendanceRecordsProp,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAssignStudentToClass,
  onRemoveStudentFromClass,
  onGetStudentClassIds,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onLogout,
  adminName,
  currentAdminRole,
}: AdminDashboardProps) {
  const students = studentsProp ?? [];
  const classes = classesProp ?? [];
  const teachers = teachersProp ?? [];
  const admins = adminsProp ?? [];
  const attendanceRecords = attendanceRecordsProp ?? [];
  const canEditAdmins = currentAdminRole === 'super';
  const adminRoleLabel = currentAdminRole === 'super' ? 'Super Admin' : currentAdminRole === 'limited' ? 'Limited Admin' : 'Administrator';

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // --- Search / Filters State ---
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 8;

  const [classSearch, setClassSearch] = useState('');

  const [attendanceClassFilter, setAttendanceClassFilter] = useState('all');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // --- Modal Forms State ---
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNumber: '',
    email: '',
    classId: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
  });
  const [studentFormError, setStudentFormError] = useState<string | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [prevClassIds, setPrevClassIds] = useState<string[]>([]);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    subject: '',
  });
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classForm, setClassForm] = useState({
    name: '',
    grade: '',
    room: '',
    teacherId: '',
  });
  const [classFormError, setClassFormError] = useState<string | null>(null);

  // --- STATS COMPUTATIONS ---
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const totalTeachers = teachers.length;

  // Compute Overall Attendance Rate
  const overallAttendanceRate = useMemo(() => {
    if (attendanceRecords.length === 0) return 0;
    let totalPresentCount = 0;
    let totalStudentCount = 0;

    attendanceRecords.forEach(record => {
      record.students.forEach(s => {
        totalStudentCount++;
        if (s.status === 'Present') {
          totalPresentCount++;
        }
      });
    });

    return totalStudentCount > 0 ? Math.round((totalPresentCount / totalStudentCount) * 100) : 0;
  }, [attendanceRecords]);

  // Compute stats per status
  const statusStats = useMemo(() => {
    let present = 0;
    let sick = 0;
    let excused = 0;
    let absent = 0;

    attendanceRecords.forEach(record => {
      record.students.forEach(s => {
        if (s.status === 'Present') present++;
        else if (s.status === 'Sick') sick++;
        else if (s.status === 'Excused') excused++;
        else if (s.status === 'Absent') absent++;
      });
    });

    const total = present + sick + excused + absent;
    if (total === 0) return [];

    return [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Sick', value: sick, color: '#f59e0b' },
      { name: 'Excused', value: excused, color: '#3b82f6' },
      { name: 'Absent', value: absent, color: '#ef4444' },
    ];
  }, [attendanceRecords]);

  // Class wise attendance rate
  const classAttendanceData = useMemo(() => {
    return classes.map(cls => {
      const clsRecords = attendanceRecords.filter(r => r.classId === cls.id);
      let present = 0;
      let total = 0;

      clsRecords.forEach(record => {
        record.students.forEach(s => {
          total++;
          if (s.status === 'Present') present++;
        });
      });

      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const clsStudentsCount = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id)).length;

      return {
        className: cls.name,
        'Attendance Rate (%)': rate,
        'Student Count': clsStudentsCount,
      };
    });
  }, [classes, attendanceRecords, students]);

  // Attendance over time (line chart)
  const attendanceOverTime = useMemo(() => {
    const uniqueDates = Array.from(new Set(attendanceRecords.map(r => r.date))).sort();

    return uniqueDates.map(date => {
      const dateRecords = attendanceRecords.filter(r => r.date === date);
      let present = 0;
      let total = 0;

      dateRecords.forEach(record => {
        record.students.forEach(s => {
          total++;
          if (s.status === 'Present') present++;
        });
      });

      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const parsedDate = new Date(date);
      const formattedDate = parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        date: formattedDate,
        'Attendance Rate (%)': rate,
      };
    });
  }, [attendanceRecords]);

  // --- FILTERED DATA SETS ---

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearch.toLowerCase());
      
      const matchesClass = studentClassFilter === 'all' || student.classId === studentClassFilter || student.classIds?.includes(studentClassFilter);

      return matchesSearch && matchesClass;
    });
  }, [students, studentSearch, studentClassFilter]);

  // Paginated Students
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, studentPage]);

  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const teacher = teachers.find(t => t.id === cls.teacherId);
      const teacherName = teacher ? teacher.name : 'Unassigned';
      return (
        cls.name.toLowerCase().includes(classSearch.toLowerCase()) ||
        cls.room.toLowerCase().includes(classSearch.toLowerCase()) ||
        cls.grade.includes(classSearch) ||
        teacherName.toLowerCase().includes(classSearch.toLowerCase())
      );
    });
  }, [classes, classSearch, teachers]);

  // Expanded individual attendance logs flat-map
  const flatAttendanceLogs = useMemo(() => {
    const logs: {
      id: string;
      date: string;
      className: string;
      studentName: string;
      rollNumber: string;
      status: AttendanceStatus;
      submittedBy: string;
    }[] = [];

    attendanceRecords.forEach(record => {
      const cls = classes.find(c => c.id === record.classId);
      const teacher = teachers.find(t => t.id === record.submittedBy);
      const className = cls ? cls.name : 'Unknown Class';
      const teacherName = teacher ? teacher.name : 'Unknown Teacher';

      record.students.forEach(s => {
        const student = students.find(std => std.id === s.studentId);
        if (!student) return;

        logs.push({
          id: `${record.id}_${s.studentId}`,
          date: record.date,
          className,
          studentName: student.name,
          rollNumber: student.rollNumber,
          status: s.status,
          submittedBy: teacherName,
        });
      });
    });

    // Sort by date descending
    return logs.sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, classes, teachers, students]);

  // Filtered Attendance Logs
  const filteredAttendanceLogs = useMemo(() => {
    return flatAttendanceLogs.filter(log => {
      // Find class id for current log
      const cls = classes.find(c => c.name === log.className);
      const matchesClass = attendanceClassFilter === 'all' || (cls && cls.id === attendanceClassFilter);
      const matchesDate = !attendanceDateFilter || log.date === attendanceDateFilter;
      const matchesStatus = attendanceStatusFilter === 'all' || log.status === attendanceStatusFilter;
      const matchesSearch = 
        log.studentName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        log.rollNumber.toLowerCase().includes(attendanceSearch.toLowerCase());

      return matchesClass && matchesDate && matchesStatus && matchesSearch;
    });
  }, [flatAttendanceLogs, classes, attendanceClassFilter, attendanceDateFilter, attendanceStatusFilter, attendanceSearch]);

  // --- ACTIONS HANDLERS ---

  // Handle student create / update
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError(null);

    // Validations
    if (!studentForm.name.trim()) return setStudentFormError('Full Name is required');
    if (!studentForm.rollNumber.trim()) return setStudentFormError('Roll Number/Student ID is required');
    if (!studentForm.email.trim() || !studentForm.email.includes('@')) return setStudentFormError('Enter a valid email address');
    if (!editingStudent && selectedClassIds.length === 0) return setStudentFormError('Please select at least one class');

    // Roll number uniqueness validation (excluding current student being edited)
    const rollDup = students.some(s => 
      s.rollNumber.toLowerCase() === studentForm.rollNumber.toLowerCase() && 
      (!editingStudent || s.id !== editingStudent.id)
    );
    if (rollDup) return setStudentFormError('This Roll Number is already registered');

    try {
      if (editingStudent) {
        // set primary class to first selected
        const primaryClass = selectedClassIds[0] || '';
        await onUpdateStudent({
          ...editingStudent,
          ...studentForm,
          classId: primaryClass,
        });

        // reconcile class assignments
        const toAdd = selectedClassIds.filter(id => !prevClassIds.includes(id));
        const toRemove = prevClassIds.filter(id => !selectedClassIds.includes(id));
        await Promise.all([
          ...toAdd.map(cid => onAssignStudentToClass(editingStudent.id, cid)),
          ...toRemove.map(cid => onRemoveStudentFromClass(editingStudent.id, cid)),
        ]);
      } else {
        const primaryClass = selectedClassIds[0] || '';
        await onAddStudent({ ...studentForm, classId: primaryClass }, selectedClassIds);
      }

      setIsStudentModalOpen(false);
      setEditingStudent(null);
      setStudentForm({ name: '', rollNumber: '', email: '', classId: '', gender: 'Male' });
      setSelectedClassIds([]);
      setPrevClassIds([]);
    } catch (error: any) {
      setStudentFormError(error?.message || 'Failed to save student assignment.');
    }
  };

  const handleOpenEditStudent = async (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      classId: student.classId,
      gender: student.gender,
    });
    setStudentFormError(null);
    // load current class joins and include the primary class assignment
    try {
      const classIds = await onGetStudentClassIds(student.id);
      const currentClassIds = Array.from(new Set([student.classId, ...(classIds || [])].filter(Boolean)));
      setSelectedClassIds(currentClassIds);
      setPrevClassIds(currentClassIds);
    } catch (e) {
      setSelectedClassIds(student.classId ? [student.classId] : []);
      setPrevClassIds(student.classId ? [student.classId] : []);
    }
    setIsStudentModalOpen(true);
  };

  const handleTeacherFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherFormError(null);

    if (!teacherForm.name.trim()) return setTeacherFormError('Teacher name is required');
    if (!teacherForm.email.trim() || !teacherForm.email.includes('@')) return setTeacherFormError('Enter a valid email address');
    if (!teacherForm.subject.trim()) return setTeacherFormError('Subject is required');

    const emailDup = teachers.some(t => t.email.toLowerCase() === teacherForm.email.toLowerCase() && (!editingTeacher || t.id !== editingTeacher.id));
    if (emailDup) return setTeacherFormError('This email is already registered');

    if (editingTeacher) {
      onUpdateTeacher({ ...editingTeacher, ...teacherForm });
    } else {
      onAddTeacher(teacherForm);
    }

    setIsTeacherModalOpen(false);
    setEditingTeacher(null);
    setTeacherForm({ name: '', email: '', subject: '' });
  };

  const handleOpenEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setTeacherForm({ name: t.name, email: t.email, subject: t.subject });
    setTeacherFormError(null);
    setIsTeacherModalOpen(true);
  };

  // Handle Class Form Submit
  const handleClassFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassFormError(null);

    if (!classForm.name.trim()) return setClassFormError('Class Name is required');
    if (!classForm.grade.trim()) return setClassFormError('Grade level is required');
    if (!classForm.room.trim()) return setClassFormError('Room identifier is required');

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        name: classForm.name,
        grade: classForm.grade,
        room: classForm.room,
        teacherId: classForm.teacherId || null,
      });
    } else {
      onAddClass({
        name: classForm.name,
        grade: classForm.grade,
        room: classForm.room,
        teacherId: classForm.teacherId || null,
      });
    }

    setIsClassModalOpen(false);
    setEditingClass(null);
    setClassForm({ name: '', grade: '', room: '', teacherId: '' });
  };

  const handleOpenEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      grade: cls.grade,
      room: cls.room,
      teacherId: cls.teacherId || '',
    });
    setClassFormError(null);
    setIsClassModalOpen(true);
  };

  // Export Attendance Reports to Excel (simulated standard CSV download)
  const handleExportAttendance = () => {
    if (filteredAttendanceLogs.length === 0) {
      alert("No attendance records match current filters to export.");
      return;
    }

    // Prepare CSV Content
    const headers = ['Date', 'Class Name', 'Student Name', 'Roll Number', 'Attendance Status', 'Submitted By'];
    const rows = filteredAttendanceLogs.map(log => [
      log.date,
      `"${log.className.replace(/"/g, '""')}"`,
      `"${log.studentName.replace(/"/g, '""')}"`,
      log.rollNumber,
      log.status,
      `"${log.submittedBy.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const filterDesc = attendanceClassFilter !== 'all' ? `_class_${attendanceClassFilter}` : '';
    const dateDesc = attendanceDateFilter ? `_${attendanceDateFilter}` : '';
    link.setAttribute("download", `school_attendance_report${filterDesc}${dateDesc}.csv`);
    document.body.appendChild(link); // Required for FF

    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-dashboard-root" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <header id="admin-header" className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 leading-none tracking-tight">ScholaSync</span>
              <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md font-extrabold px-1.5 py-0.5 uppercase tracking-wide">ADMIN</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Springfield Academy Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-slate-800 leading-none">{adminName}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">Super Administrator</span>
          </div>
          <button
            type="button"
            id="admin-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-2 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside id="admin-sidebar" className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 shrink-0">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6">Navigation</div>
            <nav className="space-y-1">
              <button
                type="button"
                id="sidebar-tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'overview' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <Layers className="w-4 h-4" />
                System Overview
              </button>

              <button
                type="button"
                id="sidebar-tab-students"
                onClick={() => { setActiveTab('students'); setStudentPage(1); }}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'students' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <Users className="w-4 h-4" />
                Manage Students
              </button>

              <button
                type="button"
                id="sidebar-tab-classes"
                onClick={() => setActiveTab('classes')}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'classes' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <School className="w-4 h-4" />
                Manage Classes
              </button>

              <button
                type="button"
                id="sidebar-tab-teachers"
                onClick={() => setActiveTab('teachers')}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'teachers' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Manage Teachers
              </button>

              <button
                type="button"
                id="sidebar-tab-admins"
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'admins' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <Shield className="w-4 h-4" />
                Manage Admins
              </button>

              <button
                type="button"
                id="sidebar-tab-attendance"
                onClick={() => setActiveTab('attendance')}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'attendance' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Attendance Log
              </button>

              <button
                type="button"
                id="sidebar-tab-reports"
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 py-2.5 px-6 transition-all duration-150 cursor-pointer text-sm font-semibold ${
                  activeTab === 'reports' 
                    ? 'bg-indigo-50/70 text-indigo-700 border-l-4 border-indigo-600 pl-5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-5'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Attendance Reports
              </button>
            </nav>
          </div>

          {/* Sidebar Footer School info */}
          <div className="px-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800">Springfield High</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Academic Year 2026/2027. All systems operational.</p>
            </div>
          </div>
        </aside>

        {/* Main Work Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Mobile Navigation Header */}
          <div className="flex md:hidden items-center overflow-x-auto gap-2 pb-4 mb-4 border-b border-slate-200">
            {(['overview', 'students', 'classes', 'teachers', 'admins', 'attendance', 'reports'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setStudentPage(1); }}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div id="overview-tab-view" className="space-y-6">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
                    <p className="text-sm text-slate-500">Real-time indicators across Springfield High classes and demographics</p>
                  </div>

                  {/* Summary Metric Cards */}
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

                  {/* Core Visual Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Class Wise Attendance Rate Bar Chart */}
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

                    {/* Attendance Demographics / Status Breakdown */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">Attendance State Breakdown</h4>
                      {statusStats.length > 0 ? (
                        <>
                          <div className="h-44 flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusStats}
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
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

                  {/* Recent submissions list */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3.5 p-5">
                    <h4 className="text-sm font-bold text-slate-800">Latest Submissions</h4>
                    <div className="divide-y divide-slate-100">
                      {attendanceRecords.slice(-3).reverse().map((rec, idx) => {
                        const cls = classes.find(c => c.id === rec.classId);
                        const teacher = teachers.find(t => t.id === rec.submittedBy);
                        const presentCount = rec.students.filter(s => s.status === 'Present').length;
                        return (
                          <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {cls?.name.substring(0, 2) || 'CL'}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">{cls?.name || 'Classroom'}</h5>
                                <p className="text-[10px] text-slate-400">By {teacher?.name || 'Assigned Teacher'} • {new Date(rec.submittedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-800">{presentCount} / {rec.students.length} Present</span>
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
              )}

              {/* 2. STUDENTS TAB */}
              {activeTab === 'students' && (
                <div id="students-tab-view" className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Students</h2>
                      <p className="text-sm text-slate-500">Add, edit, view and manage school student enrollments</p>
                    </div>
                    <button
                      type="button"
                      id="add-student-btn"
                      onClick={() => {
                        setEditingStudent(null);
                        setStudentForm({ name: '', rollNumber: '', email: '', classId: '', gender: 'Male' });
                        setSelectedClassIds(classes.length > 0 && classes[0]?.id ? [classes[0].id] : []);
                        setStudentFormError(null);
                        setIsStudentModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
                    >
                      <UserPlus className="w-4 h-4" />
                      Enroll Student
                    </button>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        id="student-search-input"
                        type="text"
                        placeholder="Search student by name, roll number, or email..."
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
                          <option value="all">All Classes</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Name</th>
                            <th className="py-4 px-6">Roll Number</th>
                            <th className="py-4 px-6">Email</th>
                            <th className="py-4 px-6">Class Assignment</th>
                            <th className="py-4 px-6">Gender</th>
                            <th className="py-4 px-6 text-right">Actions</th>
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
                                      Unassigned
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-6 text-slate-500">{student.gender}</td>
                                <td className="py-3.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStudent(student)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer inline-flex"
                                    title="Edit Student"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove student ${student.name}?`)) {
                                        onDeleteStudent(student.id);
                                        // adjust page if empty
                                        if (paginatedStudents.length === 1 && studentPage > 1) {
                                          setStudentPage(studentPage - 1);
                                        }
                                      }
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer inline-flex"
                                    title="Delete Student"
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
                                No students match your search criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    {filteredStudents.length > 0 && (
                      <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Showing <span className="font-semibold text-slate-700">{Math.min(filteredStudents.length, (studentPage - 1) * studentsPerPage + 1)}</span> to{' '}
                          <span className="font-semibold text-slate-700">{Math.min(filteredStudents.length, studentPage * studentsPerPage)}</span> of{' '}
                          <span className="font-semibold text-slate-700">{filteredStudents.length}</span> students
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={studentPage === 1}
                            onClick={() => setStudentPage(studentPage - 1)}
                            className="py-1.5 px-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                          >
                            Prev
                          </button>
                          {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setStudentPage(p)}
                              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                studentPage === p 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
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
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. CLASSES TAB */}
              {activeTab === 'classes' && (
                <div id="classes-tab-view" className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Classes</h2>
                      <p className="text-sm text-slate-500">Set up curriculum classes, allocate rooms, and assign primary instructors</p>
                    </div>
                    <button
                      type="button"
                      id="add-class-btn"
                      onClick={() => {
                        setEditingClass(null);
                        setClassForm({ name: '', grade: '', room: '', teacherId: teachers[0]?.id || '' });
                        setClassFormError(null);
                        setIsClassModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Class
                    </button>
                  </div>

                  {/* Search Filter for Classes */}
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

                  {/* Class Bento Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredClasses.map(cls => {
                      const teacher = teachers.find(t => t.id === cls.teacherId);
                      const classStudents = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id));

                      return (
                        <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow">
                          {/* Card Header */}
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
                                onClick={() => handleOpenEditClass(cls)}
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

                          {/* Instructor Details */}
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

                          {/* Roster Summary */}
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between font-semibold text-slate-600">
                              <span>Student Roster ({classStudents.length} enrolled)</span>
                              <span>Ratio: {classStudents.length}/30</span>
                            </div>
                            {/* Simple visual bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(classStudents.length / 30) * 100}%` }}></div>
                            </div>
                            {/* Mini faces or list */}
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
              )}

              {/* 4. TEACHERS TAB */}
              {activeTab === 'teachers' && (
                <div id="teachers-tab-view" className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Teachers</h2>
                      <p className="text-sm text-slate-500">Create teacher accounts that can sign in and take attendance afterward</p>
                    </div>
                    <button
                      type="button"
                      id="add-teacher-btn"
                      onClick={() => {
                        setEditingTeacher(null);
                        setTeacherForm({ name: '', email: '', subject: '' });
                        setTeacherFormError(null);
                        setIsTeacherModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Teacher
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Name</th>
                            <th className="py-4 px-6">Email</th>
                            <th className="py-4 px-6">Subject</th>
                            <th className="py-4 px-6 text-right">Actions</th>
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
                                  onClick={() => handleOpenEditTeacher(teacher)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer inline-flex"
                                  title="Edit Teacher"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to remove teacher ${teacher.name}?`)) {
                                      onDeleteTeacher(teacher.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer inline-flex"
                                  title="Delete Teacher"
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
                                No teachers registered yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. ATTENDANCE LOG TAB */}
              {activeTab === 'attendance' && (
                <div id="attendance-tab-view" className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Ledger</h2>
                      <p className="text-sm text-slate-500">Audit daily attendance submissions, filter entries, and download records</p>
                    </div>
                    
                    <button
                      type="button"
                      id="export-attendance-btn"
                      onClick={handleExportAttendance}
                      className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
                    >
                      <Download className="w-4 h-4" />
                      Export to Excel (CSV)
                    </button>
                  </div>

                  {/* Log Filter Suite */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Filter className="w-4 h-4 text-slate-400" />
                      Search & Filter Submissions
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search Student Name */}
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          id="attendance-search-student"
                          type="text"
                          placeholder="Search student..."
                          value={attendanceSearch}
                          onChange={(e) => setAttendanceSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </div>

                      {/* Class filter */}
                      <div>
                        <select
                          id="attendance-class-dropdown"
                          value={attendanceClassFilter}
                          onChange={(e) => setAttendanceClassFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="all">All Classes</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date Filter */}
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

                      {/* Status Filter */}
                      <div>
                        <select
                          id="attendance-status-dropdown"
                          value={attendanceStatusFilter}
                          onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="all">All Statuses</option>
                          <option value="Present">Present</option>
                          <option value="Sick">Sick</option>
                          <option value="Excused">Excused</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Results */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Submission Date</th>
                            <th className="py-4 px-6">Class Room</th>
                            <th className="py-4 px-6">Student Name</th>
                            <th className="py-4 px-6">Roll ID</th>
                            <th className="py-4 px-6">Attendance Status</th>
                            <th className="py-4 px-6">Registered By</th>
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
                                    {log.status}
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
                                No matching logs found. Adjust your date filters or class settings.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ADMIN USERS TAB */}
              {activeTab === 'admins' && (
                <div id="admins-tab-view" className="space-y-6">
                      {currentAdminRole === 'limited' && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm">
                      You are signed in as a limited admin. You can view administrator accounts here, but creating, updating, and deleting admin users is restricted.
                    </div>
                  )}
                  <AdminManagement
                    admins={admins}
                    onAddAdmin={onAddAdmin}
                    onUpdateAdmin={onUpdateAdmin}
                    onDeleteAdmin={onDeleteAdmin}
                    canManageAdmins={canEditAdmins}
                  />
                </div>
              )}

              {/* 5. REPORTS TAB */}
              {activeTab === 'reports' && (
                <div id="reports-tab-view" className="space-y-6">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytical Insights</h2>
                    <p className="text-sm text-slate-500">Inspect attendance trends, gender distributions, and class metrics over time</p>
                  </div>

                  {/* Reports Visualizations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Time Trend Attendance Line Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">Attendance Progression over Last 5 Days</h4>
                      <div className="h-64">
                        {attendanceOverTime.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="Attendance Rate (%)" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                            No attendance data available to map.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Class Wise Enrollment Breakdown Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">Class Roster Capacity (Students Enrolled)</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={classAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="className" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }} />
                            <Bar dataKey="Student Count" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gender Distribution Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">Gender Distribution</h4>
                      <div className="space-y-4">
                        {['Male', 'Female', 'Other'].map(gender => {
                          const count = students.filter(s => s.gender === gender).length;
                          const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                          return (
                            <div key={gender} className="space-y-1.5 text-xs">
                              <div className="flex justify-between font-medium">
                                <span className="text-slate-600">{gender} Students</span>
                                <span className="text-slate-800 font-bold">{count} ({pct}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    gender === 'Male' ? 'bg-blue-500' : gender === 'Female' ? 'bg-pink-500' : 'bg-slate-400'
                                  }`} 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* System Summary Quick Report Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Audit Status Report</h4>
                      <div className="space-y-2.5 text-xs text-slate-600">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span>Submissions Ledger Records:</span>
                          <span className="font-bold text-slate-800">{attendanceRecords.length} submissions</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span>Verified Cohort Count:</span>
                          <span className="font-bold text-slate-800">{students.length} students</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span>Active Instructors:</span>
                          <span className="font-bold text-slate-800">{teachers.length} teachers</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>School Capacity Ratio:</span>
                          <span className="font-bold text-indigo-600">{Math.round((students.length / 120) * 100)}% Capacity</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] text-slate-400 italic text-center leading-normal">
                          Reports are refreshed dynamically. All calculated statistics adhere to active Springfield registries.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- ADD/EDIT STUDENT MODAL DIALOG --- */}
      {isStudentModalOpen && (
        <div id="student-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStudentFormSubmit} className="p-6 space-y-4">
              {studentFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{studentFormError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  id="student-form-name"
                  type="text"
                  required
                  placeholder="e.g. Liam Thompson"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Roll ID / Reg No</label>
                  <input
                    id="student-form-roll"
                    type="text"
                    required
                    placeholder="e.g. 10A12"
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                  <select
                    id="student-form-gender"
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  id="student-form-email"
                  type="email"
                  required
                  placeholder="e.g. liam.t@school.edu"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Class Cohort Assignment</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border border-slate-100 p-2 rounded-md">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedClassIds(prev => [...prev, c.id]);
                          else setSelectedClassIds(prev => prev.filter(id => id !== c.id));
                        }}
                        className="w-3.5 h-3.5"
                      />
                      <span>{c.name} ({c.room})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="student-form-submit-btn"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {editingStudent ? 'Save Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- ADD TEACHER MODAL DIALOG --- */}
      {isTeacherModalOpen && (
        <div id="teacher-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight">{editingTeacher ? 'Edit Teacher Account' : 'Add New Teacher Account'}</h3>
              <button 
                type="button" 
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTeacherFormSubmit} className="p-6 space-y-4">
              {teacherFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{teacherFormError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  id="teacher-form-name"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  id="teacher-form-email"
                  type="email"
                  required
                  placeholder="e.g. sarah@school.edu"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Subject / Department</label>
                <input
                  id="teacher-form-subject"
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={teacherForm.subject}
                  onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="teacher-form-submit-btn"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {editingTeacher ? 'Save Teacher' : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- ADD/EDIT CLASS MODAL DIALOG --- */}
      {isClassModalOpen && (
        <div id="class-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight">
                {editingClass ? 'Edit Class Parameters' : 'Establish New Class'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClassFormSubmit} className="p-6 space-y-4">
              {classFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{classFormError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Class / Subject Name</label>
                <input
                  id="class-form-name"
                  type="text"
                  required
                  placeholder="e.g. Grade 11 - Advanced Algebra"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Grade Level</label>
                  <input
                    id="class-form-grade"
                    type="text"
                    required
                    placeholder="e.g. 11"
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Room Allocation</label>
                  <input
                    id="class-form-room"
                    type="text"
                    required
                    placeholder="e.g. Lab C / Room 204"
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Principal Teacher</label>
                <select
                  id="class-form-teacher"
                  value={classForm.teacherId}
                  onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Instructor (Unassigned) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="class-form-submit-btn"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {editingClass ? 'Save Class' : 'Establish Class'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
