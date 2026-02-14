import React from 'react';
import { useRole } from '../hooks/useRole';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  const { role, loading } = useRole();

  if (loading) return null;
  if (role !== 'admin') return <>{fallback}</>;

  return <>{children}</>;
};
