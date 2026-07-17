/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admin } from '../../types';
import { IAdminRepository } from '../repositories/interfaces';

export class AdminService {
  constructor(private adminRepo: IAdminRepository) {}

  async getAllAdmins(): Promise<Admin[]> {
    return this.adminRepo.getAll();
  }

  async getAdminById(id: string): Promise<Admin | null> {
    return this.adminRepo.getById(id);
  }

  async createAdmin(adminData: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
    return this.adminRepo.create(adminData);
  }

  async updateAdmin(admin: Admin): Promise<Admin> {
    return this.adminRepo.update(admin);
  }

  async deleteAdmin(id: string): Promise<void> {
    return this.adminRepo.delete(id);
  }
}
