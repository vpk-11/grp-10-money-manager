import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const AuthContext = createContext();

// Hook to use context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // null = not logged in
  const [loading, setLoading] = useState(true); // simulate async check

  useEffect(() => {
    // Simulate checking localStorage / token
    const storedUser = JSON.parse(localStorage.getItem("user")) || null;
    setUser(storedUser);
    setLoading(false);
  }, []);

  // Fake login function
  const login = (email, password) => {
    return new Promise((resolve) => {
      const fakeUser = { email };
      localStorage.setItem("user", JSON.stringify(fakeUser));
      setUser(fakeUser);
      resolve(fakeUser);
    });
  };

  // Fake register function
  const register = (email, password) => {
    return login(email, password); // for demo purposes
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
