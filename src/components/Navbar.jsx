
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Speedy Sheets
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/services" className="hover:text-primary transition-colors">
              Services
            </Link>
            <Link to="/materials" className="hover:text-primary transition-colors">
              Materials
            </Link>
            <Link to="/gallery" className="hover:text-primary transition-colors">
              Gallery
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/signin">
                <Button>Sign In</Button>
              </Link>
            )}
            <Button variant="ghost" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
