/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../../types';
import { IStudentRepository } from './interfaces';
import { HttpClient } from './http.client';

export class HttpStudentRepository implements IStudentRepository {
  async getAll(): Promise<Student[]> {
    return HttpClient.get<Student[]>('/students');
  }

  async getById(id: string): Promise<Student | null> {
    try {
      return await HttpClient.get<Student>(`/students/${id}`);
    } catch {
      return null;
    }
  }

  async create(studentData: Omit<Student, 'id'>): Promise<Student> {
    return HttpClient.post<Student>('/students', studentData);
  }

  async update(student: Student): Promise<Student> {
    return HttpClient.put<Student>(`/students/${student.id}`, student);
  }

  async delete(id: string): Promise<void> {
    return HttpClient.delete(`/students/${id}`);
  }

  async assignToClass(studentId: string, classId: string): Promise<void> {
    return HttpClient.post(`/students/${studentId}/classes`, { classId });
  }

  async removeFromClass(studentId: string, classId: string): Promise<void> {
    return HttpClient.delete(`/students/${studentId}/classes/${classId}`);
  }

  async getClassIds(studentId: string): Promise<string[]> {
    return HttpClient.get<string[]>(`/students/${studentId}/classes`);
  }
}
