/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admin } from '../../types';
import { IAdminRepository } from './interfaces';
import { HttpClient } from './http.client';

export class HttpAdminRepository implements IAdminRepository {
  async getAll(): Promise<Admin[]> {
    return HttpClient.get<Admin[]>('/admins');
  }

  async getById(id: string): Promise<Admin | null> {
    try {
      return await HttpClient.get<Admin>(`/admins/${id}`);
    } catch {
      return null;
    }
  }

  async create(adminData: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
    return HttpClient.post<Admin>('/admins', adminData);
  }

  async update(admin: Admin): Promise<Admin> {
    return HttpClient.put<Admin>(`/admins/${admin.id}`, admin);
  }

  async delete(id: string): Promise<void> {
    return HttpClient.delete(`/admins/${id}`);
  }
}
