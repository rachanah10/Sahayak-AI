
"use client";

import { useContext } from 'react';
import { type User } from 'firebase/auth';
import { AuthContext, type AuthContextType } from './auth-provider';

export interface AuthUser extends User {
  is_admin?: boolean;
  name?: string;
  role?: 'teacher' | 'student';
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
