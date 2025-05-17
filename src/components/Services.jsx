
import React from "react";
import { motion } from "framer-motion";

const services = [
  {
    title: "Laser Cutting",
    description: "Precision cutting for intricate designs and complex shapes",
    features: ["High accuracy", "Clean edges", "Fast turnaround"]
  },
  {
    title: "CNC Routing",
    description: "Versatile machining for various materials and applications",
    features: ["Multiple materials", "Complex patterns", "Custom designs"]
  },
  {
    title: "Waterjet Cutting",
    description: "Cold-cutting process ideal for heat-sensitive materials",
    features: ["No heat affected zone", "Thick materials", "Any material"]
  }
];

const Services = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-center mb-12">Our Services</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-card p-6 rounded-lg shadow-lg border"
            >
              <h2 className="text-2xl font-semibold mb-4">{service.title}</h2>
              <p className="text-muted-foreground mb-6">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Services;
