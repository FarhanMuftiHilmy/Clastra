/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Class } from '../../types';
import { IClassRepository } from './interfaces';
import { HttpClient } from './http.client';

export class HttpClassRepository implements IClassRepository {
  async getAll(): Promise<Class[]> {
    return HttpClient.get<Class[]>('/classes');
  }

  async getById(id: string): Promise<Class | null> {
    try {
      return await HttpClient.get<Class>(`/classes/${id}`);
    } catch {
      return null;
    }
  }

  async create(classData: Omit<Class, 'id'>): Promise<Class> {
    return HttpClient.post<Class>('/classes', classData);
  }

  async update(classData: Class): Promise<Class> {
    return HttpClient.put<Class>(`/classes/${classData.id}`, classData);
  }

  async delete(id: string): Promise<void> {
    return HttpClient.delete(`/classes/${id}`);
  }
}
