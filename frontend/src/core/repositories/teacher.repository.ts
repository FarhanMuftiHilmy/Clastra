/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher } from '../../types';
import { ITeacherRepository } from './interfaces';
import { INITIAL_TEACHERS } from '../../data';

const STORAGE_KEY = 'sms_teachers';

export class InMemoryTeacherRepository implements ITeacherRepository {
  private async load(): Promise<Teacher[]> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    this.saveToStorage(INITIAL_TEACHERS);
    return INITIAL_TEACHERS;
  }

  private saveToStorage(teachers: Teacher[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
  }

  async getAll(): Promise<Teacher[]> {
    return this.load();
  }

  async getById(id: string): Promise<Teacher | null> {
    const list = await this.load();
    return list.find(t => t.id === id) || null;
  }
}
