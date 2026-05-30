import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser } from '../types';
import { generateId } from '../utils';

interface AuthContextType {
  currentUser: AppUser | null;
  allUsers: AppUser[];
  login: (username: string, role: 'owner' | 'director' | 'coach' | 'player', passwordOrLicense?: string) => {success: boolean, error?: string};
  updateUserStatus: (userId: string, status: 'approved' | 'pending') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    // Load from local storage
    const storedUsers = localStorage.getItem('pickleball_users');
    const storedCurrent = localStorage.getItem('pickleball_currentUser');
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      // Create a default owner for demo purposes if no users exist
      const defaultOwner: AppUser = {
        id: 'owner-1',
        username: 'Tinaowner',
        role: 'owner',
        status: 'approved',
        createdAt: Date.now()
      };
      setAllUsers([defaultOwner]);
      localStorage.setItem('pickleball_users', JSON.stringify([defaultOwner]));
    }
    
    if (storedCurrent) {
      setCurrentUser(JSON.parse(storedCurrent));
    }
  }, []);

  const login = (username: string, role: 'owner' | 'director' | 'coach' | 'player', passwordOrLicense?: string): {success: boolean, error?: string} => {
    let users = [...allUsers];
    let user = users.find(u => u.username === username);
    
    // For demo: verify owner access via a simple password check
    if (role === 'owner') {
       if (passwordOrLicense !== 'PickleBoss2026') {
         return { success: false, error: "Incorrect Director Password" };
       }
       if (username !== 'Tinaowner') {
         return { success: false, error: "Incorrect Director Username" };
       }
       // If owner doesn't exist by name, bind to the default owner or create
       if (!user) {
         user = users.find(u => u.role === 'owner');
         if (user) {
           user.username = 'Tinaowner';
         }
       }
    }
    
    if (!user) {
      user = {
        id: generateId(),
        username,
        role,
        status: role === 'owner' ? 'approved' : 'pending', // All users need owner approval except owner
        licenseNumber: (role === 'coach' || role === 'director') ? passwordOrLicense : undefined,
        createdAt: Date.now(),
      };
      users.push(user);
      setAllUsers(users);
      localStorage.setItem('pickleball_users', JSON.stringify(users));
    }
    
    setCurrentUser(user);
    localStorage.setItem('pickleball_currentUser', JSON.stringify(user));
    return { success: true };
  };

  const updateUserStatus = (userId: string, status: 'approved' | 'pending') => {
    const updatedUsers = allUsers.map(u => u.id === userId ? { ...u, status } : u);
    setAllUsers(updatedUsers);
    localStorage.setItem('pickleball_users', JSON.stringify(updatedUsers));
    
    // update current user if it's the one being modified (usually not the case as owner is doing this, but safe to add)
    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, status };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('pickleball_currentUser', JSON.stringify(updatedCurrent));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pickleball_currentUser');
  };

  return (
    <AuthContext.Provider value={{ currentUser, allUsers, login, updateUserStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
