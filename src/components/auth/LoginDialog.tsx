
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const LoginDialog = () => {
  return (
    <div className="flex gap-2">
      <Button asChild variant="ghost" className="text-white hover:text-white hover:bg-white/10">
        <Link to="/auth">Enter App</Link>
      </Button>
    </div>
  );
};

export default LoginDialog;
