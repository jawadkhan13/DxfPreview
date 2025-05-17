
import React from "react";

// Helper to format keys for display
const formatMaterialLabel = (key) => key.replace(/_/g, ' ');
const formatThicknessLabel = (key) => key.replace(/_/g, '.') + '"';
const formatThicknessValue = (key) => key.replace(/_/g, '.'); // Store value without "

const MaterialSelector = ({
 pricingConfig, // Receive pricing config from parent
 selectedMaterial,
 setSelectedMaterial,
 selectedThickness,
 setSelectedThickness
}) => {

 // Get available materials from pricing config
 const availableMaterials = Object.keys(pricingConfig?.materials || {});

 // Get available thicknesses for the selected material
 const availableThicknesses = selectedMaterial
   ? Object.keys(pricingConfig?.materials?.[selectedMaterial.replace(/ /g, '_')] || {})
   : [];

 return (
   <div className="bg-card p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-medium mb-4">Material & Thickness</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Material</label>
          <select
            value={selectedMaterial || ''}
            onChange={(e) => {
              setSelectedMaterial(e.target.value);
              setSelectedThickness(null);
            }}
            className="w-full p-2 border rounded-md"
         >
           <option value="">Select material</option>
           {availableMaterials.map((materialKey) => {
             const label = formatMaterialLabel(materialKey);
             return (
               <option key={materialKey} value={label}> {/* Use formatted label as value */}
                 {label}
               </option>
             );
           })}
          </select>
        </div>

        {selectedMaterial && (
          <div>
            <label className="block text-sm font-medium mb-2">Thickness</label>
            <select
              value={selectedThickness || ''}
              onChange={(e) => setSelectedThickness(e.target.value)}
              className="w-full p-2 border rounded-md"
           >
             <option value="">Select thickness</option>
             {availableThicknesses
               .sort((a, b) => parseFloat(a.replace('_','.')) - parseFloat(b.replace('_','.'))) // Sort numerically
               .map((thicknessKey) => {
                 const label = formatThicknessLabel(thicknessKey);
                 const value = formatThicknessValue(thicknessKey) + '"'; // Value includes "
                 return (
                   <option key={thicknessKey} value={value}>
                     {label}
                   </option>
                 );
             })}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialSelector;
