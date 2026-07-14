/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord } from '../../types';
import { IAttendanceRepository } from './interfaces';
import { generateInitialAttendance } from '../../data';

const STORAGE_KEY = 'sms_attendance_records';

export class InMemoryAttendanceRepository implements IAttendanceRepository {
  private async load(): Promise<AttendanceRecord[]> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    const initial = generateInitialAttendance();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(records: AttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  async getAll(): Promise<AttendanceRecord[]> {
    return this.load();
  }

  async getByClassAndDate(classId: string, date: string): Promise<AttendanceRecord | null> {
    const list = await this.load();
    return list.find(r => r.classId === classId && r.date === date) || null;
  }

  async save(record: AttendanceRecord): Promise<AttendanceRecord> {
    const list = await this.load();
    const index = list.findIndex(r => r.classId === record.classId && r.date === record.date);
    if (index !== -1) {
      list[index] = record;
    } else {
      list.push(record);
    }
    this.saveToStorage(list);
    return record;
  }

  async deleteByClassId(classId: string): Promise<void> {
    const list = await this.load();
    const filtered = list.filter(r => r.classId !== classId);
    this.saveToStorage(filtered);
  }

  async removeStudentFromRecords(studentId: string): Promise<void> {
    const list = await this.load();
    const updated = list.map(record => ({
      ...record,
      students: record.students.filter(s => s.studentId !== studentId),
    }));
    this.saveToStorage(updated);
  }
}
