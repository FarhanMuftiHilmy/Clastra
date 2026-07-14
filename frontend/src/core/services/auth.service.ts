/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrentUser, UserRole } from '../../types';
import { ITeacherRepository } from '../repositories/interfaces';
import { HttpClient } from '../repositories/http.client';

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

  async login(role: UserRole, email: string, password?: string): Promise<CurrentUser> {
    const requestPassword = password ?? (role === 'admin' ? 'admin123' : 'teacher123');

    try {
      const user = await HttpClient.post<CurrentUser>('/auth/login', {
        role,
        email,
        password: requestPassword,
      });

      const sessionUser: CurrentUser = {
        ...user,
        role: user.role ?? role,
        email: user.email ?? email,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
