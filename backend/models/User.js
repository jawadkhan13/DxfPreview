const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique
    lowercase: true, // Store emails in lowercase
    trim: true, // Remove leading/trailing whitespace
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Match frontend validation if possible
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Define possible roles
    default: 'user', // Default role for new users
    required: true,
  },
  // Add any other fields you might need, e.g., profile info
});

 module.exports = mongoose.model('User', UserSchema);