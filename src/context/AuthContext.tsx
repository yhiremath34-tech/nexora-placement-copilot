import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, localStore } from '../services/supabaseClient';
import { StudentProfile, CareerPreferences } from '../types/database.types';

export interface UserSession {
  id: string;
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  profile: StudentProfile | null;
  preferences: CareerPreferences | null;
  isLoading: boolean;
  error: string | null;
  isCloudSupabase: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<boolean>;
  signUpWithEmail: (email: string, fullName: string, password?: string) => Promise<boolean>;
  signInDemoStudent: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<boolean>;
  updatePreferences: (updates: Partial<CareerPreferences>) => Promise<boolean>;
  deleteAccountAndData: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

const DEFAULT_DEMO_PROFILE: StudentProfile = {
  id: DEMO_USER_ID,
  full_name: 'Alex Chen',
  email: 'alex.chen@university.edu',
  headline: 'Computer Science Senior | Aspiring AI & Full-Stack Engineer',
  university: 'Tech University',
  graduation_year: 2026,
  degree: 'Bachelor of Science',
  major: 'Computer Science & AI',
  gpa: 3.85,
  bio: 'Passionate student developer building full-stack web applications and machine learning prototypes. Active open-source contributor and hackathon participant.',
  phone: '+1 (555) 382-9102',
  location: 'San Francisco, CA (Open to Remote)',
  linkedin_url: 'https://linkedin.com/in/alexchen-demo',
  github_url: 'https://github.com/alexchen-demo',
  portfolio_url: 'https://alexchen.dev',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_DEMO_PREFERENCES: CareerPreferences = {
  id: '00000000-0000-4000-8000-000000000002',
  user_id: DEMO_USER_ID,
  target_roles: ['AI Engineer Intern', 'Full Stack Developer', 'Machine Learning Intern', 'Software Engineer New Grad'],
  preferred_locations: ['Remote', 'San Francisco, CA', 'New York, NY'],
  remote_preference: 'hybrid',
  experience_level: 'entry_level',
  min_salary_usd: 85000,
  target_industries: ['Artificial Intelligence', 'SaaS', 'Developer Tools', 'Fintech'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [preferences, setPreferences] = useState<CareerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isCloud = isSupabaseConfigured();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (isCloud) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userObj: UserSession = { id: session.user.id, email: session.user.email || '' };
            setUser(userObj);
            await loadCloudUserData(userObj.id);
          } else {
            // Check if demo user saved in localStorage
            loadLocalUserData();
          }
        } else {
          loadLocalUserData();
        }
      } catch (err: unknown) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isCloud]);

  const loadLocalUserData = () => {
    const savedUser = localStorage.getItem('nexora_active_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as UserSession;
        setUser(u);
        const profiles = localStore.get<StudentProfile>('profiles');
        const foundProfile = profiles.find((p) => p.id === u.id);
        setProfile(foundProfile || null);

        const prefs = localStore.get<CareerPreferences>('career_preferences');
        const foundPref = prefs.find((p) => p.user_id === u.id);
        setPreferences(foundPref || null);
      } catch {
        setUser(null);
      }
    }
  };

  const loadCloudUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileData) setProfile(profileData as StudentProfile);

      const { data: prefData } = await supabase
        .from('career_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (prefData) setPreferences(prefData as CareerPreferences);
    } catch (e) {
      console.error('Error loading cloud user profile:', e);
    }
  };

  const signInWithEmail = async (email: string, password = 'password123'): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      if (isCloud) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          const u: UserSession = { id: data.user.id, email: data.user.email || email };
          setUser(u);
          await loadCloudUserData(u.id);
          return true;
        }
      } else {
        // Local mode sign in
        const existingUsers = localStore.get<{ id: string; email: string }>('users');
        let userRecord = existingUsers.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!userRecord) {
          userRecord = { id: crypto.randomUUID(), email };
          localStore.insert('users', userRecord);
        }
        const u: UserSession = { id: userRecord.id, email: userRecord.email };
        setUser(u);
        localStorage.setItem('nexora_active_user', JSON.stringify(u));
        loadLocalUserData();
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    fullName: string,
    password = 'password123'
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      if (isCloud) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          const u: UserSession = { id: data.user.id, email: data.user.email || email };
          setUser(u);
          // Insert initial profile
          const newProfile: StudentProfile = {
            id: u.id,
            full_name: fullName,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await supabase.from('profiles').insert(newProfile);
          setProfile(newProfile);
          return true;
        }
      } else {
        // Local mode sign up
        const userId = crypto.randomUUID();
        const u: UserSession = { id: userId, email };
        localStore.insert('users', u);
        const newProfile: StudentProfile = {
          id: userId,
          full_name: fullName,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStore.insert('profiles', newProfile);
        setUser(u);
        setProfile(newProfile);
        localStorage.setItem('nexora_active_user', JSON.stringify(u));
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInDemoStudent = () => {
    const demoUser: UserSession = {
      id: DEMO_USER_ID,
      email: DEFAULT_DEMO_PROFILE.email,
    };
    setUser(demoUser);
    setProfile(DEFAULT_DEMO_PROFILE);
    setPreferences(DEFAULT_DEMO_PREFERENCES);

    // Save into local store so refreshes work
    localStorage.setItem('nexora_active_user', JSON.stringify(demoUser));
    const existingProfiles = localStore.get<StudentProfile>('profiles');
    if (!existingProfiles.some((p) => p.id === DEMO_USER_ID)) {
      localStore.insert('profiles', DEFAULT_DEMO_PROFILE);
    }
    const existingPrefs = localStore.get<CareerPreferences>('career_preferences');
    if (!existingPrefs.some((p) => p.user_id === DEMO_USER_ID)) {
      localStore.insert('career_preferences', DEFAULT_DEMO_PREFERENCES);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isCloud) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('nexora_active_user');
      setUser(null);
      setProfile(null);
      setPreferences(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<StudentProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const updatedProfile: StudentProfile = {
        ...(profile || {
          id: user.id,
          email: user.email,
          full_name: 'Student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (isCloud) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .upsert(updatedProfile);
        if (updateErr) throw updateErr;
      } else {
        localStore.update('profiles', user.id, updatedProfile);
      }
      setProfile(updatedProfile);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error updating profile';
      setError(msg);
      return false;
    }
  };

  const updatePreferences = async (updates: Partial<CareerPreferences>): Promise<boolean> => {
    if (!user) return false;
    try {
      const updatedPrefs: CareerPreferences = {
        ...(preferences || {
          id: crypto.randomUUID(),
          user_id: user.id,
          target_roles: [],
          preferred_locations: [],
          remote_preference: 'hybrid',
          experience_level: 'entry_level',
          target_industries: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (isCloud) {
        const { error: prefErr } = await supabase
          .from('career_preferences')
          .upsert(updatedPrefs);
        if (prefErr) throw prefErr;
      } else {
        const existing = localStore.get<CareerPreferences>('career_preferences');
        const found = existing.find((p) => p.user_id === user.id);
        if (found) {
          localStore.update('career_preferences', found.id, updatedPrefs);
        } else {
          localStore.insert('career_preferences', updatedPrefs);
        }
      }
      setPreferences(updatedPrefs);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error updating career preferences';
      setError(msg);
      return false;
    }
  };

  const deleteAccountAndData = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      if (isCloud) {
        // Cascade delete on profiles will delete associated rows via RLS/FK
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      }
      localStore.clearAllUserData();
      localStorage.removeItem('nexora_active_user');
      setUser(null);
      setProfile(null);
      setPreferences(null);
      return true;
    } catch (e) {
      console.error('Error deleting account:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        isLoading,
        error,
        isCloudSupabase: isCloud,
        signInWithEmail,
        signUpWithEmail,
        signInDemoStudent,
        signOut,
        updateProfile,
        updatePreferences,
        deleteAccountAndData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
