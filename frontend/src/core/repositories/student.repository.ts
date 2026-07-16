/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../../types';
import { IStudentRepository } from './interfaces';
import { INITIAL_STUDENTS } from '../../data';

const STORAGE_KEY = 'sms_students';
const JOINS_KEY = 'sms_student_class_joins';

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
    const list = await this.load();
    const joins = await this.loadJoins();
    return list.map(student => ({
      ...student,
      classIds: joins[student.id] || [],
    }));
  }

  async getById(id: string): Promise<Student | null> {
    const list = await this.load();
    const student = list.find(s => s.id === id) || null;
    if (!student) return null;
    const joins = await this.loadJoins();
    return {
      ...student,
      classIds: joins[student.id] || [],
    };
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

  private async loadJoins(): Promise<Record<string, string[]>> {
    const stored = localStorage.getItem(JOINS_KEY);
    if (stored) return JSON.parse(stored);
    return {};
  }

  private async saveJoins(joins: Record<string, string[]>) {
    localStorage.setItem(JOINS_KEY, JSON.stringify(joins));
  }

  async assignToClass(studentId: string, classId: string): Promise<void> {
    const joins = await this.loadJoins();
    const list = joins[studentId] || [];
    if (!list.includes(classId)) {
      list.push(classId);
      joins[studentId] = list;
      await this.saveJoins(joins);
    }
  }

  async removeFromClass(studentId: string, classId: string): Promise<void> {
    const joins = await this.loadJoins();
    const list = joins[studentId] || [];
    const filtered = list.filter(c => c !== classId);
    joins[studentId] = filtered;
    await this.saveJoins(joins);
  }

  async getClassIds(studentId: string): Promise<string[]> {
    const joins = await this.loadJoins();
    return joins[studentId] || [];
  }
}
