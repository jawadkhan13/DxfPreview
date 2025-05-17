import React, { useState, useRef, useEffect, useCallback } from "react"; // Keep useCallback
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Star, FileCheck, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import DxfPreview from "@/components/DxfPreview";
import MaterialSelector from "@/components/MaterialSelector";
import ServicesSelector from "@/components/ServicesSelector";
import FinishSelector from "@/components/FinishSelector";
import { getPricing, createPaymentIntent, createOrder } from "@/lib/api"; // Import API functions
import _ from 'lodash'; // Import lodash
import { loadStripe } from '@stripe/stripe-js';
import * as Dialog from '@radix-ui/react-dialog';
import { CardElement, Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PaymentSuccessAnimation, PaymentFailedAnimation } from "@/components/ui/PaymentAnimation";

// Define a default pricing structure to prevent errors before data is loaded
const defaultPricing = {
 materials: {},
 finishes: {},
 services: {},
};
const stripePromise = loadStripe("pk_test_51RLBcFCsd0sksBZf5obzw7WSL5BMJm5BoZjuyu5fGqQdubF6ZPnVGoHMqS8VLXPZsdUzT5u9V7457vw6EXcHQ17w004zVHjua6");

const Home = () => {
 const { toast } = useToast();

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedThickness, setSelectedThickness] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedFinish, setSelectedFinish] = useState(null);
  const [selectedColor, setSelectedColor] = useState(''); // Add state for selected color
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState(null); // State for price from DxfPreview
  const [pricingConfig, setPricingConfig] = useState(defaultPricing); // State for pricing config
  const [loadingPricing, setLoadingPricing] = useState(true); // Loading state for pricing
  const fileInputRef = useRef(null);
  const [openCheckoutModal, setOpenCheckoutModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false); // New state for payment completion

 // Fetch pricing data on component mount
 useEffect(() => {
   const fetchPricing = async () => {
     setLoadingPricing(true);
     try {
       console.log("Fetching pricing data in Home...");
       const data = await getPricing();
       console.log("Pricing data fetched in Home:", data);
       // Deep merge fetched data with defaults to ensure all fields are present
       const mergedData = _.merge({}, _.cloneDeep(defaultPricing), data);
       setPricingConfig(mergedData);
     } catch (error) {
       console.error("Error fetching pricing data in Home:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not load pricing configuration." });
     } finally {
       setLoadingPricing(false);
     }
    };
    fetchPricing();
  }, []);

  const createStripeClientSecret = async () => {
    const calculatedPriceInCents = Math.round(calculatedPrice * 100);
    try {
      // Use the API helper function
      const { clientSecret } = await createPaymentIntent(calculatedPriceInCents);
      console.log("Received client secret:", clientSecret);
      setClientSecret(clientSecret);
      return clientSecret;
    } catch (error) {
      console.error('Error creating Stripe client secret:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Could not initialize payment: " + error.message,
      });
      return null;
    }
  };
  

  const CheckoutForm = ({ orderDetails, setPaymentCompleted }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentStatus, setPaymentStatus] = useState('initial'); // 'initial', 'processing', 'success', 'failed'
    const [paymentError, setPaymentError] = useState(null);
    const [orderNumber, setOrderNumber] = useState(null);
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      if (!stripe || !elements) {
        console.error("Stripe.js hasn't loaded yet");
        return;
      }
  
      setPaymentStatus('processing');
      setPaymentError(null);
  
      try {
        console.log("Confirming payment with client secret:", clientSecret);
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });
  
        if (result.error) {
          console.error('Payment confirmation error:', result.error);
          setPaymentError(result.error.message);
          setPaymentStatus('failed');
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: result.error.message,
          });
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            console.log('Payment successful!', result.paymentIntent);
            
            // Generate order number from payment intent ID
            const generatedOrderNumber = result.paymentIntent.id.slice(-6);
            setOrderNumber(generatedOrderNumber);
            setPaymentStatus('success');
            
            // Show a prominent toast notification
            toast({
              title: "Payment Successful! 🎉",
              description: "Your order #" + generatedOrderNumber + " has been placed successfully!",
              duration: 6000, // Show for 6 seconds
              style: {
                backgroundColor: "#10B981", // Green background
                color: "white",
                border: "1px solid #059669",
                fontWeight: "bold",
              }
            });
            
            // Create an order record in the database
            try {
              const orderDetailsToSave = {
                material: orderDetails.material,
                thickness: orderDetails.thickness,
                finish: orderDetails.finish,
                services: orderDetails.services, // Assuming services are passed in orderDetails
                quantity: orderDetails.quantity,
                totalPrice: parseFloat(orderDetails.totalPrice), // Ensure total price is a number
                paymentIntentId: result.paymentIntent.id,
                orderNumber: generatedOrderNumber,
                // Add other relevant fields from orderDetails or state as needed
              };
              const createdOrder = await createOrder(orderDetailsToSave);
              console.log("Order saved to database:", createdOrder);
            } catch (orderError) {
              console.error("Error saving order to database:", orderError);
              // Optionally show an error message to the user, but payment was successful
              toast({
                variant: "warning",
                title: "Order Not Saved",
                description: "Payment was successful, but there was an issue saving the order details.",
              });
            }
            
            // Keep the success screen visible longer
            setTimeout(() => {
              setOpenCheckoutModal(false);
              setPaymentCompleted(true); // Set payment completed state in Home component
              
              // Show another confirmation after modal closes
              setTimeout(() => {
                toast({
                  title: "Order Confirmed",
                  description: "Check your email for order details and tracking information.",
                  duration: 5000,
                });
              }, 500);
            }, 5000);
          } else {
             // Handle other potential statuses if needed (e.g., 'requires_action')
             console.log('Payment intent status:', result.paymentIntent.status);
             setPaymentError(`Payment requires additional action: ${result.paymentIntent.status}`);
             setPaymentStatus('failed'); // Or a new status like 'requires_action'
             toast({
                variant: "destructive",
                title: "Payment requires action",
                description: `Payment status: ${result.paymentIntent.status}`,
             });
          }
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setPaymentError(error.message || 'Payment failed.');
        setPaymentStatus('failed');
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: error.message || 'An unexpected error occurred.',
        });
      }
    };
  
    console.log("CheckoutForm rendering - paymentStatus:", paymentStatus, "orderNumber:", orderNumber);
    
    return (
      <div className='space-y-4'>
        {paymentStatus === 'success' ? (
          <PaymentSuccessAnimation orderNumber={orderNumber} />
        ) : paymentStatus === 'failed' ? (
          <div className="space-y-4">
            <PaymentFailedAnimation />
            <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-100 rounded">
              <p className="font-medium">Error details:</p>
              <p>{paymentError}</p>
            </div>
            <Button 
              onClick={() => setPaymentStatus('initial')} // Reset to initial to try again
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Try Again
            </Button>
          </div>
        ) : ( // paymentStatus is 'initial' or 'processing'
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className="border rounded-md p-3">
              <CardElement
                options={{
                  hidePostalCode: true,
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            <Button 
              type='submit' 
              disabled={!stripe || paymentStatus === 'processing'} 
              className="w-full"
            >
              {paymentStatus === 'processing' ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                `Pay $${calculatedPrice}`
              )}
            </Button>
          </form>
        )}
      </div>
    );
  };

  const handleFileUpload = async (event) => {
   const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      if (uploadedFile.name.toLowerCase().endsWith('.dxf')) {
        setIsLoading(true);
        setPreviewError(null);
        
        try {
          setFile(uploadedFile);
          setPaymentCompleted(false); // Reset payment completed state on new file upload
          
          toast({
            title: "File processed successfully",
            description: `${uploadedFile.name} is ready for quoting`,
          });
        } catch (error) {
          console.error('Error processing file:', error);
          setPreviewError(error.message);
          toast({
            variant: "destructive",
            title: "Error processing file",
            description: "The DXF file could not be processed. Please try another file.",
          });
          setFile(null);
        }
        
        setIsLoading(false);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file format",
          description: "Please upload a DXF file",
        });
      }
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

 const handleDimensionsCalculated = useCallback((dims) => {
   setDimensions(dims);
 }, []); // Empty dependency array as it only uses setDimensions

 // Callback for DxfPreview to update the calculated price
 // Callback for DxfPreview to update the calculated price
 const handlePriceCalculated = useCallback((price) => {
   console.log("Home: handlePriceCalculated called with price:", price); // <-- Add this log
   setCalculatedPrice(price);
 }, [setCalculatedPrice]);

 // Calculate final price including quantity
 const finalPrice = calculatedPrice !== null ? (calculatedPrice * quantity).toFixed(2) : null; // Restore .toFixed

 // TODO: Pass pricingConfig down to selectors to dynamically generate options

 console.log(clientSecret)
 return (
   <div className="container mx-auto px-4 py-16">
    {clientSecret &&
     <Dialog.Root open={openCheckoutModal} onOpenChange={setOpenCheckoutModal}>
        <Dialog.Portal>
          <Dialog.Overlay className='fixed inset-0 bg-black/50' />
          <Dialog.Content className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg max-w-lg w-full'>
            <Dialog.Close className='absolute top-4 right-4'>
              <X className='w-5 h-5 cursor-pointer hover:text-gray-700' />
            </Dialog.Close>
            <Dialog.Title className="text-2xl font-bold mb-6">Complete Your Purchase</Dialog.Title>
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">Custom Metal Part</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Material:</span>
                <span className="font-medium">{selectedMaterial} ({selectedThickness})</span>
              </div>
              {selectedFinish && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Finish:</span>
                  <span className="font-medium">{selectedFinish}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total:</span>
                <span>${finalPrice}</span>
              </div>
            </div>
            <Elements stripe={stripePromise} options={{clientSecret:clientSecret}}>
              <CheckoutForm
                orderDetails={{
                  material: selectedMaterial,
                  thickness: selectedThickness,
                  finish: selectedFinish,
                  quantity: quantity,
                  totalPrice: finalPrice
                }}
                setPaymentCompleted={setPaymentCompleted} // Pass the setter function
              />
            </Elements>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    }
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold mb-6">
          Custom sheet metal parts with quick turnaround times.
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Upload your DXF file for instant pricing. Get high-quality custom fabrication.
        </p>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* File Upload Section */}
            <div className="bg-card p-8 rounded-lg shadow-lg border">
              <div className="text-center mb-6">
                {isLoading ? (
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                ) : file ? (
                  <FileCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
                ) : (
                  <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                )}
                <h2 className="text-2xl font-semibold mb-2">Upload your file</h2>
                <p className="text-muted-foreground">
                  Supported format: DXF
                </p>
              </div>

              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dxf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                  onClick={handleButtonClick}
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Select DXF File"
                  )}
                </Button>
                {file && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Selected: {file.name}</p>
                    <p className="mt-1">Size: {(file.size / 1024).toFixed(2)} KB</p>
                    {dimensions && (
                      <p className="mt-1">
                        Dimensions: {dimensions.width}" × {dimensions.height}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {file && !previewError && (
               <div className="mt-6">
                 <h3 className="text-lg font-medium mb-3">Preview</h3>
                 <div className="border rounded-lg overflow-hidden">
                   <DxfPreview
                     file={file}
                     onDimensionsCalculated={handleDimensionsCalculated}
                     onPriceCalculated={handlePriceCalculated} // Pass callback
                     selectedMaterial={selectedMaterial} // Pass selections down
                     selectedThickness={selectedThickness}
                     selectedFinish={selectedFinish} // Pass selectedFinish directly
                     selectedServices={selectedServices}
                   />
                 </div>
               </div>
             )}
              
              {previewError && (
                <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg">
                  <p className="text-sm">{previewError}</p>
                </div>
              )}

               {/* Payment Successful Badge */}
               {paymentCompleted && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5 }}
                   className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center font-semibold"
                 >
                   Payment Successful! Your order is being processed.
                 </motion.div>
               )}
             </div>

            {/* Quote Configuration Section */}
           <div className="space-y-8">
             {loadingPricing ? (
               <div className="flex justify-center items-center h-24">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 <span className="ml-2">Loading Options...</span>
               </div>
             ) : (
               <>
                 <MaterialSelector
                   pricingConfig={pricingConfig} // Pass pricing config
                   selectedMaterial={selectedMaterial}
                   setSelectedMaterial={setSelectedMaterial}
                   selectedThickness={selectedThickness}
                   setSelectedThickness={setSelectedThickness}
                 />

                 <ServicesSelector
                   pricingConfig={pricingConfig} // Pass pricing config
                   selectedServices={selectedServices}
                   setSelectedServices={setSelectedServices}
                 />

                <FinishSelector
                  pricingConfig={pricingConfig} // Pass pricing config
                  selectedFinish={selectedFinish}
                  setSelectedFinish={setSelectedFinish}
                  selectedColor={selectedColor} // Pass color state
                  setSelectedColor={setSelectedColor} // Pass color setter
                />
              </>
            )}

              <div className="bg-card p-6 rounded-lg shadow-lg border">
                <h3 className="text-lg font-medium mb-4">Quantity</h3>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border rounded-md"
                />
             </div>

             {/* Display calculated price */}
             {finalPrice !== null && (
               <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary">
                 <h3 className="text-2xl font-bold mb-2">Estimated Price</h3>
                 <p className="text-4xl font-bold text-primary">${finalPrice}</p> {/* Use finalPrice directly */}
                 <p className="text-sm text-muted-foreground mt-2">
                   Based on selected options and quantity ({quantity})
                 </p>
                 <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={async () => {
                    setProcessing(true);
                    try {
                      const secret = await createStripeClientSecret();
                      if (secret) {
                        setOpenCheckoutModal(true);
                      }
                    } catch (error) {
                      console.error("Error in Place Order button click:", error);
                      toast({
                        variant: "destructive",
                        title: "Payment Error",
                        description: "Could not initialize payment: " + error.message,
                      });
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  disabled={!file || processing}
                >
                  {processing ? 'Preparing checkout...' : 'Place Order'}
                </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-2 mt-12 mb-12">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-2 text-muted-foreground">
            Join 100,000+ satisfied customers
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">No minimum quantities</h3>
            <p className="text-muted-foreground">
              Order exactly what you need, from one piece to thousands
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Free US shipping</h3>
            <p className="text-muted-foreground">
              On orders over $39
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Made in the USA</h3>
            <p className="text-muted-foreground">
              Quality manufacturing you can trust
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
