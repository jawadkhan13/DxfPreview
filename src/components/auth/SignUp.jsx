
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext"; // No longer using AuthContext for signup
import { UserPlus, Loader2 } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // const { signUp } = useAuth(); // No longer using AuthContext for signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the backend API endpoint
      const response = await fetch('http://localhost:5001/api/auth/signup', { // Assuming backend runs on 5001
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Throw an error with the message from the backend if available
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Handle success
      toast({
        title: "Account created!",
        description: data.message || "Please sign in with your new account.",
      });
      navigate("/signin"); // Redirect to sign-in page

    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message || "Failed to create account. Please try again.", // Display backend error message
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
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Join us to start ordering custom parts
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-lg border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
                disabled={loading}
              />
            </div>

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
                minLength={6}
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
