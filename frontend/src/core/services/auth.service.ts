/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrentUser, UserRole } from '../../types';
import { ITeacherRepository } from '../repositories/interfaces';

const STORAGE_KEY = 'sms_current_user';

export class AuthService {
  constructor(private teacherRepo: ITeacherRepository) {}

  async getCurrentUser(): Promise<CurrentUser | null> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  async login(role: UserRole, email: string): Promise<CurrentUser> {
    if (role === 'admin') {
      const user: CurrentUser = {
        role: 'admin',
        id: 'admin_1',
        name: 'Principal Arthur',
        email: 'admin@school.edu',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    } else {
      const teachers = await this.teacherRepo.getAll();
      const found = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
      if (found) {
        const user: CurrentUser = {
          role: 'teacher',
          id: found.id,
          name: found.name,
          email: found.email,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error('Teacher email not found in school records.');
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
