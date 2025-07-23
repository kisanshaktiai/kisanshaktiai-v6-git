
import { createContext, useContext } from 'react';

interface MinimalAuthContextType {
  user: null;
  session: null;
  profile: null;
  loading: false;
  isAuthenticated: false;
}

const defaultContext: MinimalAuthContextType = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  isAuthenticated: false,
};

export const AuthContext = createContext<MinimalAuthContextType>(defaultContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return defaultContext;
  }
  return context;
};
