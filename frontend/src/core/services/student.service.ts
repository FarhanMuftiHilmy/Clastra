/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../../types';
import { IStudentRepository, IAttendanceRepository } from '../repositories/interfaces';

export class StudentService {
  constructor(
    private studentRepo: IStudentRepository,
    private attendanceRepo: IAttendanceRepository
  ) {}

  async getAllStudents(): Promise<Student[]> {
    return this.studentRepo.getAll();
  }

  async getStudentById(id: string): Promise<Student | null> {
    return this.studentRepo.getById(id);
  }

  async addStudent(studentData: Omit<Student, 'id'>): Promise<Student> {
    return this.studentRepo.create(studentData);
  }

  async updateStudent(student: Student): Promise<Student> {
    return this.studentRepo.update(student);
  }

  async deleteStudent(id: string): Promise<void> {
    await this.studentRepo.delete(id);
    await this.attendanceRepo.removeStudentFromRecords(id);
  }

  async assignStudentToClass(studentId: string, classId: string): Promise<void> {
    return this.studentRepo.assignToClass(studentId, classId);
  }

  async removeStudentFromClass(studentId: string, classId: string): Promise<void> {
    return this.studentRepo.removeFromClass(studentId, classId);
  }

  async getStudentClassIds(studentId: string): Promise<string[]> {
    return this.studentRepo.getClassIds(studentId);
  }
}
