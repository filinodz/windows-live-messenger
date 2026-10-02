import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ element: Component, ...rest }) => {
  const { session, loading, online } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Connexion à Messenger...</div>;
  const demoAuthenticated = localStorage.getItem('loggedin') === 'true';
  return session || (!online && demoAuthenticated) ? <Component {...rest} /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
