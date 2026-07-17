/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BookOpen, ChevronRight, CheckCircle2, User, Calendar, 
  Users, Check, Info, ShieldAlert, Sparkles, Smile, ArrowLeft,
  Moon, LogOut, ClipboardCheck
} from 'lucide-react';
import { Teacher, Class, Student, AttendanceStatus, AttendanceRecord } from '../types';

interface TeacherPortalProps {
  teacher: Teacher;
  classes: Class[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSubmitAttendance: (classId: string, date: string, studentStatuses: { studentId: string; status: AttendanceStatus }[]) => void;
  onLogout: () => void;
}

export default function TeacherPortal({
  teacher,
  classes,
  students,
  attendanceRecords,
  onSubmitAttendance,
  onLogout,
}: TeacherPortalProps) {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Default to today
  });
  const navigate = useNavigate();
  const { classId: routeClassId } = useParams<{ classId?: string }>();

  // State to hold active marking roster
  // Key: studentId, Value: AttendanceStatus
  const [markingRoster, setMarkingRoster] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Filter classes assigned to this specific teacher
  const assignedClasses = classes.filter(c => c.teacherId === teacher.id);

  // Get students of the currently active/selected class
  const activeClassStudents = selectedClass 
    ? students.filter(s => s.classId === selectedClass.id || s.classIds?.includes(selectedClass.id)) 
    : [];

  // Handle Opening/Selecting a class to mark attendance
  const handleOpenClass = useCallback((cls: Class, shouldNavigate = true) => {
    if (shouldNavigate) {
      navigate(`/teacher/class/${cls.id}`);
    }

    setSelectedClass(cls);
    setShowSuccessScreen(false);

    // Look up if attendance is already recorded for this class + date
    const existingRecord = attendanceRecords.find(
      r => r.classId === cls.id && r.date === attendanceDate
    );

    const initialRoster: Record<string, AttendanceStatus> = {};
    const classStudents = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id));

    classStudents.forEach(student => {
      if (existingRecord) {
        const studentStatus = existingRecord.students.find(s => s.studentId === student.id);
        initialRoster[student.id] = studentStatus ? studentStatus.status : 'Present';
      } else {
        initialRoster[student.id] = 'Present'; // Default to present
      }
    });

    setMarkingRoster(initialRoster);
  }, [attendanceDate, attendanceRecords, navigate, students]);

  // Fast action: mark all students in class as Present
  const handleMarkAllPresent = () => {
    const updated = { ...markingRoster };
    activeClassStudents.forEach(s => {
      updated[s.id] = 'Present';
    });
    setMarkingRoster(updated);
  };

  const handleUpdateStatus = (studentId: string, status: AttendanceStatus) => {
    setMarkingRoster(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Submit attendance records
  const handleSubmit = () => {
    if (!selectedClass) return;

    setIsSubmitting(true);

    // Compile into API structure
    const statusList = Object.entries(markingRoster).map(([studentId, status]) => ({
      studentId,
      status: status as AttendanceStatus,
    }));

    setTimeout(() => {
      onSubmitAttendance(selectedClass.id, attendanceDate, statusList);
      setIsSubmitting(false);
      setShowSuccessScreen(true);
    }, 1200);
  };

  useEffect(() => {
    if (routeClassId) {
      const routeClass = assignedClasses.find(c => c.id === routeClassId) || classes.find(c => c.id === routeClassId);
      if (routeClass && routeClass.id !== selectedClass?.id) {
        handleOpenClass(routeClass, false);
      }
    } else if (selectedClass) {
      setSelectedClass(null);
      setShowSuccessScreen(false);
    }
  }, [routeClassId, assignedClasses, classes, selectedClass, handleOpenClass]);

  return (
    <div id="teacher-mobile-portal" className="h-full bg-slate-50 flex flex-col font-sans select-none relative">
      
      {/* Dynamic Screen Content Wrapper */}
      <AnimatePresence mode="wait">
        {!selectedClass ? (
          
          /* VIEW A: HOME DASHBOARD */
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-5 space-y-6 overflow-y-auto"
          >
            {/* Header Greeting */}
            <div className="flex justify-between items-start pt-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">Springfield Academy</span>
                <h3 className="text-lg font-black text-slate-800 leading-tight">Hi, {teacher.name.split(' ')[0]}! 👋</h3>
                <p className="text-[11px] text-slate-500 font-medium">Instructor of {teacher.subject}</p>
                {import.meta.env.MODE !== 'production' && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Debug: id={teacher.id} email={teacher.email} assignedClasses={assignedClasses.length}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status banner */}
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-2xl p-4 shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-20px] opacity-15">
                <ClipboardCheck className="w-32 h-32" />
              </div>
              
              <div className="flex items-center gap-1.5 bg-white/20 py-0.5 px-2.5 rounded-full w-max text-[9px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                Mark Roll Call Daily
              </div>
              
              <h4 className="text-sm font-bold">Attendance Accountability</h4>
              <p className="text-[10px] text-indigo-100 leading-relaxed max-w-[85%]">
                Select an assigned class below to inspect student roster, mark absentees, and report metrics.
              </p>
            </div>

            {/* Class List Title */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Your Assigned Classes ({assignedClasses.length})</span>
                <span className="text-[10px] text-slate-400 font-mono">Roll Registry</span>
              </div>

              {/* Class Cards List */}
              <div className="space-y-3">
                {assignedClasses.map(cls => {
                  const studentCount = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id)).length;
                  // check if already submitted today
                  const isSubmittedToday = attendanceRecords.some(
                    r => r.classId === cls.id && r.date === new Date().toISOString().split('T')[0]
                  );

                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => handleOpenClass(cls)}
                      className="w-full text-left bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isSubmittedToday ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {isSubmittedToday ? <Check className="w-5 h-5" /> : cls.name.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {cls.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span>Room {cls.room.replace('Room ', '')}</span>
                            <span>•</span>
                            <span>{studentCount} Students</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSubmittedToday ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                            Done
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </button>
                  );
                })}

                {assignedClasses.length === 0 && (
                  <div className="bg-slate-100 py-10 rounded-2xl border border-slate-200/60 text-center text-slate-400 text-xs">
                    <BookOpen className="w-8 h-8 mx-auto mb-2.5 stroke-1 text-slate-300" />
                    No classes assigned to you. Admin can link teacher accounts.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : showSuccessScreen ? (
          
          /* VIEW B: SUCCESS CONFIRMATION */
          <motion.div
            key="success"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-6 bg-white"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-md">
              <CheckCircle2 className="w-10 h-10 fill-emerald-100" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Attendance Logged!</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                The Springfield attendance ledger has updated successfully for <span className="font-semibold text-slate-700">{selectedClass.name}</span>.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 w-full border border-slate-100 text-xs space-y-2.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Classroom:</span>
                <span className="font-bold text-slate-700">{selectedClass.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date Logged:</span>
                <span className="font-mono font-bold text-slate-700">{attendanceDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Present Status Rate:</span>
                <span className="font-bold text-emerald-600">
                  {Object.values(markingRoster).filter(v => v === 'Present').length} / {activeClassStudents.length} Students
                </span>
              </div>
            </div>

            <button
              type="button"
              id="success-back-home"
              onClick={() => navigate('/teacher')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer select-none"
            >
              Back to Class Registry
            </button>
          </motion.div>
        ) : (
          
          /* VIEW C: ATTENDANCE INTAKE SHEET */
          <motion.div
            key="intake"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden"
          >
            {/* Header / Back Action Bar */}
            <div className="bg-white px-4 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                id="back-to-classes-btn"
                onClick={() => navigate('/teacher')}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              
              <div className="text-center">
                <h4 className="text-xs font-black text-slate-800 truncate max-w-[180px]">
                  {selectedClass.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold">{activeClassStudents.length} Student Roster</p>
              </div>

              <span className="w-7 h-7 text-transparent" />
            </div>

            {/* Date Picker & Fast mark as Present */}
            <div className="bg-white px-4 py-2.5 border-b border-slate-200/60 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <input
                  id="teacher-datepicker"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    // re-trigger load
                    handleOpenClass(selectedClass);
                  }}
                  className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>

              <button
                type="button"
                id="mark-all-present-btn"
                onClick={handleMarkAllPresent}
                className="py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Users className="w-3 h-3" />
                Mark All Present
              </button>
            </div>

            {/* Students Intake Scrollable List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {activeClassStudents.map((student) => {
                const currentStatus = markingRoster[student.id] || 'Present';

                return (
                  <div key={student.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-3">
                    {/* Student Identity Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{student.name}</h5>
                          <p className="text-[9px] text-slate-400 font-semibold">Roll: {student.rollNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status selection pill box */}
                    <div className="grid grid-cols-4 gap-2">
                      {(['Present', 'Sick', 'Excused', 'Absent'] as AttendanceStatus[]).map((status) => {
                        const isSelected = currentStatus === status;
                        let activeBg = '';
                        let textTheme = '';
                        
                        if (status === 'Present') {
                          activeBg = isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/10' : 'hover:bg-emerald-50/50 border-slate-200 text-slate-500';
                          textTheme = 'text-emerald-500';
                        } else if (status === 'Sick') {
                          activeBg = isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/10' : 'hover:bg-amber-50/50 border-slate-200 text-slate-500';
                          textTheme = 'text-amber-500';
                        } else if (status === 'Excused') {
                          activeBg = isSelected ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/10' : 'hover:bg-blue-50/50 border-slate-200 text-slate-500';
                          textTheme = 'text-blue-500';
                        } else if (status === 'Absent') {
                          activeBg = isSelected ? 'bg-red-500 border-red-500 text-white shadow-red-500/10' : 'hover:bg-red-50/50 border-slate-200 text-slate-500';
                          textTheme = 'text-red-500';
                        }

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleUpdateStatus(student.id, status)}
                            className={`py-1.5 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${activeBg}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {activeClassStudents.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No students in classroom roster.
                </div>
              )}
            </div>

            {/* Bottom Submit Sticky Deck */}
            <div className="bg-white p-4 border-t border-slate-200 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Roster Completion</span>
                <span className="text-slate-500">
                  {Object.keys(markingRoster).length} / {activeClassStudents.length} marked
                </span>
              </div>
              
              <button
                type="button"
                id="submit-attendance-btn"
                disabled={isSubmitting || activeClassStudents.length === 0}
                onClick={handleSubmit}
                className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 text-white rounded-xl font-bold text-xs shadow-md active:scale-[0.99] transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Submit Daily Attendance'
                )}
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
