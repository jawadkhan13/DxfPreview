import React from "react";
import { motion } from "framer-motion";

// Static list of materials based on provided info
const materialsList = [
  {
    name: "5052 H32 Aluminum",
    thicknesses: ['0.040"', '0.063"', '0.080"', '0.090"', '0.100"']
  },
  {
    name: "6061 T6 Aluminum",
    thicknesses: ['0.040"', '0.063"', '0.080"', '0.090"', '0.100"', '0.125"', '0.190"', '0.250"']
  },
  {
    name: "Mild Steel",
    thicknesses: ['0.030"', '0.048"', '0.059"', '0.074"', '0.104"', '0.119"', '0.135"', '0.187"', '0.250"', '0.313"', '0.375"', '0.500"']
  },
  {
    name: "Stainless Steel (304)",
    thicknesses: ['0.030"', '0.048"', '0.063"', '0.074"', '0.090"', '0.120"', '0.135"', '0.187"']
  },
  {
    name: "Stainless Steel (316)",
    thicknesses: ['0.030"', '0.048"', '0.063"', '0.074"', '0.090"', '0.120"', '0.135"', '0.187"']
  }
  // Add other materials manually here if needed in the future
];

const Materials = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-center mb-12">Available Materials</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {materialsList.map((material, index) => (
            <motion.div
              key={material.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card p-6 rounded-lg shadow-lg border flex flex-col" // Use flex column
            >
              <h2 className="text-xl font-semibold mb-4">{material.name}</h2>
              <div className="flex-grow"> {/* Allow description to take space */}
                <p className="text-sm text-muted-foreground">
                  Available thicknesses:
                </p>
                <p className="text-sm mt-1 break-words"> {/* Allow long thickness lists to wrap */}
                   {material.thicknesses.join(', ') || 'N/A'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Materials;
