
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { LogIn, Loader2 } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUserFromToken } = useAuth(); // Get the update function from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting to sign in with:', email);
      // Call the backend login API endpoint
      const response = await fetch('http://localhost:5001/api/auth/login', { // Assuming backend runs on 5001
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Throw an error with the message from the backend if available
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Handle success - Store the token
      if (data.token) {
        localStorage.setItem('authToken', data.token); // Store token in local storage
        console.log('Sign in successful, token stored.');

        // Update AuthContext state with the new token
        updateUserFromToken(data.token);

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/dashboard"); // Redirect to dashboard
      } else {
         throw new Error("Login successful, but no token received.");
      }

    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message || "Failed to sign in. Please check your credentials.", // Display backend error message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to access your account
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-lg border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
