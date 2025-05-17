
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { supabase } from "@/lib/supabase"; // Remove Supabase
import { jwtDecode } from "jwt-decode"; // Import jwt-decode
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decodedToken = jwtDecode(token);
        // Optional: Check token expiration
        const currentTime = Date.now() / 1000; // Convert to seconds
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          console.log("Token expired");
          localStorage.removeItem('authToken'); // Remove expired token
          setUser(null);
        } else {
          // Token is valid, set user state
          // The payload structure depends on what you put in it in server.js
          setUser(decodedToken.user);
          console.log("User set from token:", decodedToken.user);
        }
      } else {
        setUser(null); // No token found
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem('authToken'); // Remove potentially invalid token
      setUser(null);
    } finally {
      setLoading(false);
    }
    // No dependency array needed if we only want this to run on initial mount
    // Add dependencies if you need it to re-run on specific state changes
  }, []);

  // Sign out function
  const signOut = useCallback(() => {
    console.log("Signing out...");
    localStorage.removeItem('authToken'); // Remove token from storage
    setUser(null); // Clear user state
    // Optionally redirect using useNavigate if needed outside component context
    // navigate('/signin'); // Example redirect
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  }, [toast]); // Include toast in dependencies

  // Function to update user state from a new token (e.g., after login)
  const updateUserFromToken = useCallback((token) => {
    if (!token) {
      console.log("updateUserFromToken called with no token, signing out.");
      signOut(); // Or simply setUser(null) if signOut has side effects you want to avoid here
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        console.log("Token expired during update");
        localStorage.removeItem('authToken');
        setUser(null);
      } else {
        setUser(decodedToken.user);
        console.log("User state updated from token:", decodedToken.user);
      }
    } catch (error) {
      console.error("Error decoding token during update:", error);
      localStorage.removeItem('authToken');
      setUser(null);
    }
  }, [signOut]); // Include signOut if it's used within

  // Note: signIn and signUp logic is now handled directly in their respective components
  // Note: resetPassword logic needs a backend implementation

  const value = {
    user, // The authenticated user object (or null)
    loading, // Loading state
    signOut, // Function to sign out
    updateUserFromToken, // Function to update user state after login/signup
  };

  // Listen for storage changes to sync across tabs (optional but good UX)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'authToken') {
        const token = event.newValue;
        if (token) {
          try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp && decodedToken.exp >= currentTime) {
              setUser(decodedToken.user);
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
