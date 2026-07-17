/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Class, Teacher, AttendanceRecord, Admin } from '../../types';

export interface IStudentRepository {
  getAll(): Promise<Student[]>;
  getById(id: string): Promise<Student | null>;
  create(student: Omit<Student, 'id'>): Promise<Student>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
  assignToClass(studentId: string, classId: string): Promise<void>;
  removeFromClass(studentId: string, classId: string): Promise<void>;
  getClassIds(studentId: string): Promise<string[]>;
}

export interface IClassRepository {
  getAll(): Promise<Class[]>;
  getById(id: string): Promise<Class | null>;
  create(classData: Omit<Class, 'id'>): Promise<Class>;
  update(classData: Class): Promise<Class>;
  delete(id: string): Promise<void>;
}

export interface ITeacherRepository {
  getAll(): Promise<Teacher[]>;
  getById(id: string): Promise<Teacher | null>;
  create(teacher: Omit<Teacher, 'id'>): Promise<Teacher>;
  update(teacher: Teacher): Promise<Teacher>;
  delete(id: string): Promise<void>;
}

export interface IAttendanceRepository {
  getAll(): Promise<AttendanceRecord[]>;
  getByClassAndDate(classId: string, date: string): Promise<AttendanceRecord | null>;
  save(record: AttendanceRecord): Promise<AttendanceRecord>;
  deleteByClassId(classId: string): Promise<void>;
  removeStudentFromRecords(studentId: string): Promise<void>;
}

export interface IAdminRepository {
  getAll(): Promise<Admin[]>;
  getById(id: string): Promise<Admin | null>;
  create(admin: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin>;
  update(admin: Admin): Promise<Admin>;
  delete(id: string): Promise<void>;
}
