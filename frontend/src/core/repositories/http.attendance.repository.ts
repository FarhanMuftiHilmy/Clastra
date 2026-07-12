/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord } from '../../types';
import { IAttendanceRepository } from './interfaces';
import { HttpClient } from './http.client';

export class HttpAttendanceRepository implements IAttendanceRepository {
  async getAll(): Promise<AttendanceRecord[]> {
    return HttpClient.get<AttendanceRecord[]>('/attendance');
  }

  async getByClassAndDate(classId: string, date: string): Promise<AttendanceRecord | null> {
    try {
      const records = await HttpClient.get<AttendanceRecord[]>(`/attendance?classId=${classId}&date=${date}`);
      return records.length > 0 ? records[0] : null;
    } catch {
      return null;
    }
  }

  async save(record: AttendanceRecord): Promise<AttendanceRecord> {
    return HttpClient.post<AttendanceRecord>('/attendance', record);
  }

  async deleteByClassId(classId: string): Promise<void> {
    // Note: Deletion of classes and related cascades is handled transactionally by the server.
    // However, if called manually, we execute the corresponding endpoint.
    return HttpClient.delete(`/attendance?classId=${classId}`);
  }

  async removeStudentFromRecords(studentId: string): Promise<void> {
    // Handled server-side transactionally inside the Student Delete lifecycle,
    // so we can leave this as a safe no-op or proxy deletion.
  }
}
