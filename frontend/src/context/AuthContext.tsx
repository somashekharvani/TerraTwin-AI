import React, { createContext, useState, useEffect, useContext } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyGoal: number;
  walletAddress: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, monthlyGoal: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramToken = urlParams.get("token");
    const paramUser = urlParams.get("user");

    if (paramToken && paramUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(paramUser));
        localStorage.setItem("terratwin_token", paramToken);
        localStorage.setItem("terratwin_user", JSON.stringify(parsedUser));
        setToken(paramToken);
        setUser(parsedUser);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Failed to parse user from query param", err);
      }
    }

    // Check for stored token and user
    const storedToken = localStorage.getItem("terratwin_token");
    const storedUser = localStorage.getItem("terratwin_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("terratwin_token", data.token);
    localStorage.setItem("terratwin_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string, monthlyGoal: number) => {
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, monthlyGoal })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    localStorage.setItem("terratwin_token", data.token);
    localStorage.setItem("terratwin_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("terratwin_token");
    localStorage.removeItem("terratwin_user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
