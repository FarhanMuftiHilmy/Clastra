/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher } from '../../types';
import { ITeacherRepository } from './interfaces';
import { HttpClient } from './http.client';

export class HttpTeacherRepository implements ITeacherRepository {
  async getAll(): Promise<Teacher[]> {
    return HttpClient.get<Teacher[]>('/teachers');
  }

  async getById(id: string): Promise<Teacher | null> {
    try {
      return await HttpClient.get<Teacher>(`/teachers/${id}`);
    } catch {
      return null;
    }
  }
}
