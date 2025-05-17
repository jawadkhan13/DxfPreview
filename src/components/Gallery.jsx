
import React from "react";
import { motion } from "framer-motion";

const Gallery = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-center mb-12">Project Gallery</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg overflow-hidden shadow-lg"
          >
            <img  alt="Metal fabrication project 1" className="w-full h-64 object-cover" src="https://images.unsplash.com/photo-1560834362-837e4f29dea8" />
            <div className="p-4 bg-card">
              <h3 className="font-semibold mb-2">Custom Metal Brackets</h3>
              <p className="text-sm text-muted-foreground">Precision laser-cut aluminum brackets for industrial application</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-lg overflow-hidden shadow-lg"
          >
            <img  alt="Metal fabrication project 2" className="w-full h-64 object-cover" src="https://images.unsplash.com/photo-1680170684216-4adbff444835" />
            <div className="p-4 bg-card">
              <h3 className="font-semibold mb-2">Decorative Panels</h3>
              <p className="text-sm text-muted-foreground">Custom designed stainless steel panels with intricate patterns</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-lg overflow-hidden shadow-lg"
          >
            <img  alt="Metal fabrication project 3" className="w-full h-64 object-cover" src="https://images.unsplash.com/photo-1676576196269-6e59a3823670" />
            <div className="p-4 bg-card">
              <h3 className="font-semibold mb-2">Architectural Elements</h3>
              <p className="text-sm text-muted-foreground">Custom fabricated architectural components for modern design</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Gallery;
