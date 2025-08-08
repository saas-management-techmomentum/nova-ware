
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PasswordChangeGuardProps {
  children: React.ReactNode;
}

const PasswordChangeGuard: React.FC<PasswordChangeGuardProps> = ({ children }) => {
  const { needsPasswordChange, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthReady && needsPasswordChange && location.pathname !== '/change-password') {
      console.log('User needs password change, redirecting to /change-password');
      navigate('/change-password', { replace: true });
    }
  }, [needsPasswordChange, isAuthReady, location.pathname, navigate]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Checking authentication status...</div>
      </div>
    );
  }

  // If user needs password change and not on change password page, show loading
  if (needsPasswordChange && location.pathname !== '/change-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Redirecting to password change...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PasswordChangeGuard;
