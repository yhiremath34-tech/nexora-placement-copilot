import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Detect whether a genuine configured Supabase URL is provided
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://mock-nexora-instance.supabase.co', 'mock-anon-key-local-only', {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
      },
    });

// Universal Storage Repository for Offline / Development demo persistence
// Seamlessly operates in both browser (localStorage) and Node/test environments (memory fallback)
class LocalPersistentStore {
  private memoryMap = new Map<string, string>();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getKey(table: string): string {
    return `nexora_${table}`;
  }

  private getItem(key: string): string | null {
    if (this.isStorageAvailable()) {
      return localStorage.getItem(key);
    }
    return this.memoryMap.get(key) || null;
  }

  private setItem(key: string, value: string): void {
    if (this.isStorageAvailable()) {
      localStorage.setItem(key, value);
    }
    this.memoryMap.set(key, value);
  }

  private removeItem(key: string): void {
    if (this.isStorageAvailable()) {
      localStorage.removeItem(key);
    }
    this.memoryMap.delete(key);
  }

  get<T>(table: string): T[] {
    try {
      const data = this.getItem(this.getKey(table));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  set<T>(table: string, items: T[]): void {
    try {
      this.setItem(this.getKey(table), JSON.stringify(items));
    } catch (e) {
      console.error(`Failed to persist table ${table}`, e);
    }
  }

  insert<T extends { id?: string }>(table: string, item: T): T {
    const list = this.get<T>(table);
    const newItem = {
      ...item,
      id: item.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newItem);
    this.set(table, list);
    return newItem;
  }

  update<T = Record<string, any>>(table: string, id: string, updates: Partial<T> | Record<string, any>): T | null {
    const list = this.get<any>(table);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.set(table, list);
    return updated;
  }

  delete(table: string, id: string): boolean {
    const list = this.get<{ id: string }>(table);
    const filtered = list.filter((item) => item.id !== id);
    this.set(table, filtered);
    return filtered.length < list.length;
  }

  clearAllUserData(): void {
    const tables = [
      'profiles',
      'resumes',
      'career_preferences',
      'saved_jobs',
      'application_drafts',
      'approval_requests',
      'applications',
      'agent_sessions',
      'agent_messages',
      'agent_tool_logs',
      'users',
    ];
    tables.forEach((t) => this.removeItem(this.getKey(t)));
  }
}

export const localStore = new LocalPersistentStore();
