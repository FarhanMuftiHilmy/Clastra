/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Student, Class, Teacher, Admin, AttendanceRecord, CurrentUser, AttendanceStatus, UserRole } from './types';
import { INITIAL_TEACHERS } from './data';
import AuthScreen from './components/AuthScreen';
import ActivationScreen from './components/ActivationScreen';
import AdminDashboard from './components/AdminDashboard';
import TeacherPortal from './components/TeacherPortal';
// DeviceFrame removed for responsive web layout
import { Sparkles, ArrowLeftRight, UserCheck, Shield, BookOpen } from 'lucide-react';
import { studentService, classService, teacherService, attendanceService, adminService, authService } from './core/container';

export default function App() {
  // --- STATE ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isActivationMode, setIsActivationMode] = useState(false);
  const [activationType, setActivationType] = useState<'teacher' | 'admin' | null>(null);
  const [activationToken, setActivationToken] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // --- PERSISTENCE LOADER ---
  const loadData = async () => {
    try {
      const activeUser = await authService.getCurrentUser();

      const results = await Promise.allSettled([
        teacherService.getAllTeachers(),
        classService.getAllClasses(),
        studentService.getAllStudents(),
        attendanceService.getAllRecords(),
        ...(activeUser?.role === 'admin' && adminService ? [adminService.getAllAdmins()] : []),
      ]);

      const [teachersResult, classesResult, studentsResult, attendanceResult, adminsResult] = results;
      const normalizedTeachers = teachersResult.status === 'fulfilled' && Array.isArray(teachersResult.value) ? teachersResult.value : [];
      const normalizedClasses = classesResult.status === 'fulfilled' && Array.isArray(classesResult.value) ? classesResult.value : [];
      const normalizedStudents = studentsResult.status === 'fulfilled' && Array.isArray(studentsResult.value) ? studentsResult.value : [];
      const normalizedAttendance = attendanceResult.status === 'fulfilled' && Array.isArray(attendanceResult.value) ? attendanceResult.value : [];
      const normalizedAdmins = adminsResult?.status === 'fulfilled' && Array.isArray(adminsResult.value) ? adminsResult.value : [];

      setTeachers(normalizedTeachers);
      setClasses(normalizedClasses);
      setStudents(normalizedStudents);
      setAdmins(normalizedAdmins);
      setAttendanceRecords(normalizedAttendance);
      setCurrentUser(activeUser);
    } catch (error) {
      console.error('Error loading initialization data from services:', error);
      setTeachers([]);
      setClasses([]);
      setStudents([]);
      setAdmins([]);
      setAttendanceRecords([]);
      setCurrentUser(null);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teacherToken = params.get('activationToken');
    const adminToken = params.get('adminActivationToken');

    if (adminToken) {
      setActivationType('admin');
      setActivationToken(adminToken);
      setIsActivationMode(true);
    } else if (teacherToken) {
      setActivationType('teacher');
      setActivationToken(teacherToken);
      setIsActivationMode(true);
    }

    loadData();
  }, []);

  // --- USER AUTHENTICATION ACTIONS ---
  const handleLoginSuccess = async (role: UserRole, userDetail: { id: string; name: string; email: string; password?: string }) => {
    try {
      const sessionUser = await authService.login(role, userDetail.email, userDetail.password);
      setIsDataLoaded(false);
      await loadData();
      setCurrentUser(sessionUser);
      navigate(sessionUser.role === 'admin' ? '/admin' : '/teacher', { replace: true });
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
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleActivateTeacher = async (token: string, password: string) => {
    const message = await authService.activateTeacher(token, password);
    setIsActivationMode(false);
    setActivationType(null);
    window.history.replaceState({}, '', window.location.pathname);
    return message;
  };

  const handleActivateAdmin = async (token: string, password: string) => {
    const message = await authService.activateAdmin(token, password);
    setIsActivationMode(false);
    setActivationType(null);
    window.history.replaceState({}, '', window.location.pathname);
    return message;
  };

  // --- ADMIN ACTIONS: STUDENT MANAGERS ---
  const handleAddStudent = async (studentData: Omit<Student, 'id'>, classIds?: string[]): Promise<void> => {
    try {
      const created = await studentService.addStudent(studentData);
      if (classIds && classIds.length > 0) {
        for (const cid of classIds) {
          await studentService.assignStudentToClass(created.id, cid);
        }
      }
      const updated = await studentService.getAllStudents();
      setStudents(updated);
    } catch (error) {
      console.error('Add student error:', error);
      throw error;
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      await studentService.updateStudent(updatedStudent);
      const updated = await studentService.getAllStudents();
      setStudents(updated);
    } catch (error) {
      console.error('Update student error:', error);
      throw error;
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

  const handleAssignStudentToClass = async (studentId: string, classId: string) => {
    try {
      await studentService.assignStudentToClass(studentId, classId);
      const updatedStudents = await studentService.getAllStudents();
      setStudents(updatedStudents);
    } catch (error) {
      console.error('Assign student to class error:', error);
      throw error;
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string, classId: string) => {
    try {
      await studentService.removeStudentFromClass(studentId, classId);
      const updatedStudents = await studentService.getAllStudents();
      setStudents(updatedStudents);
    } catch (error) {
      console.error('Remove student from class error:', error);
      throw error;
    }
  };

  const handleGetStudentClassIds = async (studentId: string) => {
    try {
      return await studentService.getStudentClassIds(studentId);
    } catch (error) {
      console.error('Get student class ids error:', error);
      return [];
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

  const [isRefreshingAttendance, setIsRefreshingAttendance] = useState(false);

  const handleRefreshAttendance = async () => {
    try {
      setIsRefreshingAttendance(true);
      const updatedAttendance = await attendanceService.getAllRecords();
      setAttendanceRecords(updatedAttendance);
    } catch (error) {
      console.error('Refresh attendance error:', error);
    } finally {
      setIsRefreshingAttendance(false);
    }
  };

  // --- ADMIN ACTIONS: ADMIN MANAGERS ---
  const handleAddAdmin = async (adminData: Omit<Admin, 'id' | 'createdAt'>) => {
    try {
      await adminService?.createAdmin(adminData);
      const updated = await adminService?.getAllAdmins();
      setAdmins(updated ?? []);
    } catch (error) {
      console.error('Add admin error:', error);
    }
  };

  const handleUpdateAdmin = async (updatedAdmin: Admin) => {
    try {
      await adminService?.updateAdmin(updatedAdmin);
      const updated = await adminService?.getAllAdmins();
      setAdmins(updated ?? []);
    } catch (error) {
      console.error('Update admin error:', error);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await adminService?.deleteAdmin(id);
      const updated = await adminService?.getAllAdmins();
      setAdmins(updated ?? []);
    } catch (error) {
      console.error('Delete admin error:', error);
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
      let user;
      if (role === 'admin') {
        user = await authService.login('admin', 'admin@school.edu', 'admin123');
      } else {
        // Login as Sarah Jenkins (t1) by default
        const sarah = teachers.find(t => t.id === 't1') || INITIAL_TEACHERS[0];
        user = await authService.login('teacher', sarah.email, 'teacher123');
      }
      setIsDataLoaded(false);
      await loadData();
      setCurrentUser(user);
      navigate(user.role === 'admin' ? '/admin' : '/teacher', { replace: true });
    } catch (error) {
      console.error('Sandbox switch error:', error);
    }
  };

  useEffect(() => {
    if (!isDataLoaded) return;

    if (!currentUser) {
      if (location.pathname === '/teacher' || location.pathname === '/teachers/portal' || location.pathname === '/admin') {
        navigate('/', { replace: true });
      }
      return;
    }

    const isTeacherRoute = location.pathname.startsWith('/teacher');
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (currentUser.role === 'teacher' && isAdminRoute) {
      navigate('/teacher', { replace: true });
    } else if (currentUser.role === 'admin' && isTeacherRoute) {
      navigate('/admin', { replace: true });
    } else if (location.pathname === '/' && currentUser.role === 'teacher') {
      navigate('/teacher', { replace: true });
    } else if (location.pathname === '/' && currentUser.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [currentUser, isDataLoaded, location.pathname, navigate]);

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
    const isAdminActivation = activationType === 'admin';
    return (
      <ActivationScreen
        activationToken={activationToken}
        onActivate={isAdminActivation ? handleActivateAdmin : handleActivateTeacher}
        title={isAdminActivation ? 'Activate Your Admin Account' : 'Activate Your Teacher Account'}
        description={isAdminActivation ? 'Set a secure password to finish admin account activation.' : 'Set a secure password to finish account activation.'}
        onCancel={() => {
          setIsActivationMode(false);
          setActivationType(null);
          setActivationToken('');
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  const renderTeacherPortal = () => (
    <div id="teacher-portal-workspace" className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl">
        <TeacherPortal
          teacher={
            teachers.find(t =>
              t.id === currentUser?.id ||
              (t.email && currentUser?.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
            ) || { id: currentUser?.id ?? 'teacher', name: currentUser?.name ?? 'Teacher', email: currentUser?.email ?? '', subject: 'General' }
          }
          classes={classes}
          students={students}
          attendanceRecords={attendanceRecords}
          onSubmitAttendance={handleSubmitAttendance}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <AdminDashboard
      students={students}
      classes={classes}
      teachers={teachers}
      admins={admins}
      attendanceRecords={attendanceRecords}
      onAddStudent={handleAddStudent}
      onUpdateStudent={handleUpdateStudent}
      onDeleteStudent={handleDeleteStudent}
      onAddTeacher={handleAddTeacher}
      onUpdateTeacher={handleUpdateTeacher}
      onDeleteTeacher={handleDeleteTeacher}
      onAssignStudentToClass={handleAssignStudentToClass}
      onRemoveStudentFromClass={handleRemoveStudentFromClass}
      onGetStudentClassIds={handleGetStudentClassIds}
      onAddClass={handleAddClass}
      onUpdateClass={handleUpdateClass}
      onDeleteClass={handleDeleteClass}
      onRefreshAttendance={handleRefreshAttendance}
      isRefreshingAttendance={isRefreshingAttendance}
      onAddAdmin={handleAddAdmin}
      onUpdateAdmin={handleUpdateAdmin}
      onDeleteAdmin={handleDeleteAdmin}
      onLogout={handleLogout}
      adminName={currentUser?.name ?? 'Admin'}
      currentAdminRole={currentUser?.adminRole}
    />
  );

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

      <Routes>
        <Route
          path="/teacher"
          element={currentUser?.role === 'teacher' ? renderTeacherPortal() : <AuthScreen teachers={teachers} onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/teacher/class/:classId"
          element={currentUser?.role === 'teacher' ? renderTeacherPortal() : <AuthScreen teachers={teachers} onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/teachers/portal"
          element={currentUser?.role === 'teacher' ? renderTeacherPortal() : <AuthScreen teachers={teachers} onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/admin/*"
          element={currentUser?.role === 'admin' ? renderAdminDashboard() : <AuthScreen teachers={teachers} onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/"
          element={
            currentUser === null ? (
              <AuthScreen teachers={teachers} onLoginSuccess={handleLoginSuccess} />
            ) : currentUser.role === 'admin' ? (
              renderAdminDashboard()
            ) : (
              renderTeacherPortal()
            )
          }
        />
      </Routes>
    </div>
  );
}
