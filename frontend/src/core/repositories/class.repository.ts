/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Class } from '../../types';
import { IClassRepository } from './interfaces';
import { INITIAL_CLASSES } from '../../data';

const STORAGE_KEY = 'sms_classes';

export class InMemoryClassRepository implements IClassRepository {
  private async load(): Promise<Class[]> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    this.saveToStorage(INITIAL_CLASSES);
    return INITIAL_CLASSES;
  }

  private saveToStorage(classes: Class[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  }

  async getAll(): Promise<Class[]> {
    console.log('Fetching all classes from InMemoryClassRepository');
    return this.load();
  }

  async getById(id: string): Promise<Class | null> {
    const list = await this.load();
    return list.find(c => c.id === id) || null;
  }

  async create(classData: Omit<Class, 'id'>): Promise<Class> {
    const list = await this.load();
    const newClass: Class = {
      ...classData,
      id: `cls_${Date.now()}`,
    };
    list.push(newClass);
    this.saveToStorage(list);
    return newClass;
  }

  async update(classData: Class): Promise<Class> {
    const list = await this.load();
    const index = list.findIndex(c => c.id === classData.id);
    if (index !== -1) {
      list[index] = classData;
      this.saveToStorage(list);
      return classData;
    }
    throw new Error(`Class with id ${classData.id} not found`);
  }

  async delete(id: string): Promise<void> {
    const list = await this.load();
    const filtered = list.filter(c => c.id !== id);
    this.saveToStorage(filtered);
  }
}
