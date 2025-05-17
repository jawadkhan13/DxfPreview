import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import Confetti from 'react-confetti';

export const PaymentSuccessAnimation = ({ orderNumber = "12345" }) => {
  console.log("PaymentSuccessAnimation rendering for order:", orderNumber);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  const [confettiActive, setConfettiActive] = useState(true);
  
  useEffect(() => {
    // Update window dimensions when component mounts
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setConfettiActive(false);
    }, 5000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      {confettiActive && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 w-full max-w-md shadow-lg">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.6
          }}
          className="flex justify-center mb-4"
        >
          <CheckCircle className="w-24 h-24 text-green-500 stroke-[1.5]" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h3 className="text-3xl font-bold text-green-700 mb-3">
            Payment Successful!
          </h3>
          
          <div className="bg-white rounded-md p-3 mb-4 border border-green-200">
            <p className="text-lg font-medium text-green-800">
              Order #{orderNumber} Confirmed
            </p>
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to your inbox
            </p>
          </div>
          
          <p className="text-center text-gray-700 mb-2">
            Thank you for your purchase!
          </p>
          
          <p className="text-sm text-gray-500">
            Your order will be processed shortly
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export const PaymentFailedAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          x: [0, -10, 10, -10, 10, 0] // Shake effect
        }}
        transition={{
          scale: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.6
          },
          x: {
            duration: 0.5,
            delay: 0.3,
            ease: "easeInOut"
          }
        }}
        className="mb-4"
      >
        <XCircle className="w-24 h-24 text-red-500 stroke-[1.5]" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-red-700 mb-2"
      >
        Payment Failed
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-600"
      >
        There was an issue processing your payment.
        <br />
        Please try again or use a different payment method.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md w-full max-w-xs"
      >
        <p className="text-sm text-red-600 text-center">
          Check your card details or try another payment method
        </p>
      </motion.div>
    </div>
  );
};