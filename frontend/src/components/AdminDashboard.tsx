/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import OverviewPage from './admin/OverviewPage';
import StudentsPage from './admin/StudentsPage';
import ClassesPage from './admin/ClassesPage';
import TeachersPage from './admin/TeachersPage';
import AttendancePage from './admin/AttendancePage';
import { asArray } from '../utils/safe';

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
  onRefreshAttendance: () => Promise<void>;
  isRefreshingAttendance: boolean;
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
  onRefreshAttendance,
  isRefreshingAttendance,
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
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const getTabFromPath = (pathname: string): TabType => {
    const parts = pathname.split('/').filter(Boolean);
    const cleanPath = parts.length <= 1 ? 'overview' : parts[1];

    switch (cleanPath) {
      case 'students':
        return 'students';
      case 'classes':
        return 'classes';
      case 'teachers':
        return 'teachers';
      case 'admins':
        return 'admins';
      case 'attendance':
        return 'attendance';
      case 'reports':
        return 'reports';
      default:
        return 'overview';
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'students') {
      setStudentPage(1);
    }

    const path = tab === 'overview' ? '/admin' : `/admin/${tab}`;
    navigate(path);
  };

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // --- Search / Filters State ---
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 8;
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkAssignClassId, setBulkAssignClassId] = useState<string>('');
  const [bulkAssignError, setBulkAssignError] = useState<string | null>(null);
  const [bulkAssignSuccess, setBulkAssignSuccess] = useState<string | null>(null);

  const [classSearch, setClassSearch] = useState('');

  useEffect(() => {
    if (!bulkAssignClassId && classes.length > 0) {
      setBulkAssignClassId(classes[0].id);
    }
  }, [classes, bulkAssignClassId]);

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

    asArray(attendanceRecords).forEach(record => {
      const studentsForRecord = asArray(record?.students);

      studentsForRecord.forEach(s => {
        totalStudentCount++;
        if (s?.status === 'Present') {
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

    asArray(attendanceRecords).forEach(record => {
      const studentsForRecord = asArray(record?.students);

      studentsForRecord.forEach(s => {
        if (s?.status === 'Present') present++;
        else if (s?.status === 'Sick') sick++;
        else if (s?.status === 'Excused') excused++;
        else if (s?.status === 'Absent') absent++;
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

      asArray(clsRecords).forEach(record => {
        const studentsForRecord = asArray(record?.students);

        studentsForRecord.forEach(s => {
          total++;
          if (s?.status === 'Present') present++;
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

      asArray(dateRecords).forEach(record => {
        const studentsForRecord = asArray(record?.students);

        studentsForRecord.forEach(s => {
          total++;
          if (s?.status === 'Present') present++;
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

    asArray(attendanceRecords).forEach(record => {
      const cls = classes.find(c => c.id === record.classId);
      const teacher = teachers.find(t => t.id === record.submittedBy);
      const className = cls ? cls.name : 'Unknown Class';
      const teacherName = teacher ? teacher.name : 'Unknown Teacher';
      const studentsForRecord = asArray(record?.students);

      studentsForRecord.forEach(s => {
        const student = students.find(std => std.id === s?.studentId);
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
                onClick={() => handleTabChange('overview')}
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
                onClick={() => handleTabChange('students')}
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
                onClick={() => handleTabChange('classes')}
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
                onClick={() => handleTabChange('teachers')}
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
                onClick={() => handleTabChange('admins')}
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
                onClick={() => handleTabChange('attendance')}
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
                onClick={() => handleTabChange('reports')}
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
                onClick={() => handleTabChange(tab)}
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
                <OverviewPage
                  totalStudents={totalStudents}
                  totalClasses={totalClasses}
                  totalTeachers={totalTeachers}
                  overallAttendanceRate={overallAttendanceRate}
                  classAttendanceData={classAttendanceData}
                  statusStats={statusStats}
                  attendanceRecords={attendanceRecords}
                  classes={classes}
                  teachers={teachers}
                />
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

                  {/* Bulk assign controls */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bulk assign selected students</p>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 sm:w-72">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <School className="w-4 h-4" />
                          </span>
                          <select
                            id="bulk-assign-class"
                            value={bulkAssignClassId}
                            onChange={(e) => setBulkAssignClassId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:border-indigo-500"
                          >
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setBulkAssignError(null);
                            setBulkAssignSuccess(null);
                            if (selectedStudentIds.length === 0) {
                              setBulkAssignError('Select at least one student first.');
                              return;
                            }
                            if (!bulkAssignClassId) {
                              setBulkAssignError('Choose a class before assigning.');
                              return;
                            }
                            const className = classes.find(c => c.id === bulkAssignClassId)?.name || 'the selected class';
                            try {
                              await Promise.all(selectedStudentIds.map(id => onAssignStudentToClass(id, bulkAssignClassId)));
                              setSelectedStudentIds([]);
                              setBulkAssignSuccess(`Assigned ${selectedStudentIds.length} student(s) to ${className}.`);
                            } catch (error: any) {
                              setBulkAssignError(error?.message || 'Bulk assignment failed.');
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Assign Selected
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setBulkAssignError(null);
                            setBulkAssignSuccess(null);
                            if (selectedStudentIds.length === 0) {
                              setBulkAssignError('Select at least one student first.');
                              return;
                            }
                            if (!bulkAssignClassId) {
                              setBulkAssignError('Choose a class before unassigning.');
                              return;
                            }
                            const className = classes.find(c => c.id === bulkAssignClassId)?.name || 'the selected class';
                            if (!confirm(`Unassign ${selectedStudentIds.length} selected student(s) from ${className}?`)) {
                              return;
                            }
                            try {
                              await Promise.all(selectedStudentIds.map(id => onRemoveStudentFromClass(id, bulkAssignClassId)));
                              setSelectedStudentIds([]);
                              setBulkAssignSuccess(`Unassigned ${selectedStudentIds.length} student(s) from ${className}.`);
                            } catch (error: any) {
                              setBulkAssignError(error?.message || 'Bulk unassignment failed.');
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          Unassign Selected
                        </button>
                      </div>
                      {bulkAssignError && (
                        <p className="mt-2 text-xs text-red-600">{bulkAssignError}</p>
                      )}
                      {bulkAssignSuccess && (
                        <p className="mt-2 text-xs text-emerald-600">{bulkAssignSuccess}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedStudentIds.length > 0 ? (
                        <span>{selectedStudentIds.length} student(s) selected</span>
                      ) : (
                        <span>No students selected</span>
                      )}
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-4">
                              <input
                                type="checkbox"
                                aria-label="Select all students"
                                checked={selectedStudentIds.length > 0 && paginatedStudents.every(student => selectedStudentIds.includes(student.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const pageIds = paginatedStudents.map(student => student.id);
                                    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
                                  } else {
                                    setSelectedStudentIds(prev => prev.filter(id => !paginatedStudents.some(student => student.id === id)));
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </th>
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
                                <td className="py-3.5 px-4">
                                  <input
                                    type="checkbox"
                                    aria-label={`Select ${student.name}`}
                                    checked={selectedStudentIds.includes(student.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStudentIds(prev => Array.from(new Set([...prev, student.id])));
                                      } else {
                                        setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </td>
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
                <ClassesPage
                  classes={classes}
                  students={students}
                  teachers={teachers}
                  filteredClasses={filteredClasses}
                  classSearch={classSearch}
                  setClassSearch={setClassSearch}
                  onDeleteClass={onDeleteClass}
                  onOpenCreateClass={() => {
                    setEditingClass(null);
                    setClassForm({ name: '', grade: '', room: '', teacherId: teachers[0]?.id || '' });
                    setClassFormError(null);
                    setIsClassModalOpen(true);
                  }}
                  onOpenEditClass={handleOpenEditClass}
                />
              )}

              {/* 4. TEACHERS TAB */}
              {activeTab === 'teachers' && (
                <TeachersPage
                  teachers={teachers}
                  onDeleteTeacher={onDeleteTeacher}
                  onOpenCreateTeacher={() => {
                    setEditingTeacher(null);
                    setTeacherForm({ name: '', email: '', subject: '' });
                    setTeacherFormError(null);
                    setIsTeacherModalOpen(true);
                  }}
                  onOpenEditTeacher={handleOpenEditTeacher}
                />
              )}

              {/* 5. ATTENDANCE LOG TAB */}
              {activeTab === 'attendance' && (
                <AttendancePage
                  classes={classes}
                  filteredAttendanceLogs={filteredAttendanceLogs}
                  attendanceSearch={attendanceSearch}
                  attendanceClassFilter={attendanceClassFilter}
                  attendanceDateFilter={attendanceDateFilter}
                  attendanceStatusFilter={attendanceStatusFilter}
                  setAttendanceSearch={setAttendanceSearch}
                  setAttendanceClassFilter={setAttendanceClassFilter}
                  setAttendanceDateFilter={setAttendanceDateFilter}
                  setAttendanceStatusFilter={setAttendanceStatusFilter}
                  onExportAttendance={handleExportAttendance}
                  onRefreshAttendance={onRefreshAttendance}
                  isRefreshingAttendance={isRefreshingAttendance}
                />
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
