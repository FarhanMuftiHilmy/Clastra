/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, Class, Teacher, AttendanceRecord, CurrentUser, AttendanceStatus, UserRole } from './types';
import { INITIAL_TEACHERS } from './data';
import AuthScreen from './components/AuthScreen';
import ActivationScreen from './components/ActivationScreen';
import AdminDashboard from './components/AdminDashboard';
import TeacherPortal from './components/TeacherPortal';
import DeviceFrame from './components/DeviceFrame';
import { Sparkles, ArrowLeftRight, UserCheck, Shield, BookOpen } from 'lucide-react';
import { studentService, classService, teacherService, attendanceService, authService } from './core/container';

export default function App() {
  // --- STATE ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isActivationMode, setIsActivationMode] = useState(false);
  const [activationToken, setActivationToken] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- PERSISTENCE LOADER ---
  const loadData = async () => {
    try {
      const [activeTeachers, activeClasses, activeStudents, activeAttendance, activeUser] = await Promise.all([
        teacherService.getAllTeachers(),
        classService.getAllClasses(),
        studentService.getAllStudents(),
        attendanceService.getAllRecords(),
        authService.getCurrentUser(),
      ]);

      const normalizedTeachers = Array.isArray(activeTeachers) ? activeTeachers : [];
      const normalizedClasses = Array.isArray(activeClasses) ? activeClasses : [];
      const normalizedStudents = Array.isArray(activeStudents) ? activeStudents : [];
      const normalizedAttendance = Array.isArray(activeAttendance) ? activeAttendance : [];

      setTeachers(normalizedTeachers);
      setClasses(normalizedClasses);
      setStudents(normalizedStudents);
      setAttendanceRecords(normalizedAttendance);
      setCurrentUser(activeUser);
    } catch (error) {
      console.error('Error loading initialization data from services:', error);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('activationToken');

    if (token) {
      setActivationToken(token);
      setIsActivationMode(true);
    }

    loadData();
  }, []);

  // --- USER AUTHENTICATION ACTIONS ---
  const handleLoginSuccess = async (role: UserRole, userDetail: { id: string; name: string; email: string; password?: string }) => {
    try {
      const sessionUser = await authService.login(role, userDetail.email, userDetail.password);
      setCurrentUser(sessionUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setIsActivationMode(false);
      setActivationToken('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleActivateTeacher = async (token: string, password: string) => {
    const message = await authService.activateTeacher(token, password);
    setIsActivationMode(false);
    window.history.replaceState({}, '', window.location.pathname);
    return message;
  };

  // --- ADMIN ACTIONS: STUDENT MANAGERS ---
  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      await studentService.addStudent(studentData);
      const updated = await studentService.getAllStudents();
      setStudents(updated);
    } catch (error) {
      console.error('Add student error:', error);
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      await studentService.updateStudent(updatedStudent);
      const updated = await studentService.getAllStudents();
      setStudents(updated);
    } catch (error) {
      console.error('Update student error:', error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await studentService.deleteStudent(id);
      const [updatedStudents, updatedAttendance] = await Promise.all([
        studentService.getAllStudents(),
        attendanceService.getAllRecords(),
      ]);
      setStudents(updatedStudents);
      setAttendanceRecords(updatedAttendance);
    } catch (error) {
      console.error('Delete student error:', error);
    }
  };

  // --- ADMIN ACTIONS: TEACHER MANAGERS ---
  const handleAddTeacher = async (teacherData: Omit<Teacher, 'id'>) => {
    try {
      await teacherService.addTeacher(teacherData);
      const updated = await teacherService.getAllTeachers();
      setTeachers(updated);
    } catch (error) {
      console.error('Add teacher error:', error);
    }
  };

  const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
    try {
      await teacherService.updateTeacher(updatedTeacher);
      const updated = await teacherService.getAllTeachers();
      setTeachers(updated);
    } catch (error) {
      console.error('Update teacher error:', error);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await teacherService.deleteTeacher(id);
      const updated = await teacherService.getAllTeachers();
      setTeachers(updated);
    } catch (error) {
      console.error('Delete teacher error:', error);
    }
  };

  // --- ADMIN ACTIONS: CLASS MANAGERS ---
  const handleAddClass = async (classData: Omit<Class, 'id'>) => {
    try {
      await classService.addClass(classData);
      const updated = await classService.getAllClasses();
      setClasses(updated);
    } catch (error) {
      console.error('Add class error:', error);
    }
  };

  const handleUpdateClass = async (updatedClass: Class) => {
    try {
      await classService.updateClass(updatedClass);
      const updated = await classService.getAllClasses();
      setClasses(updated);
    } catch (error) {
      console.error('Update class error:', error);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await classService.deleteClass(id);
      const [updatedClasses, updatedStudents, updatedAttendance] = await Promise.all([
        classService.getAllClasses(),
        studentService.getAllStudents(),
        attendanceService.getAllRecords(),
      ]);
      setClasses(updatedClasses);
      setStudents(updatedStudents);
      setAttendanceRecords(updatedAttendance);
    } catch (error) {
      console.error('Delete class error:', error);
    }
  };

  // --- TEACHER ACTIONS: TAKE ATTENDANCE ---
  const handleSubmitAttendance = async (
    classId: string, 
    date: string, 
    studentStatuses: { studentId: string; status: AttendanceStatus }[]
  ) => {
    if (!currentUser) return;

    try {
      await attendanceService.submitAttendance(classId, date, currentUser.id, studentStatuses);
      const updated = await attendanceService.getAllRecords();
      setAttendanceRecords(updated);
    } catch (error) {
      console.error('Submit attendance error:', error);
    }
  };

  // --- SANBOX ROLE QUICK SWITCHER FOR LIVE PREVIEW ---
  const handleSandboxSwitch = async (role: UserRole) => {
    try {
      if (role === 'admin') {
        const user = await authService.login('admin', 'admin@school.edu', 'admin123');
        setCurrentUser(user);
      } else {
        // Login as Sarah Jenkins (t1) by default
        const sarah = teachers.find(t => t.id === 't1') || INITIAL_TEACHERS[0];
        const user = await authService.login('teacher', sarah.email, 'teacher123');
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Sandbox switch error:', error);
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

  if (isActivationMode && activationToken) {
    return (
      <ActivationScreen
        activationToken={activationToken}
        onActivate={handleActivateTeacher}
        onCancel={() => {
          setIsActivationMode(false);
          setActivationToken('');
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* Floating Developer Sandbox Controller */}
      {/* <div 
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
      </div> */}

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
          onAddTeacher={handleAddTeacher}
          onUpdateTeacher={handleUpdateTeacher}
          onDeleteTeacher={handleDeleteTeacher}
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
