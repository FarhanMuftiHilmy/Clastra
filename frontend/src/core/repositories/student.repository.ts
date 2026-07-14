/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../../types';
import { IStudentRepository } from './interfaces';
import { INITIAL_STUDENTS } from '../../data';

const STORAGE_KEY = 'sms_students';

export class InMemoryStudentRepository implements IStudentRepository {
  private async load(): Promise<Student[]> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    this.saveToStorage(INITIAL_STUDENTS);
    return INITIAL_STUDENTS;
  }

  private saveToStorage(students: Student[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }

  async getAll(): Promise<Student[]> {
    return this.load();
  }

  async getById(id: string): Promise<Student | null> {
    const list = await this.load();
    return list.find(s => s.id === id) || null;
  }

  async create(studentData: Omit<Student, 'id'>): Promise<Student> {
    const list = await this.load();
    const newStudent: Student = {
      ...studentData,
      id: `std_${Date.now()}`,
    };
    list.push(newStudent);
    this.saveToStorage(list);
    return newStudent;
  }

  async update(student: Student): Promise<Student> {
    const list = await this.load();
    const index = list.findIndex(s => s.id === student.id);
    if (index !== -1) {
      list[index] = student;
      this.saveToStorage(list);
      return student;
    }
    throw new Error(`Student with id ${student.id} not found`);
  }

  async delete(id: string): Promise<void> {
    const list = await this.load();
    const filtered = list.filter(s => s.id !== id);
    this.saveToStorage(filtered);
  }
}
