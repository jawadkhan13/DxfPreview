
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/components/Home";
import Services from "@/components/Services";
import Materials from "@/components/Materials";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import AdminDashboard from "@/components/admin/AdminDashboard";
import UserDashboard from "@/components/user/UserDashboard";
import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";
import ResetPassword from "@/components/auth/ResetPassword";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Checkout from "./components/Checkout";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
