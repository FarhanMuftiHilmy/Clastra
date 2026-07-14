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

  private static async handleResponse<T>(response: Response, method: string): Promise<T> {
    if (!response.ok) {
      let message = `HTTP ${method} error: ${response.status} ${response.statusText}`;
      try {
        const text = await response.text();
        if (text) {
          const parsed = JSON.parse(text);
          message = parsed.detail || parsed.title || message;
        }
      } catch {
        // Ignore parse errors and fall back to the default message.
      }
      throw new Error(message);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  static async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response, 'GET');
  }

  static async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response, 'POST');
  }

  static async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response, 'PUT');
  }

  static async delete(path: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse<void>(response, 'DELETE');
  }
}
