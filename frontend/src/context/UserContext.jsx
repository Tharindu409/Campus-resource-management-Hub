import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

const DEFAULT_USER = {
  userId: '',
  userName: 'Guest',
  role: 'USER',
  roles: ['ROLE_USER'],
};

export function UserProvider({ children }) {
  const { user } = useAuth();

  const currentUser = useMemo(() => {
    if (!user) {
      return DEFAULT_USER;
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];

    let role = 'USER';
    if (roles.includes('ROLE_ADMIN')) {
      role = 'ADMIN';
    } else if (roles.includes('ROLE_TECHNICIAN')) {
      role = 'TECHNICIAN';
    }

    return {
      userId: user.id || '',
      userName: user.name || user.email || 'User',
      role,
      roles,
    };
  }, [user]);

  const toggleRole = () => {
    // Disable local role switching; role comes from authenticated backend user roles.
  };

  const switchToUser = () => {
    // Disable local user switching in integrated auth flow.
  };

  return (
    <UserContext.Provider value={{ currentUser, toggleRole, switchToUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
