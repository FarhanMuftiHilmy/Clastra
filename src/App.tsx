/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, Class, Teacher, AttendanceRecord, CurrentUser, AttendanceStatus, UserRole } from './types';
import { 
  INITIAL_TEACHERS, INITIAL_CLASSES, INITIAL_STUDENTS, 
  generateInitialAttendance 
} from './data';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import TeacherPortal from './components/TeacherPortal';
import DeviceFrame from './components/DeviceFrame';
import { Sparkles, ArrowLeftRight, UserCheck, Shield, BookOpen } from 'lucide-react';

const STORAGE_KEYS = {
  TEACHERS: 'sms_teachers',
  CLASSES: 'sms_classes',
  STUDENTS: 'sms_students',
  ATTENDANCE: 'sms_attendance_records',
  CURRENT_USER: 'sms_current_user',
};

export default function App() {
  // --- STATE ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- PERSISTENCE LOADER ---
  useEffect(() => {
    // Load or Seed Teachers
    let storedTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    let activeTeachers = INITIAL_TEACHERS;
    if (storedTeachers) {
      activeTeachers = JSON.parse(storedTeachers);
    } else {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
    }
    setTeachers(activeTeachers);

    // Load or Seed Classes
    let storedClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
    let activeClasses = INITIAL_CLASSES;
    if (storedClasses) {
      activeClasses = JSON.parse(storedClasses);
    } else {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    }
    setClasses(activeClasses);

    // Load or Seed Students
    let storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    let activeStudents = INITIAL_STUDENTS;
    if (storedStudents) {
      activeStudents = JSON.parse(storedStudents);
    } else {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }
    setStudents(activeStudents);

    // Load or Seed Attendance Records
    let storedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let activeAttendance = [];
    if (storedAttendance) {
      activeAttendance = JSON.parse(storedAttendance);
    } else {
      activeAttendance = generateInitialAttendance();
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(activeAttendance));
    }
    setAttendanceRecords(activeAttendance);

    // Load Current User Session
    let storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    setIsDataLoaded(true);
  }, []);

  // --- PERSISTENCE UPDATERS ---
  const saveTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(newTeachers));
  };

  const saveClasses = (newClasses: Class[]) => {
    setClasses(newClasses);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(newClasses));
  };

  const saveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudents));
  };

  const saveAttendance = (newAttendance: AttendanceRecord[]) => {
    setAttendanceRecords(newAttendance);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(newAttendance));
  };

  // --- USER AUTHENTICATION ACTIONS ---
  const handleLoginSuccess = (role: UserRole, userDetail: { id: string; name: string; email: string }) => {
    const sessionUser: CurrentUser = {
      role,
      id: userDetail.id,
      name: userDetail.name,
      email: userDetail.email,
    };
    setCurrentUser(sessionUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  // --- ADMIN ACTIONS: STUDENT MANAGERS ---
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `std_${Date.now()}`,
    };
    const updated = [...students, newStudent];
    saveStudents(updated);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    saveStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    saveStudents(updated);
    
    // Also remove student from any existing attendance records to keep sync clean
    const cleanedAttendance = attendanceRecords.map(record => ({
      ...record,
      students: record.students.filter(s => s.studentId !== id),
    }));
    saveAttendance(cleanedAttendance);
  };

  // --- ADMIN ACTIONS: CLASS MANAGERS ---
  const handleAddClass = (classData: Omit<Class, 'id'>) => {
    const newClass: Class = {
      ...classData,
      id: `cls_${Date.now()}`,
    };
    const updated = [...classes, newClass];
    saveClasses(updated);
  };

  const handleUpdateClass = (updatedClass: Class) => {
    const updated = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
    saveClasses(updated);
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter(c => c.id !== id);
    saveClasses(updated);

    // Also unassign student class IDs for deleted class
    const updatedStudents = students.map(s => s.classId === id ? { ...s, classId: '' } : s);
    saveStudents(updatedStudents);

    // Filter out attendance records of deleted class
    const updatedAttendance = attendanceRecords.filter(r => r.classId !== id);
    saveAttendance(updatedAttendance);
  };

  // --- TEACHER ACTIONS: TAKE ATTENDANCE ---
  const handleSubmitAttendance = (
    classId: string, 
    date: string, 
    studentStatuses: { studentId: string; status: AttendanceStatus }[]
  ) => {
    if (!currentUser) return;

    // Check if we are updating an existing day record or writing a brand new one
    const recordId = `att_${classId}_${date}`;
    const existingIndex = attendanceRecords.findIndex(r => r.classId === classId && r.date === date);

    const newRecord: AttendanceRecord = {
      id: recordId,
      classId,
      date,
      submittedBy: currentUser.id,
      submittedAt: new Date().toISOString(),
      students: studentStatuses,
    };

    let updatedRecords = [...attendanceRecords];
    if (existingIndex !== -1) {
      updatedRecords[existingIndex] = newRecord;
    } else {
      updatedRecords.push(newRecord);
    }

    saveAttendance(updatedRecords);
  };

  // --- SANBOX ROLE QUICK SWITCHER FOR LIVE PREVIEW ---
  const handleSandboxSwitch = (role: UserRole) => {
    if (role === 'admin') {
      handleLoginSuccess('admin', {
        id: 'admin_1',
        name: 'Principal Arthur',
        email: 'admin@school.edu',
      });
    } else {
      // Login as Sarah Jenkins (t1) by default
      const sarah = teachers.find(t => t.id === 't1') || INITIAL_TEACHERS[0];
      handleLoginSuccess('teacher', {
        id: sarah.id,
        name: sarah.name,
        email: sarah.email,
      });
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wider">Loading School Ledger State...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* Floating Developer Sandbox Controller */}
      <div 
        id="sandbox-developer-hub" 
        className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 text-slate-800 rounded-xl p-4 shadow-md max-w-xs w-72"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <span className="text-[10px] font-extrabold text-slate-700 tracking-wider uppercase">Sandbox Quick Controls</span>
        </div>
        
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3">
          Simulate dual role-based synchronization instantly: Take roll as Teacher, switch to Admin to see updated reports!
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="sandbox-swap-admin"
            onClick={() => handleSandboxSwitch('admin')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors border ${
              currentUser?.role === 'admin' 
                ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs' 
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 font-semibold'
            }`}
          >
            <Shield className="w-3 h-3" />
            As Admin
          </button>
          
          <button
            type="button"
            id="sandbox-swap-teacher"
            onClick={() => handleSandboxSwitch('teacher')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors border ${
              currentUser?.role === 'teacher' 
                ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs' 
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 font-semibold'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            As Teacher
          </button>
        </div>
      </div>

      {/* --- CONDITIONAL ROUTE RENDERER --- */}
      {currentUser === null ? (
        <AuthScreen 
          teachers={teachers} 
          onLoginSuccess={handleLoginSuccess} 
        />
      ) : currentUser.role === 'admin' ? (
        <AdminDashboard
          students={students}
          classes={classes}
          teachers={teachers}
          attendanceRecords={attendanceRecords}
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onAddClass={handleAddClass}
          onUpdateClass={handleUpdateClass}
          onDeleteClass={handleDeleteClass}
          onLogout={handleLogout}
          adminName={currentUser.name}
        />
      ) : (
        /* Teacher Mobile Portal embedded in a realistic device layout on a clean desk canvas */
        <div id="teacher-portal-workspace" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden">
          {/* Geometric background lines/grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

          <div className="mb-6 text-center text-slate-800 z-10 max-w-sm">
            <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2.5">
              <BookOpen className="w-3.5 h-3.5" />
              Interactive Simulation
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Teacher Roll Call Terminal</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">This viewport simulates a live Flutter mobile application on a school iPad/Phone device.</p>
          </div>

          <div className="z-10 w-full max-w-md">
            <DeviceFrame>
              <TeacherPortal
                teacher={teachers.find(t => t.id === currentUser.id) || { id: currentUser.id, name: currentUser.name, email: currentUser.email, subject: 'General' }}
                classes={classes}
                students={students}
                attendanceRecords={attendanceRecords}
                onSubmitAttendance={handleSubmitAttendance}
                onLogout={handleLogout}
              />
            </DeviceFrame>
          </div>
        </div>
      )}

    </div>
  );
}
