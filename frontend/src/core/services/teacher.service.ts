/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher } from '../../types';
import { ITeacherRepository } from '../repositories/interfaces';

export class TeacherService {
  constructor(private teacherRepo: ITeacherRepository) {}

  async getAllTeachers(): Promise<Teacher[]> {
    return this.teacherRepo.getAll();
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    return this.teacherRepo.getById(id);
  }
}
