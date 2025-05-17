
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { KeyRound } from "lucide-react";

const ResetPassword = () => {
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reset email. Please try again.",
      });
    }

    setLoading(false);
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
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email to reset your password
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
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? (
                "Sending reset email..."
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
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

export default ResetPassword;
