
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Package, Settings, LogOut, Loader2 } from "lucide-react";
import { getUserOrders } from "@/lib/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const ordersData = await getUserOrders(user.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground">Manage your orders and account</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg shadow-lg border">
            <FileText className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-lg border">
            <Package className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Active Orders</h2>
            <p className="text-2xl font-bold">
              {orders.filter(order => order.status === "Processing").length}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-lg border">
            <Settings className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Account Settings</h2>
            <Button variant="outline" className="mt-2">Manage</Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-lg border">
          <h2 className="text-2xl font-semibold mb-6">Recent Orders</h2>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total_price.toFixed(2)}</p>
                      <span className={`text-sm ${
                        order.status === "Completed" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.order_items?.map((item, index) => (
                      <span key={item.id}>
                        {index > 0 && ", "}
                        {item.quantity}x {item.material?.name} ({item.material_thickness?.thickness})
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No orders found. Start by creating your first order!</p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                Create Order
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;
