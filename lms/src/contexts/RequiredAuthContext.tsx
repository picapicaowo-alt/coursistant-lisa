import React from 'react';
import {LoginResponse} from "@/apis";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext";

interface RequiredAuthContextValue {
  user: LoginResponse;
}

const RequiredAuthContext = React.createContext<RequiredAuthContextValue | null>(null);

interface RequiredAuthProviderProps {
  children: React.ReactNode;
}

export const RequiredAuthProvider = ({children}: RequiredAuthProviderProps) => {
  const {user} = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <RequiredAuthContext.Provider value={{user}}>
      {children}
    </RequiredAuthContext.Provider>
  );
};

export const useRequiredAuth = () => {
  const context = React.useContext(RequiredAuthContext);
  if (!context) {
    throw new Error('useRequiredAuth must be used within a RequiredAuthProvider');
  }
  return context;
};