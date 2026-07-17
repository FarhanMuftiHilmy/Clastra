/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryStudentRepository } from './repositories/student.repository';
import { InMemoryClassRepository } from './repositories/class.repository';
import { InMemoryTeacherRepository } from './repositories/teacher.repository';
import { InMemoryAttendanceRepository } from './repositories/attendance.repository';
import { HttpStudentRepository } from './repositories/http.student.repository';
import { HttpClassRepository } from './repositories/http.class.repository';
import { HttpTeacherRepository } from './repositories/http.teacher.repository';
import { HttpAttendanceRepository } from './repositories/http.attendance.repository';
import { HttpAdminRepository } from './repositories/http.admin.repository';

import { StudentService } from './services/student.service';
import { ClassService } from './services/class.service';
import { TeacherService } from './services/teacher.service';
import { AttendanceService } from './services/attendance.service';
import { AdminService } from './services/admin.service';
import { AuthService } from './services/auth.service';

const useApi = import.meta.env.VITE_USE_API === 'true';

// Instantiate repositories
export const studentRepository = useApi ? new HttpStudentRepository() : new InMemoryStudentRepository();
export const classRepository = useApi ? new HttpClassRepository() : new InMemoryClassRepository();
export const teacherRepository = useApi ? new HttpTeacherRepository() : new InMemoryTeacherRepository();
export const attendanceRepository = useApi ? new HttpAttendanceRepository() : new InMemoryAttendanceRepository();
export const adminRepository = useApi ? new HttpAdminRepository() : null;

// Instantiate services and inject dependencies
export const studentService = new StudentService(studentRepository, attendanceRepository);
export const classService = new ClassService(classRepository, studentRepository, attendanceRepository);
export const teacherService = new TeacherService(teacherRepository);
export const attendanceService = new AttendanceService(attendanceRepository);
export const adminService = adminRepository ? new AdminService(adminRepository) : null;
export const authService = new AuthService(teacherRepository);
