import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import _ from 'lodash';
import * as THREE from "three";
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { DXFLoader } from 'three-dxf-loader'
import { OrbitControls, Bounds, Center } from "@react-three/drei";

import { getPricing } from "@/lib/api";

// Define a default pricing structure to prevent errors before data is loaded
const defaultPricing = {
  materials: {},
  finishes: {},
  services: {},
};

// This little component loads & renders the DXF as a THREE.Group
function DxfScene({ url, onDimensionsCalculated }) {
  const { entity } = useLoader(DXFLoader, url, loader => {
    loader.setEnableLayer(true);
    loader.setConsumeUnits(true);
    loader.setDefaultColor(0x888888);
  });

  useEffect(() => {
    if (!entity) return;
    const box = new THREE.Box3().setFromObject(entity);
    const size = box.getSize(new THREE.Vector3());
    const w = size.x, h = size.y;
    const area = w * h;
    let totalEdgeLength = 0;
    entity.traverse(obj => {
      if (obj.isLineSegments) {
        const pos = obj.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 6) {
          const dx = pos[i+3] - pos[i], dy = pos[i+4] - pos[i+1];
          totalEdgeLength += Math.hypot(dx, dy);
        }
      }
    });
    const holeCount = 0; // or implement circle detection here
    onDimensionsCalculated({ width: w, height: h, area, totalEdgeLength, holeCount });
  }, [entity, onDimensionsCalculated]);

  return entity ? <primitive object={entity} /> : null;
}



const DxfPreview = ({
 file,
 onDimensionsCalculated,
 onPriceCalculated, // New prop to pass calculated price
 selectedMaterial, // New prop for selected material
 selectedThickness, // New prop for selected thickness
 selectedFinish, // Changed from selectedFinishes (array) to selectedFinish (string/null)
 selectedServices, // New prop for selected services (array)
}) => {
 
  const [url, setUrl] = useState(null);
  const [error, setError]     = useState(null);
  const [pricingConfig, setPricingConfig] = useState(defaultPricing);
  const [dimensions, setDimensions] = useState(null); // Store calculated dimensions

  // Turn File → Object URL
 useEffect(() => {
  if (!file) {
    setUrl(null);
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  setUrl(objectUrl);
  return () => {
    URL.revokeObjectURL(objectUrl);
    setUrl(null);
  };
}, [file]);

  // Fetch pricing data on component mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        console.log("Fetching pricing data in DxfPreview...");
        const data = await getPricing();
        console.log("Pricing data fetched:", data);
        setPricingConfig(data);
      } catch (error) {
        console.error("Error fetching pricing data in DxfPreview:", error);
        // Handle error, maybe show a message to the user
      }
    };
    fetchPricing();
  }, []); // Empty dependency array means this runs only once on mount

 // 3) Re-run pricing whenever any input changes
 useEffect(() => {
  if (
    !pricingConfig ||
    !dimensions ||
    !selectedMaterial ||
    !selectedThickness
  ) {
    onPriceCalculated?.(0);
    return;
  }

  let total = 0;
  const { area, holeCount, totalEdgeLength } = dimensions;

  // Material
  const mKey = selectedMaterial.replace(/ /g,'_');
  const tKey = selectedThickness.replace(/\./g,'_').replace(/"/g,'');
  const matP = Number(pricingConfig.materials?.[mKey]?.[tKey] || 0);
  total += area * matP;

  // Finish
  if (selectedFinish) {
    const fKey = selectedFinish.replace(/ /g,'_').toLowerCase() + '_per_sq_inch';
    const finP = Number(pricingConfig.finishes?.[fKey] || 0);
    total += area * finP;
  }

  // Services
  (selectedServices || []).forEach(s => {
    let qty = 0, svcKey = '';
    if (s === 'Countersinking') {
      qty = holeCount;
      svcKey = 'countersinking_per_hole';
    } else if (s === 'Deburring') {
      qty = totalEdgeLength;
      svcKey = 'deburring_per_inch';
    }
    const svcP = Number(pricingConfig.services?.[svcKey] || 0);
    total += qty * svcP;
  });

  onPriceCalculated?.(Number(total.toFixed(2)));
}, [
  pricingConfig,
  dimensions,
  selectedMaterial,
  selectedThickness,
  selectedFinish,
  selectedServices,
  onPriceCalculated
]);


if (!file) {
  return (
    <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
      Please upload a DXF to preview.
    </div>
  );
}
  // Effect to calculate price when pricing config, dimensions, or selections change
  useEffect(() => {
    const calculatePrice = () => {
      if (!pricingConfig || !dimensions || !selectedMaterial || !selectedThickness || !onPriceCalculated) {
        console.log("Cannot calculate price: missing pricing config, dimensions, material, thickness, or price callback.");
        onPriceCalculated && onPriceCalculated(0); // Reset price if dependencies are missing
        return;
      }

console.log("--- Starting Price Calculation ---");
      console.log("Using pricingConfig:", JSON.stringify(pricingConfig, null, 2)); // Log the actual config structure
      console.log("Using dimensions:", JSON.stringify(dimensions, null, 2)); // Log the actual dimensions structure
      console.log("Selections:", { selectedMaterial, selectedThickness, selectedFinish, selectedServices });

      // The original console.log is removed as the above lines provide more detail.
      // console.log("Calculating price with:", { ... });
      console.log("Calculating price with:", {
        pricingConfig,
        dimensions,
       selectedMaterial,
       selectedThickness,
       selectedFinish, // Use selectedFinish here
       selectedServices,
     });
      let totalPrice = 0; // Declare totalPrice first

      // --- Material Pricing ---
      // 1. Define keys
      const materialKey = selectedMaterial.replace(/ /g, '_');
      const thicknessKey = selectedThickness.replace(/\./g, '_').replace(/"/g, '');

      // 2. Log the lookup path
      const materialPath = ['materials', materialKey, thicknessKey];
      console.log(`Looking up material price at path: ${JSON.stringify(materialPath)}`);

      // 3. Get the price
      // Get the price, ensuring it's a number
      const materialPricing = Number(_.get(pricingConfig, materialPath, 0));

      // 4. Log the found price
      console.log(`Material Price Found (${selectedMaterial} ${selectedThickness}"): ${materialPricing} per sq inch`);
      // console.log(`Material (${selectedMaterial} ${selectedThickness}") price per sq inch:`, materialPricing); // Original log, slightly different format

      // 5. Calculate and log cost if applicable
      if (dimensions.area > 0 && materialPricing > 0) {
        const materialCost = dimensions.area * materialPricing;
        totalPrice += materialCost; // Add to total
        console.log(`Material Cost Added: ${dimensions.area.toFixed(4)} sq in * ${materialPricing} = ${materialCost.toFixed(2)}`);
        // console.log("Material cost:", materialCost); // Original log
      } else {
        // Log if material cost calculation was skipped (e.g., area or price is 0)
        console.log(`Material Cost Skipped (Area: ${dimensions.area}, Price: ${materialPricing})`);
      }

      // --- Finish Pricing --- (Moved outside the material 'else' block)
      if (selectedFinish) { // Check if a finish is selected
        const potentialFinishKey = selectedFinish.replace(/ /g, '_').toLowerCase(); // Example dynamic key
        console.log(`Finish Selected: ${selectedFinish}. Potential dynamic key: ${potentialFinishKey}`);

        // --- DYNAMIC FINISH KEY ---
        // Construct the key dynamically based on the selected finish and assumed unit structure
        // Example: "Powder Coat" -> "powder_coat_per_sq_inch" (This assumes finishes are priced per sq inch)
        const dynamicFinishKey = selectedFinish.replace(/ /g, '_').toLowerCase() + '_per_sq_inch';
        const finishPath = ['finishes', dynamicFinishKey];
        console.log(`Looking up finish price using DYNAMIC path: ${JSON.stringify(finishPath)}`);

        // Get the price using the dynamic key
        // Get the price, ensuring it's a number
        const finishPricePerSqInch = Number(_.get(pricingConfig, finishPath, 0));
        console.log(`Finish Price Found (using dynamic key '${dynamicFinishKey}'): ${finishPricePerSqInch} per sq inch`);

        // Calculate and log cost if applicable
        if (dimensions.area > 0 && finishPricePerSqInch > 0) {
            const finishCost = dimensions.area * finishPricePerSqInch;
            totalPrice += finishCost; // Add to total
            console.log(`Finish Cost Added: ${dimensions.area.toFixed(4)} sq in * ${finishPricePerSqInch} = ${finishCost.toFixed(2)}`);
        } else {
           console.log(`Finish Cost Skipped (Area: ${dimensions.area}, Price: ${finishPricePerSqInch})`);
        }
        // TODO: Add logic for other finishes if they have different pricing structures
      } else {
        console.log("No finish selected.");
      }
      // TODO: Add logic for other finishes if they have different pricing structures

      // Log before starting service processing
      console.log("Processing Services:", selectedServices);

      // --- Service Pricing ---
      if (selectedServices && selectedServices.length > 0) {
        selectedServices.forEach(service => {
          // Determine unit and quantity source based *only* on the service name
          let unit = 'unknown';
          let quantitySource = 'unknown';
          let serviceQuantity = 0;

          if (service === 'Countersinking') {
            unit = 'hole';
            quantitySource = 'holeCount';
            serviceQuantity = dimensions.holeCount || 0; // Use holeCount, default to 0
          } else if (service === 'Deburring') {
            unit = 'inch';
            quantitySource = 'totalEdgeLength';
            serviceQuantity = dimensions.totalEdgeLength || 0; // Use totalEdgeLength, default to 0
          }
          // TODO: Add cases for other potential services

          // Construct the dynamic key using the determined unit
          const serviceKey = service.replace(/ /g, '_').toLowerCase() + '_per_' + unit;
          // Get the price, ensuring it's a number
          const servicePrice = Number(_.get(pricingConfig, ['services', serviceKey], 0));

          console.log(`Service (${service}): Price Key='${serviceKey}', Price=${servicePrice}, Unit='${unit}', QuantitySource='${quantitySource}', Quantity=${serviceQuantity}`);

          // Calculate and log cost based on price and quantity
          if (serviceQuantity > 0 && servicePrice > 0) {
            const serviceCost = serviceQuantity * servicePrice;
            totalPrice += serviceCost; // Add to total
            console.log(`Service Cost Added (${service}): ${serviceQuantity.toFixed(4)} ${unit}s * ${servicePrice} = ${serviceCost.toFixed(2)}`);
          } else {
             console.log(`Service Cost Skipped (${service}): Quantity = ${serviceQuantity}, Price = ${servicePrice}`);
          }
        });
      } else {
        console.log("No services selected.");
      }

console.log("--- Final Calculated Price ---:", totalPrice.toFixed(2));
      console.log("Total calculated price:", totalPrice);
      onPriceCalculated(totalPrice); // Pass the calculated total price to the parent
   };

   calculatePrice();
 }, [pricingConfig, dimensions, selectedMaterial, selectedThickness, selectedFinish, selectedServices, onPriceCalculated]); // Update dependency array

 
  // Remount canvas on file change to clear previous scene
  const canvasKey = file.name + '_' + (file.lastModified || 0);

 return (
  <div className="w-full aspect-square bg-white">
      <Canvas
        key={canvasKey}
        orthographic
        camera={{ position: [10, 10, 10], zoom: 50, near: 0.1, far: 1000 }}
      >
        {/* lights */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />

        <Bounds fit clip margin={1}>
          <Center>
            <DxfScene
              url={url}
              onDimensionsCalculated={dims => {
                // update local state…
                setDimensions(dims);
                // and propagate to parent
                onDimensionsCalculated?.(dims);
              }}
            />
          </Center>
        </Bounds>

        {/* orbit controls if you like */}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default DxfPreview;
