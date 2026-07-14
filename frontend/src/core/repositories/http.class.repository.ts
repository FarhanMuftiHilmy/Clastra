/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Class } from '../../types';
import { IClassRepository } from './interfaces';
import { HttpClient } from './http.client';

export class HttpClassRepository implements IClassRepository {
  async getAll(): Promise<Class[]> {
    console.log('Fetching all classes');
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
    console.log('Creating class:', classData);
    return HttpClient.post<Class>('/classes', classData);
  }

  async update(classData: Class): Promise<Class> {
    console.log('Updating class:', classData);
    return HttpClient.put<Class>(`/classes/${classData.id}`, classData);
  }

  async delete(id: string): Promise<void> {
    return HttpClient.delete(`/classes/${id}`);
  }
}
