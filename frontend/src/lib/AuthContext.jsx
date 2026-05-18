import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isAppLaunched, setIsAppLaunched] = useState(false);

  useEffect(() => {
    // In a real app, this would check localStorage for a JWT token
    const token = localStorage.getItem('velora_token');
    const storedUser = localStorage.getItem('velora_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('velora_token', token);
    localStorage.setItem('velora_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setIsAppLaunched(true);
  };

  const logout = () => {
    localStorage.removeItem('velora_token');
    localStorage.removeItem('velora_user');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      login,
      logout,
      isAppLaunched,
      setIsAppLaunched
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
