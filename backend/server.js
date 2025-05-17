const path = require('path'); // Import path module
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Load environment variables explicitly
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For generating JWTs
const User = require('./models/User'); // Import User model
const Order = require('./models/Order'); // Import Order model
const Pricing = require('./models/Pricing'); // Import Pricing model
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET);
const app = express();
const port = process.env.PORT || 5001; // Use port from .env or default to 5001
app.use((req, res, next) => {
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('Error: MONGODB_URI environment variable is not set.');
  process.exit(1); // Exit if connection string is missing
}

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit on connection failure
  });

// --- Middleware ---

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  // Get token from header (e.g., 'Bearer TOKEN')
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Get token part after 'Bearer '

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' }); // Unauthorized
  }

  // Verify token
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('FATAL ERROR: JWT_SECRET is not defined for middleware.');
      return res.status(500).json({ message: 'Server configuration error.' });
    }
    const decoded = jwt.verify(token, jwtSecret);

    // Add user from payload to request object
    req.user = decoded.user; // The payload structure { user: { id, email, name, role } }
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid.' }); // Unauthorized
  }
};

// Admin Authorization Middleware
const adminAuthMiddleware = (req, res, next) => {
 // Assumes authMiddleware has already run and attached req.user
 if (req.user && req.user.role === 'admin') {
   next(); // User is admin, proceed
 } else {
   console.log(`Admin access denied for user: ${req.user ? req.user.email : 'No user found'}`);
   res.status(403).json({ message: 'Access denied. Admin privileges required.' }); // Forbidden
 }
};


// --- API Routes ---

// Auth Routes (Public)
// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }
  if (password.length < 6) {
     return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' }); // 409 Conflict
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash password

   // Determine user role
   const isAdminEmail = email.toLowerCase() === 'apexengraving@gmail.com'; // Updated admin email
   const userRole = isAdminEmail ? 'admin' : 'user'; // Default is 'user' from schema

   console.log(`Signup attempt for ${email}, assigning role: ${userRole}`); // Log role assignment

   // Create new user with determined role
   const newUser = new User({
     name,
     email,
     password: hashedPassword,
     role: userRole, // Explicitly set the role
   });

   // Save user to database
    const savedUser = await newUser.save();

    // Respond (don't send back the password)
    res.status(201).json({ // 201 Created
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      createdAt: savedUser.createdAt,
      message: 'User created successfully!'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Unauthorized
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Unauthorized
    }

    // Check for JWT Secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('FATAL ERROR: JWT_SECRET is not defined.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    // User is valid, generate JWT
    const payload = {
      user: {
        id: user._id, // Use _id from MongoDB
        email: user.email,
        name: user.name,
        role: user.role // Add user role to payload
      }
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' }, // Token expires in 1 hour (adjust as needed)
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Send token back to client
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Order Routes (Protected)
// Get orders for the logged-in user
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    // req.user is attached by the authMiddleware
    const orders = await Order.find({ user: req.user.id })
                              .sort({ createdAt: -1 }); // Sort by newest first
    // Note: We might want to populate related data later (items, services, etc.)
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
});

// POST endpoint to create a new order
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    // req.user is attached by the authMiddleware
    const userId = req.user.id;
    const orderData = req.body; // Assuming order details are in the request body

    // Create a new order document
    const newOrder = new Order({
      ...orderData, // Spread the order details from the request body
      user: userId, // Associate the order with the logged-in user
      status: 'Pending', // Set initial status (adjust as needed)
      orderNumber: orderData.orderNumber // Assuming orderNumber is passed from frontend
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    console.log('Order created successfully:', savedOrder);
    res.status(201).json(savedOrder); // Respond with the created order

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order.' });
  }
});

// TODO: Add routes for getting specific orders, etc.


// --- Pricing Routes ---

// GET current pricing configuration (Publicly Accessible)
app.get('/api/pricing', async (req, res) => { // REMOVED authMiddleware, adminAuthMiddleware
 try {
   // Find the single pricing document, or create it if it doesn't exist
   let pricing = await Pricing.findOne({ configIdentifier: 'global_pricing' });

   if (!pricing) {
     console.log('Pricing document not found, creating one with defaults.');
     pricing = new Pricing(); // Creates with default values from schema
     await pricing.save();
   }

   res.json(pricing);
 } catch (error) {
   console.error('Error fetching pricing:', error);
   res.status(500).json({ message: 'Server error fetching pricing configuration.' });
 }
});

// PUT (Update) pricing configuration (Admin Only)
app.put('/api/pricing', authMiddleware, adminAuthMiddleware, async (req, res) => { // KEPT authMiddleware, adminAuthMiddleware
 try {
   // Find the existing pricing document and update it
   // { new: true } returns the updated document
   // { upsert: true } creates the document if it doesn't exist (though GET should handle creation)
   // runValidators ensures schema validations are run on update
   const updatedPricing = await Pricing.findOneAndUpdate(
     { configIdentifier: 'global_pricing' },
     req.body, // Assumes the request body contains the fields to update
     { new: true, upsert: true, runValidators: true }
   );

   if (!updatedPricing) {
       // This should theoretically not happen with upsert: true, but good practice
       return res.status(404).json({ message: 'Pricing configuration not found.' });
   }

   console.log('Pricing updated successfully by admin:', req.user.email);
   res.json(updatedPricing);

 } catch (error) {
   console.error('Error updating pricing:', error);
   // Handle potential validation errors
   if (error.name === 'ValidationError') {
       return res.status(400).json({ message: 'Validation Error', errors: error.errors });
   }
   res.status(500).json({ message: 'Server error updating pricing configuration.' });
 }
});


// Basic Test Route (keep or remove as needed)
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});


// Health Check Route
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let statusMessage = 'Database connection status unknown.';
  let statusCode = 500; // Internal Server Error by default

  switch (dbState) {
    case 0: // disconnected
      statusMessage = 'Database disconnected.';
      statusCode = 503; // Service Unavailable
      break;
    case 1: // connected
      statusMessage = 'Database connected successfully.';
      statusCode = 200; // OK
      break;
    case 2: // connecting
      statusMessage = 'Database connecting.';
      statusCode = 202; // Accepted (still processing)
      break;
    case 3: // disconnecting
      statusMessage = 'Database disconnecting.';
      statusCode = 503; // Service Unavailable
      break;
  }

  console.log(`Health check: ${statusMessage} (State: ${dbState})`);
  res.status(statusCode).json({ status: statusMessage, dbState: dbState });
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});