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
import { supportedLocales, t } from '../i18n';
import { useLocale } from '../LocaleContext';
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
  const formatClassLabel = (cls: Class) => `Grade ${cls.grade} - ${cls.name}`;
  const roleLabel = currentAdminRole === 'super'
    ? t('admin.adminRoleSuper')
    : currentAdminRole === 'limited'
      ? t('admin.adminRoleLimited')
      : t('admin.adminRoleAdministrator');
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { locale, setLocale: setLocaleState, localeJustChanged } = useLocale();

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

  const handleLocaleChange = (newLocale: typeof locale) => {
    setLocaleState(newLocale);
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

  useEffect(() => {
    if (!bulkAssignSuccess) return;
    const timeoutId = window.setTimeout(() => setBulkAssignSuccess(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [bulkAssignSuccess]);

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
      { name: t('admin.attendanceStatusPresent'), value: present, color: '#10b981' },
      { name: t('admin.attendanceStatusSick'), value: sick, color: '#f59e0b' },
      { name: t('admin.attendanceStatusExcused'), value: excused, color: '#3b82f6' },
      { name: t('admin.attendanceStatusAbsent'), value: absent, color: '#ef4444' },
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
      const teacherName = teacher ? teacher.name : t('admin.unassignedBadge');
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
      const className = cls ? cls.name : t('admin.classUnassignedTitle');
      const teacherName = teacher ? teacher.name : t('admin.unknownTeacherFallback');
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
    if (!studentForm.name.trim()) return setStudentFormError(t('admin.errorFullNameRequired'));
    if (!studentForm.rollNumber.trim()) return setStudentFormError(t('admin.errorRollNumberRequired'));
    if (!studentForm.email.trim() || !studentForm.email.includes('@')) return setStudentFormError(t('admin.errorEmailInvalid'));
    if (!editingStudent && selectedClassIds.length === 0) return setStudentFormError(t('admin.errorClassRequired'));

    // Roll number uniqueness validation (excluding current student being edited)
    const rollDup = students.some(s => 
      s.rollNumber.toLowerCase() === studentForm.rollNumber.toLowerCase() && 
      (!editingStudent || s.id !== editingStudent.id)
    );
    if (rollDup) return setStudentFormError(t('admin.errorRollNumberDuplicate'));

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
      setStudentFormError(error?.message || t('admin.errorStudentSaveFailed'));
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

    if (!teacherForm.name.trim()) return setTeacherFormError(t('admin.errorTeacherNameRequired'));
    if (!teacherForm.email.trim() || !teacherForm.email.includes('@')) return setTeacherFormError(t('admin.errorEmailInvalid'));
    if (!teacherForm.subject.trim()) return setTeacherFormError(t('admin.errorTeacherSubjectRequired'));

    const emailDup = teachers.some(t => t.email.toLowerCase() === teacherForm.email.toLowerCase() && (!editingTeacher || t.id !== editingTeacher.id));
    if (emailDup) return setTeacherFormError(t('admin.errorTeacherEmailDuplicate'));

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

    if (!classForm.name.trim()) return setClassFormError(t('admin.errorClassNameRequired'));
    if (!classForm.grade.trim()) return setClassFormError(t('admin.errorClassGradeRequired'));
    if (!classForm.room.trim()) return setClassFormError(t('admin.errorClassRoomRequired'));

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
      alert(t('admin.attendanceNoMatchingLogs'));
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
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 leading-none tracking-tight">{t('admin.brand')}</span>
              <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md font-extrabold px-1.5 py-0.5 uppercase tracking-wide">{t('admin.adminBadge')}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{t('admin.portalDescription')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-slate-800 leading-none">{adminName}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 text-xs">
            <span className="font-semibold text-slate-500">{t('admin.languageLabel')}:</span>
            <select
              id="locale-select"
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as typeof locale)}
              className="bg-transparent outline-none text-slate-800 text-xs font-semibold"
            >
              {supportedLocales.map(localeOption => (
                <option key={localeOption} value={localeOption}>
                  {localeOption === 'en' ? t('admin.languageEnglish') : t('admin.languageIndonesian')}
                </option>
              ))}
            </select>
            {localeJustChanged && (
              <span className="ml-3 text-xs text-emerald-600 font-semibold">{t('admin.languageChanged')}</span>
            )}
          </div>
          <button
            type="button"
            id="admin-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-2 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            {t('admin.signOut')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside id="admin-sidebar" className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 shrink-0">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-6">{t('admin.navigation')}</div>
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
                {t('admin.tabOverview')}
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
                {t('admin.tabStudents')}
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
                {t('admin.tabClasses')}
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
                {t('admin.tabTeachers')}
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
                {t('admin.tabAdmins')}
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
                {t('admin.tabAttendance')}
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
                {t('admin.tabReports')}
              </button>
            </nav>
          </div>

          {/* Sidebar Footer School info */}
          <div className="px-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800">{t('admin.brandLong')}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{t('admin.academicYearNote', { year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` })}</p>
            </div>
          </div>
        </aside>

        {/* Main Work Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Mobile Navigation Header */}
          <div className="flex md:hidden items-center overflow-x-auto gap-2 pb-4 mb-4 border-b border-slate-200">
            {(['overview', 'students', 'classes', 'teachers', 'admins', 'attendance', 'reports'] as TabType[]).map(tab => {
              const labelMap: Record<TabType, string> = {
                overview: t('admin.tabOverview'),
                students: t('admin.tabStudents'),
                classes: t('admin.tabClasses'),
                teachers: t('admin.tabTeachers'),
                admins: t('admin.tabAdmins'),
                attendance: t('admin.tabAttendance'),
                reports: t('admin.tabReports'),
              };

              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${
                    activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
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
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.manageStudentsTitle')}</h2>
                      <p className="text-sm text-slate-500">{t('admin.manageStudentsDescription')}</p>
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
                      {t('admin.enrollStudent')}
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
                            <option key={c.id} value={c.id}>{formatClassLabel(c)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bulk assign controls */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('admin.bulkAssignLabel')}</p>
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
                            <option value="" disabled>{t('admin.chooseClassToAssign')}</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>{formatClassLabel(c)}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setBulkAssignError(null);
                            setBulkAssignSuccess(null);
                            if (selectedStudentIds.length === 0) {
                              setBulkAssignError(t('admin.noStudentsSelected')); 
                              return;
                            }
                            if (!bulkAssignClassId) {
                              setBulkAssignError(t('admin.chooseClassAssign'));
                              return;
                            }
                            const className = classes.find(c => c.id === bulkAssignClassId)?.name || t('admin.theSelectedClass');
                            try {
                              await Promise.all(selectedStudentIds.map(id => onAssignStudentToClass(id, bulkAssignClassId)));
                              setSelectedStudentIds([]);
                              setBulkAssignSuccess(t('admin.assignedSuccess', { count: selectedStudentIds.length, className }));
                            } catch (error: any) {
                              setBulkAssignError(error?.message || t('admin.bulkAssignmentFailed'));
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          {t('admin.assignSelected')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setBulkAssignError(null);
                            setBulkAssignSuccess(null);
                            if (selectedStudentIds.length === 0) {
                              setBulkAssignError(t('admin.noStudentsSelected'));
                              return;
                            }
                            if (!bulkAssignClassId) {
                              setBulkAssignError(t('admin.chooseClassUnassign'));
                              return;
                            }
                            const className = classes.find(c => c.id === bulkAssignClassId)?.name || t('admin.theSelectedClass');
                            if (!confirm(t('admin.removeConfirm', { count: selectedStudentIds.length, className }))) {
                              return;
                            }
                            try {
                              await Promise.all(selectedStudentIds.map(id => onRemoveStudentFromClass(id, bulkAssignClassId)));
                              setSelectedStudentIds([]);
                              setBulkAssignSuccess(t('admin.unassignedSuccess', { count: selectedStudentIds.length, className }));
                            } catch (error: any) {
                              setBulkAssignError(error?.message || t('admin.bulkUnassignmentFailed'));
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          {t('admin.unassignSelected')}
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
                        <span>{t('admin.selectedCount', { count: selectedStudentIds.length })}</span>
                      ) : (
                        <span>{t('admin.noStudentsSelectedText')}</span>
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
                                aria-label={t('admin.selectAllStudents')}
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
                                      {t('admin.unassignedBadge')}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-6 text-slate-500">{t(`admin.gender${student.gender}` as any)}</td>
                                <td className="py-3.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStudent(student)}
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
                                        // adjust page if empty
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

                    {/* Pagination Bar */}
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
                            {t('admin.next')}
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
                      {t('admin.limitedAdminNote')}
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
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.reportsInsightsTitle')}</h2>
                    <p className="text-sm text-slate-500">{t('admin.reportsInsightsDescription')}</p>
                  </div>

                  {/* Reports Visualizations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Time Trend Attendance Line Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">{t('admin.attendanceProgressTitle')}</h4>
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
                            {t('admin.noAttendanceData')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Class Wise Enrollment Breakdown Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">{t('admin.overviewClassRosterCapacity')}</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={classAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="className" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }} />
                            <Bar dataKey="Student Count" name={t('admin.studentCount')} fill="#818cf8" radius={[4, 4, 0, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gender Distribution Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">{t('admin.genderDistribution')}</h4>
                      <div className="space-y-4">
                        {['Male', 'Female', 'Other'].map(gender => {
                          const count = students.filter(s => s.gender === gender).length;
                          const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                          return (
                            <div key={gender} className="space-y-1.5 text-xs">
                              <div className="flex justify-between font-medium">
                                <span className="text-slate-600">{t(`admin.gender${gender}Students` as any)}</span>
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
                      <h4 className="text-sm font-bold text-slate-800">{t('admin.auditStatusReport')}</h4>
                      <div className="space-y-2.5 text-xs text-slate-600">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span>{t('admin.auditSubmissionsLedger')}</span>
                          <span className="font-bold text-slate-800">{t('admin.auditSubmissionsCount', { count: attendanceRecords.length })}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span>{t('admin.auditVerifiedCohort')}</span>
                          <span className="font-bold text-slate-800">{t('admin.auditVerifiedCohortCount', { count: students.length })}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span>{t('admin.auditActiveInstructors')}</span>
                          <span className="font-bold text-slate-800">{t('admin.auditActiveInstructorsCount', { count: teachers.length })}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>{t('admin.auditSchoolCapacityRatio')}</span>
                          <span className="font-bold text-indigo-600">{Math.round((students.length / 120) * 100)}% Capacity</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] text-slate-400 italic text-center leading-normal">
                          {t('admin.auditReportsNote')}
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
                {editingStudent ? t('admin.studentModalEditTitle') : t('admin.studentModalNewTitle')}
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.studentFormFullName')}</label>
                <input
                  id="student-form-name"
                  type="text"
                  required
                  placeholder={t('admin.studentFormFullNamePlaceholder')}
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.studentFormRollLabel')}</label>
                  <input
                    id="student-form-roll"
                    type="text"
                    required
                    placeholder={t('admin.studentFormRollPlaceholder')}
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.studentFormGenderLabel')}</label>
                  <select
                    id="student-form-gender"
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Male">{t('admin.genderMale')}</option>
                    <option value="Female">{t('admin.genderFemale')}</option>
                    <option value="Other">{t('admin.genderOther')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.studentFormEmailLabel')}</label>
                <input
                  id="student-form-email"
                  type="email"
                  required
                  placeholder={t('admin.studentFormEmailPlaceholder')}
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.studentFormClassAssignmentLabel')}</label>
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
                      <span>{formatClassLabel(c)} ({c.room})</span>
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
                  {t('admin.studentFormCancel')}
                </button>
                <button
                  type="submit"
                  id="student-form-submit-btn"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {editingStudent ? t('admin.studentFormSave') : t('admin.studentFormEnroll')}
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
              <h3 className="font-bold text-sm tracking-tight">{editingTeacher ? t('admin.teacherModalEditTitle') : t('admin.teacherModalNewTitle')}</h3>
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.teacherFormFullName')}</label>
                <input
                  id="teacher-form-name"
                  type="text"
                  required
                  placeholder={t('admin.teacherFormNamePlaceholder')}
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.teacherFormEmail')}</label>
                <input
                  id="teacher-form-email"
                  type="email"
                  required
                  placeholder={t('admin.teacherFormEmailPlaceholder')}
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.teacherFormSubject')}</label>
                <input
                  id="teacher-form-subject"
                  type="text"
                  required
                  placeholder={t('admin.teacherFormSubjectPlaceholder')}
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
                  {t('admin.studentFormCancel')}
                </button>
                <button
                  type="submit"
                  id="teacher-form-submit-btn"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {editingTeacher ? t('admin.teacherFormSave') : t('admin.teacherFormCreate')}
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
                {editingClass ? t('admin.classModalEditTitle') : t('admin.classModalNewTitle')}
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.classFormNameLabel')}</label>
                <input
                  id="class-form-name"
                  type="text"
                  required
                  placeholder={t('admin.classFormNamePlaceholder')}
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.classFormGradeLabel')}</label>
                  <input
                    id="class-form-grade"
                    type="text"
                    required
                    placeholder={t('admin.classFormGradePlaceholder')}
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.classFormRoomLabel')}</label>
                  <input
                    id="class-form-room"
                    type="text"
                    required
                    placeholder={t('admin.classFormRoomPlaceholder')}
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.classFormTeacherLabel')}</label>
                <select
                  id="class-form-teacher"
                  value={classForm.teacherId}
                  onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{t('admin.noInstructorUnassignedOption')}</option>
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
                  {t('admin.studentFormCancel')}
                </button>
                <button
                  type="submit"
                  id="class-form-submit-btn"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {editingClass ? t('admin.classFormSave') : t('admin.classFormCreate')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
