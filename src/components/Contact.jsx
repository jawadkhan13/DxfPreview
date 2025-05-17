
import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-12">Contact Us</h1>

        <div className="bg-card p-8 rounded-lg shadow-lg border">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded-md"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                className="w-full p-2 border rounded-md h-32"
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <Button className="w-full">Send Message</Button>
          </form>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Other Ways to Reach Us</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Email: contact@fabquote.com
              </p>
              <p className="text-muted-foreground">
                Phone: (555) 123-4567
              </p>
              <p className="text-muted-foreground">
                Hours: Monday - Friday, 9am - 5pm EST
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
