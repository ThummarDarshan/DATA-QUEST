import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
type AuthGuardProps = {
  children: React.ReactNode;
};
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children
}) => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" style={{
          animationDelay: '0.2s'
        }}></div>
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" style={{
          animationDelay: '0.4s'
        }}></div>
        </div>
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{
      from: location
    }} replace />;
  }
  return <>{children}</>;
};