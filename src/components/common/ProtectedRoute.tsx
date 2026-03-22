import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';

interface Props {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
