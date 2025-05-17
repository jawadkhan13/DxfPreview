
// import { supabase } from '@/lib/supabase'; // Remove Supabase

const API_BASE_URL = 'http://localhost:5001/api'; // Your backend API base URL

// Helper function to get the auth token
const getAuthToken = () => localStorage.getItem('authToken');

// Helper function for making authenticated API requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};


// Materials - TODO: Needs backend implementation
export async function getMaterials() {
  // const { data, error } = await supabase
  //   .from('materials')
  //   .select(`
  //     *,
  //     material_thicknesses (*)
  //   `);
  
  // if (error) throw error;
  // return data;
  console.warn("getMaterials needs backend implementation");
  return []; // Placeholder
}

export async function updateMaterialThickness(id, price) {
  // const { data, error } = await supabase
  //   .from('material_thicknesses')
  //   .update({ price_per_square_inch: price })
  //   .eq('id', id);
  
  // if (error) throw error;
  // return data;
  console.warn("updateMaterialThickness needs backend implementation");
  return null; // Placeholder
}

// Services - TODO: Needs backend implementation
export async function getServices() {
  // const { data, error } = await supabase
  //   .from('services')
  //   .select('*');
  
  // if (error) throw error;
  // return data;
  console.warn("getServices needs backend implementation");
  return []; // Placeholder
}

export async function updateService(id, price) {
  // const { data, error } = await supabase
  //   .from('services')
  //   .update({ price })
  //   .eq('id', id);
  
  // if (error) throw error;
  // return data;
  console.warn("updateService needs backend implementation");
  return null; // Placeholder
}

// Finishes - TODO: Needs backend implementation
export async function getFinishes() {
  // const { data, error } = await supabase
  //   .from('finishes')
  //   .select('*');
  
  // if (error) throw error;
  // return data;
  console.warn("getFinishes needs backend implementation");
  return []; // Placeholder
}

export async function updateFinish(id, price) {
  // const { data, error } = await supabase
  //   .from('finishes')
  //   .update({ price })
  //   .eq('id', id);
  
  // if (error) throw error;
  // return data;
  console.warn("updateFinish needs backend implementation");
  return null; // Placeholder
}

// Orders
export async function getUserOrders(userId) { // userId might not be needed if backend uses token
  // const { data, error } = await supabase
  //   .from('orders')
  //   .select(`
  //     *,
  //     order_items (
  //       *,
  //       material:materials(*),
  //       material_thickness:material_thicknesses(*)
  //     ),
  //     order_services (
  //       *,
  //       service:services(*)
  //     ),
  //     order_finishes (
  //       *,
  //       finish:finishes(*)
  //     )
  //   `)
  //   .eq('user_id', userId)
  //   .order('created_at', { ascending: false });
  
  // if (error) throw error;
  // return data;

  // Call the new backend endpoint
  try {
    const orders = await fetchWithAuth('/orders'); // GET request to /api/orders
    // The backend currently returns basic order info.
    // We need to adjust the UserDashboard to handle this structure,
    // or enhance the backend endpoint to populate related data.
    // For now, let's adapt the format slightly to match expected structure.
    return orders.map(order => ({
      ...order,
      id: order._id, // Map MongoDB _id to id
      created_at: order.createdAt, // Map createdAt
      total_price: order.total_price || 0, // Ensure price exists
      // Add placeholders for items/services/finishes if needed by dashboard
      order_items: order.order_items || [],
      order_services: order.order_services || [],
      order_finishes: order.order_finishes || [],
    }));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error; // Re-throw the error to be handled by the caller (UserDashboard)
  }
}

/**
 * Creates a new order in the backend.
 * @param {object} orderData - The order details.
 * @returns {Promise<object>} The created order object.
 */
export async function createOrder(orderData) {
  console.log("Creating order with data:", orderData);
  try {
    return await fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...orderData,
        total_price: orderData.totalPrice, // Map frontend totalPrice to backend total_price
      }),
    });
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// Users - TODO: Needs backend implementation
export async function getUserProfile(userId) {
  // const { data, error } = await supabase
  //   .from('users')
  //   .select('*')
  //   .eq('id', userId)
  //   .single();
  
  // if (error) throw error;
  // return data;
  console.warn("getUserProfile needs backend implementation");
  return null; // Placeholder
}

export async function updateUserProfile(userId, updates) {
  // const { data, error } = await supabase
  //   .from('users')
  //   .update(updates)
  //   .eq('id', userId)
  //   .select()
  //   .single();
  
  // if (error) throw error;
  // return data;
  console.warn("updateUserProfile needs backend implementation");
  return null; // Placeholder
}

// --- Pricing Configuration (Admin) ---

/**
* Fetches the current pricing configuration.
* Requires admin privileges.
* @returns {Promise<object>} The pricing configuration object.
*/
export async function getPricing() {
 console.log("Fetching pricing configuration...");
 return await fetchWithAuth('/pricing'); // GET /api/pricing
}

/**
* Updates the pricing configuration.
* Requires admin privileges.
* @param {object} pricingData - The updated pricing data object.
* @returns {Promise<object>} The updated pricing configuration object.
*/
export async function updatePricing(pricingData) {
 console.log("Updating pricing configuration with:", pricingData);
 return await fetchWithAuth('/pricing', {
   method: 'PUT',
   body: JSON.stringify(pricingData),
 }); // PUT /api/pricing
}

/**
* Creates a Stripe payment intent for processing payments.
* @param {number} amount - The amount in cents to charge
* @returns {Promise<object>} The payment intent client secret
*/
export async function createPaymentIntent(amount) {
 console.log("Creating payment intent for amount:", amount);
 // Use fetchWithAuth to maintain consistency with other API calls
 try {
   return await fetchWithAuth('/create-payment-intent', {
     method: 'POST',
     body: JSON.stringify({ amount }),
   });
 } catch (error) {
   console.error("Error creating payment intent:", error);
   throw error;
 }
}
