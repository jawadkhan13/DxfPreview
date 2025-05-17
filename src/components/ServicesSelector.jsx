
import React from "react";

// Helper to format service keys for display
const formatServiceLabel = (key) => {
 // Remove the '_per_...' suffix and capitalize
 return key.split('_per_')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const ServicesSelector = ({ pricingConfig, selectedServices, setSelectedServices }) => {

 // Get available services from pricing config
 const availableServices = Object.keys(pricingConfig?.services || {});

 const toggleService = (serviceLabel) => { // Use label for toggling
    if (selectedServices.includes(serviceLabel)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceLabel));
    } else {
      setSelectedServices([...selectedServices, serviceLabel]);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-medium mb-4">Additional Services</h3>
      
     <div className="space-y-3">
       {availableServices.map((serviceKey) => {
         const label = formatServiceLabel(serviceKey);
         const price = pricingConfig.services[serviceKey];
         const unit = serviceKey.includes('_per_') ? serviceKey.split('_per_')[1] : 'item'; // Extract unit
         return (
           <label key={serviceKey} className="flex items-center space-x-3">
             <input
               type="checkbox"
               checked={selectedServices.includes(label)}
               onChange={() => toggleService(label)}
               className="rounded border-gray-300"
             />
             <span>{label}</span>
             <span className="text-sm text-muted-foreground">(+${price}/{unit})</span> {/* Show price and unit */}
           </label>
         );
       })}
      </div>
    </div>
  );
};

export default ServicesSelector;
