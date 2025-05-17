
import React, { useState, useEffect } from "react"; // Import useState and useEffect

// Helper to format finish keys for display
const formatFinishLabel = (key) => {
 // Remove the '_per_...' suffix and capitalize
 return key.split('_per_')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Hardcoded list of powder coat colors for now
const powderCoatColors = [
 'Gloss Black', 'Matte Black', 'Wrinkle Black', 'Gloss White', 'Gloss Red', 'Gloss Yellow', 'Gloss Green', 'Custom' // Add more as needed
];

const FinishSelector = ({ pricingConfig, selectedFinish, setSelectedFinish, selectedColor, setSelectedColor }) => { // Add color state props

 // State to manage the selected color internally if needed, or rely on parent state
 // const [internalSelectedColor, setInternalSelectedColor] = useState('');

 // Reset color if finish changes to something other than Powder Coat
 useEffect(() => {
   if (selectedFinish !== 'Powder Coat') {
     setSelectedColor(''); // Reset color in parent state
   }
 }, [selectedFinish, setSelectedColor]);


 // Get available finishes from pricing config
 const availableFinishes = Object.keys(pricingConfig?.finishes || {});

 return (
   <div className="bg-card p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-medium mb-4">Finish</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Powder Coating</label>
         <label className="block text-sm font-medium mb-2">Finish Type</label>
         <select
           value={selectedFinish || ''}
           onChange={(e) => {
             const value = e.target.value || null;
             setSelectedFinish(value);
             // Reset color if changing away from Powder Coat handled by useEffect
           }}
           className="w-full p-2 border rounded-md"
         >
           <option value="">No finish</option>
           {availableFinishes.map((finishKey) => {
             const label = formatFinishLabel(finishKey);
             const price = pricingConfig.finishes[finishKey];
             const unit = finishKey.includes('_per_') ? finishKey.split('_per_')[1] : 'item'; // Extract unit
             return (
               // Use label as the value for simplicity, assuming finish names are unique enough
               <option key={finishKey} value={label}>
                 {label} (+${price}/{unit}) {/* Show price and unit */}
               </option>
             );
           })}
         </select>
       </div>

       {/* Show color selector only if Powder Coat is selected */}
       {selectedFinish === 'Powder Coat' && (
         <div>
           <label className="block text-sm font-medium mb-2">Powder Coat Color</label>
           <select
             value={selectedColor || ''}
             onChange={(e) => setSelectedColor(e.target.value)}
             className="w-full p-2 border rounded-md"
           >
             <option value="">Select color</option>
             {powderCoatColors.map((color) => (
               <option key={color} value={color}>
                 {color}
               </option>
             ))}
           </select>
         </div>
       )}
     </div>
   </div>
  );
};

export default FinishSelector;
