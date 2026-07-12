/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryStudentRepository } from './repositories/student.repository';
import { InMemoryClassRepository } from './repositories/class.repository';
import { InMemoryTeacherRepository } from './repositories/teacher.repository';
import { InMemoryAttendanceRepository } from './repositories/attendance.repository';

import { StudentService } from './services/student.service';
import { ClassService } from './services/class.service';
import { TeacherService } from './services/teacher.service';
import { AttendanceService } from './services/attendance.service';
import { AuthService } from './services/auth.service';

// Instantiate repositories
export const studentRepository = new InMemoryStudentRepository();
export const classRepository = new InMemoryClassRepository();
export const teacherRepository = new InMemoryTeacherRepository();
export const attendanceRepository = new InMemoryAttendanceRepository();

// Instantiate services and inject dependencies
export const studentService = new StudentService(studentRepository, attendanceRepository);
export const classService = new ClassService(classRepository, studentRepository, attendanceRepository);
export const teacherService = new TeacherService(teacherRepository);
export const attendanceService = new AttendanceService(attendanceRepository);
export const authService = new AuthService(teacherRepository);
