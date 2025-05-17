const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: { // Reference to the user who placed the order
    type: Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Cancelled'], // Example statuses
    default: 'Pending',
    required: true,
  },
  // Placeholders for related items - these would likely be separate schemas/models
  // and referenced here, similar to the 'user' field.
  // For now, keeping it simple.
  order_items: [
    {
      // Define structure for order items later
      // e.g., materialId, thicknessId, quantity, calculatedPrice, etc.
      name: String, // Temporary placeholder
      quantity: Number, // Temporary placeholder
    }
  ],
  order_services: [
    {
      // Define structure for services later
      serviceId: Schema.Types.ObjectId, // Example reference
      name: String, // Temporary placeholder
    }
  ],
  order_finishes: [
    {
      // Define structure for finishes later
      finishId: Schema.Types.ObjectId, // Example reference
      name: String, // Temporary placeholder
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Indexing for faster lookups by user
OrderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);