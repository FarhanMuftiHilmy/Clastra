/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  classId: string; // Primary class reference
  classIds?: string[]; // All enrolled classes
  gender: 'Male' | 'Female' | 'Other';
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  room: string;
  teacherId: string | null; // Assigned Teacher.id
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super' | 'limited';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
}

export type AttendanceStatus = 'Present' | 'Sick' | 'Excused' | 'Absent';

export interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  submittedBy: string; // Teacher.id
  submittedAt: string; // ISO timestamp
  students: StudentAttendance[];
}

export type UserRole = 'admin' | 'teacher';

export interface CurrentUser {
  role: UserRole;
  adminRole?: 'super' | 'limited';
  id: string; // admin or teacher ID
  name: string;
  email: string;
  token?: string;
}
