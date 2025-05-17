const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Helper function to create thickness schema with default price 0
const createThicknessSchema = (defaults = {}) => {
  const schemaDefinition = {};
  Object.keys(defaults).forEach(thickness => {
    schemaDefinition[thickness.replace('.', '_')] = { type: Number, default: 0.10, required: true }; // Use _ instead of . for keys, set default price
  });
  return new Schema(schemaDefinition, { _id: false });
};

// Define default thicknesses for each material type
const aluminum5052Thicknesses = { '0.040': 0, '0.063': 0, '0.080': 0, '0.090': 0, '0.100': 0 };
const aluminum6061Thicknesses = { '0.040': 0, '0.063': 0, '0.080': 0, '0.090': 0, '0.100': 0, '0.125': 0, '0.190': 0, '0.250': 0 };
const mildSteelThicknesses = { '0.030': 0, '0.048': 0, '0.059': 0, '0.074': 0, '0.104': 0, '0.119': 0, '0.135': 0, '0.187': 0, '0.250': 0, '0.313': 0, '0.375': 0, '0.500': 0 };
const stainless304Thicknesses = { '0.030': 0, '0.048': 0, '0.063': 0, '0.074': 0, '0.090': 0, '0.120': 0, '0.135': 0, '0.187': 0 };
const stainless316Thicknesses = { '0.030': 0, '0.048': 0, '0.063': 0, '0.074': 0, '0.090': 0, '0.120': 0, '0.135': 0, '0.187': 0 };

const PricingSchema = new Schema({
  configIdentifier: {
    type: String,
    default: 'global_pricing',
    unique: true,
    required: true,
  },
  materials: {
    '5052_H32_Aluminum': { // Use underscores for keys
      type: createThicknessSchema(aluminum5052Thicknesses),
      default: () => ({})
    },
    '6061_T6_Aluminum': {
      type: createThicknessSchema(aluminum6061Thicknesses),
      default: () => ({})
    },
    'Mild_Steel': {
      type: createThicknessSchema(mildSteelThicknesses),
      default: () => ({})
    },
    'Stainless_Steel_304': {
      type: createThicknessSchema(stainless304Thicknesses),
      default: () => ({})
    },
    'Stainless_Steel_316': {
      type: createThicknessSchema(stainless316Thicknesses),
      default: () => ({})
    },
  },
  finishes: {
    powder_coat_per_sq_inch: { type: Number, default: 0.05, required: true }, // Price per sq inch
    // Add other finishes here if needed, e.g., anodizing_per_sq_inch: { type: Number, default: 0.08, required: true }
  },
  services: {
    countersinking_per_hole: { type: Number, default: 0.50, required: true }, // Price per instance
    deburring_per_inch: { type: Number, default: 0.10, required: true }, // Price per inch of edge
    // Add other services here, e.g., tapping_per_hole: { type: Number, default: 0.75, required: true }
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PricingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Ensure default thicknesses are populated if missing
  const materials = this.materials;
  if (materials) {
      if (!materials['5052_H32_Aluminum'] || Object.keys(materials['5052_H32_Aluminum']).length === 0) materials['5052_H32_Aluminum'] = createThicknessSchema(aluminum5052Thicknesses).default() || {};
      if (!materials['6061_T6_Aluminum'] || Object.keys(materials['6061_T6_Aluminum']).length === 0) materials['6061_T6_Aluminum'] = createThicknessSchema(aluminum6061Thicknesses).default() || {};
      if (!materials['Mild_Steel'] || Object.keys(materials['Mild_Steel']).length === 0) materials['Mild_Steel'] = createThicknessSchema(mildSteelThicknesses).default() || {};
      if (!materials['Stainless_Steel_304'] || Object.keys(materials['Stainless_Steel_304']).length === 0) materials['Stainless_Steel_304'] = createThicknessSchema(stainless304Thicknesses).default() || {};
      if (!materials['Stainless_Steel_316'] || Object.keys(materials['Stainless_Steel_316']).length === 0) materials['Stainless_Steel_316'] = createThicknessSchema(stainless316Thicknesses).default() || {};
  }
  next();
});

PricingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Pricing', PricingSchema);