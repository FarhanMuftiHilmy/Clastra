/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord, AttendanceStatus } from '../../types';
import { IAttendanceRepository } from '../repositories/interfaces';

export class AttendanceService {
  constructor(private attendanceRepo: IAttendanceRepository) {}

  async getAllRecords(): Promise<AttendanceRecord[]> {
    return this.attendanceRepo.getAll();
  }

  async getRecordByClassAndDate(classId: string, date: string): Promise<AttendanceRecord | null> {
    return this.attendanceRepo.getByClassAndDate(classId, date);
  }

  async submitAttendance(
    classId: string,
    date: string,
    submittedBy: string,
    studentStatuses: { studentId: string; status: AttendanceStatus }[]
  ): Promise<AttendanceRecord> {
    const recordId = `att_${classId}_${date}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      classId,
      date,
      submittedBy,
      submittedAt: new Date().toISOString(),
      students: studentStatuses,
    };
    return this.attendanceRepo.save(newRecord);
  }
}
