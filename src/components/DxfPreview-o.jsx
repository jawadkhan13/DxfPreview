import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  // parseDxfEntities, // Removed: Preview now uses Maker.js model
  createPreviewScene,
  parseDxfToMakerJs, // For accurate calculations and preview
  calculateDimensionsFromMakerJsModel, // For accurate calculations
} from "@/lib/dxf-preview";
import DxfParser from "dxf-parser";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { getPricing } from "@/lib/api";
import _ from 'lodash';

// Define a default pricing structure to prevent errors before data is loaded
const defaultPricing = {
  materials: {},
  finishes: {},
  services: {},
};

const DxfPreview = ({
 file,
 onDimensionsCalculated,
 onPriceCalculated, // New prop to pass calculated price
 selectedMaterial, // New prop for selected material
 selectedThickness, // New prop for selected thickness
 selectedFinish, // Changed from selectedFinishes (array) to selectedFinish (string/null)
 selectedServices, // New prop for selected services (array)
}) => {
 const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [pricingConfig, setPricingConfig] = useState(defaultPricing);
  const [dimensions, setDimensions] = useState(null); // Store calculated dimensions

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

  // Effect to initialize DXF preview and calculate dimensions
  useEffect(() => {
    let cleanup = () => {};

    const initPreview = async () => {
      if (!file || !canvasRef.current || !containerRef.current) return;

      try {
        console.log('Starting DXF preview initialization');
        
        // Parse DXF file
        const parser = new DxfParser();
        const text = await file.text();
        console.log('DXF file content:', text.substring(0, 200) + '...');
        
        const dxf = parser.parseSync(text);
        console.log('Parsed DXF:', dxf);
        
        // --- Accurate Dimension Calculation using Maker.js ---
        console.log('Parsing DXF for Maker.js model...');
        const makerJsModel = parseDxfToMakerJs(dxf);
        console.log('Maker.js model:', makerJsModel);

        if (!makerJsModel || !makerJsModel.paths || Object.keys(makerJsModel.paths).length === 0) {
          throw new Error('Failed to create a valid Maker.js model from the DXF file.');
        }

        console.log('Calculating dimensions from Maker.js model...');
        // No longer passing units, calculation logic handles it heuristically
        const accurateDimensions = calculateDimensionsFromMakerJsModel(makerJsModel);
        console.log('Accurate dimensions calculated (inches):', accurateDimensions);

        // Store accurate dimensions in state for pricing
        setDimensions(accurateDimensions);

        // --- Visual Preview Setup using Maker.js model ---
        // Note: createPreviewScene now directly uses the makerJsModel
        // No need to parse separately for preview anymore.

        // Pass bounding box dimensions (width/height) to parent for display
        if (onDimensionsCalculated) {
          onDimensionsCalculated({
            width: accurateDimensions.width.toFixed(3), // Use width from Maker.js extents
            height: accurateDimensions.height.toFixed(3), // Use height from Maker.js extents
          });
        }

        // Create preview using the Maker.js model
        console.log('Creating THREE.js preview scene from Maker.js model...');
        const { scene, camera, renderer } = createPreviewScene(makerJsModel, containerRef.current);
        console.log('THREE.js scene created:', scene, camera, renderer);
        console.log('Preview scene created');
        
        // Store refs
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        
        // Clear existing content
        while (canvasRef.current.firstChild) {
          canvasRef.current.removeChild(canvasRef.current.firstChild);
        }
        
        // Append new renderer
        canvasRef.current.appendChild(renderer.domElement);
        console.log('Renderer appended to canvas');

        // Initial render
        renderer.render(scene, camera);

        // Animation loop
        const animate = () => {
          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !renderer || !camera || !scene) return;
          const width = containerRef.current.clientWidth;
          const height = width; // Keep aspect ratio 1:1
          renderer.setSize(width, height);
          renderer.render(scene, camera);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize
        
        cleanup = () => {
          console.log('Cleaning up preview');
          window.removeEventListener('resize', handleResize);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          if (renderer) {
            renderer.dispose();
          }
          if (scene) {
            scene.traverse((object) => {
              if (object.geometry) {
                object.geometry.dispose();
              }
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach(material => material.dispose());
                } else {
                  object.material.dispose();
                }
              }
            });
          }
        };
      } catch (error) {
        console.error('Error creating preview:', error);
        throw error;
      }
    };

    initPreview().catch(error => {
      console.error('Preview initialization failed:', error);
    });

    return () => cleanup();
  }, [file, onDimensionsCalculated]); // Re-run if file or onDimensionsCalculated changes

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

 return (
    <div ref={containerRef} className="w-full">
      <div ref={canvasRef} className="w-full aspect-square bg-white relative">
        {!file && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DxfPreview;
