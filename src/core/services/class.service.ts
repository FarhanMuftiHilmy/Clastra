/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Class } from '../../types';
import { IClassRepository, IStudentRepository, IAttendanceRepository } from '../repositories/interfaces';

export class ClassService {
  constructor(
    private classRepo: IClassRepository,
    private studentRepo: IStudentRepository,
    private attendanceRepo: IAttendanceRepository
  ) {}

  async getAllClasses(): Promise<Class[]> {
    return this.classRepo.getAll();
  }

  async getClassById(id: string): Promise<Class | null> {
    return this.classRepo.getById(id);
  }

  async addClass(classData: Omit<Class, 'id'>): Promise<Class> {
    return this.classRepo.create(classData);
  }

  async updateClass(classData: Class): Promise<Class> {
    return this.classRepo.update(classData);
  }

  async deleteClass(id: string): Promise<void> {
    await this.classRepo.delete(id);

    // Unassign student class IDs for deleted class
    const students = await this.studentRepo.getAll();
    for (const student of students) {
      if (student.classId === id) {
        await this.studentRepo.update({
          ...student,
          classId: '',
        });
      }
    }

    // Filter out attendance records of deleted class
    await this.attendanceRepo.deleteByClassId(id);
  }
}
