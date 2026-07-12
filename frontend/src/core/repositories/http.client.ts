/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export class HttpClient {
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const storedUser = localStorage.getItem('sms_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Assuming token is stored in the user object or session
        if (parsed && parsed.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        console.error('Failed to parse current user for auth headers', e);
      }
    }
    return headers;
  }

  static async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP GET error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  static async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP POST error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  static async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP PUT error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  static async delete(path: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP DELETE error: ${response.status} ${response.statusText}`);
    }
  }
}
