import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { getPricing, updatePricing } from "@/lib/api";
import _ from 'lodash';

// Define a default structure matching the backend model EXACTLY
// Use underscores for keys where the model uses them
const defaultPricing = {
  materials: {
    '5052_H32_Aluminum': { '0_040': 0, '0_063': 0, '0_080': 0, '0_090': 0, '0_100': 0 },
    '6061_T6_Aluminum': { '0_040': 0, '0_063': 0, '0_080': 0, '0_090': 0, '0_100': 0, '0_125': 0, '0_190': 0, '0_250': 0 },
    'Mild_Steel': { '0_030': 0, '0_048': 0, '0_059': 0, '0_074': 0, '0_104': 0, '0_119': 0, '0_135': 0, '0_187': 0, '0_250': 0, '0_313': 0, '0_375': 0, '0_500': 0 },
    'Stainless_Steel_304': { '0_030': 0, '0_048': 0, '0_063': 0, '0_074': 0, '0_090': 0, '0_120': 0, '0_135': 0, '0_187': 0 },
    'Stainless_Steel_316': { '0_030': 0, '0_048': 0, '0_063': 0, '0_074': 0, '0_090': 0, '0_120': 0, '0_135': 0, '0_187': 0 },
  },
  finishes: {
    powder_coat_per_sq_inch: 0,
    // Add other default finishes if defined in model
  },
  services: {
    countersinking_per_hole: 0,
    deburring_per_inch: 0,
    // Add other default services if defined in model
  },
};

// Helper to format keys for display
const formatLabel = (key) => key.replace(/_/g, ' ').replace(' per ', '/').replace(' sq ', '² ');

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // Initialize with a deep clone of defaults to avoid reference issues
  const [pricingConfig, setPricingConfig] = useState(() => _.cloneDeep(defaultPricing));
  const [initialPricingConfig, setInitialPricingConfig] = useState(() => _.cloneDeep(defaultPricing));

  const loadPricingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPricing();
      // Deep merge fetched data with defaults to ensure all fields are present
      const mergedData = _.merge({}, _.cloneDeep(defaultPricing), data);
      setPricingConfig(mergedData);
      setInitialPricingConfig(_.cloneDeep(mergedData)); // Store initial state
    } catch (err) {
      console.error('Error loading pricing data:', err);
      setError(err.message || "Failed to load pricing configuration.");
      toast({ variant: "destructive", title: "Error Loading Data", description: err.message || "Failed to load pricing configuration." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPricingData();
  }, []); // Run only once on mount

  // Updated handler for nested state (materials/thicknesses) and flat state (finishes/services)
  const handleInputChange = (level1Key, level2Key, value, level3Key = null) => {
    setPricingConfig(prevConfig => {
      const newConfig = _.cloneDeep(prevConfig);
      const numValue = parseFloat(value) || 0; // Ensure value is a number, default to 0

      if (level3Key) { // Material Thickness (e.g., materials.Aluminum_5052.0_040)
        _.set(newConfig, [level1Key, level2Key, level3Key], numValue);
      } else { // Finish or Service (e.g., finishes.powder_coat_per_sq_inch)
        _.set(newConfig, [level1Key, level2Key], numValue);
      }
      return newConfig;
    });
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const dataToSave = _.omit(pricingConfig, ['_id', 'configIdentifier', '__v', 'updatedAt']);
      const updatedData = await updatePricing(dataToSave);
      const mergedData = _.merge({}, _.cloneDeep(defaultPricing), updatedData);
      setPricingConfig(mergedData);
      setInitialPricingConfig(_.cloneDeep(mergedData));
      toast({ title: "Success", description: "Pricing configuration updated successfully." });
    } catch (err) {
      console.error('Error saving pricing data:', err);
      setError(err.message || "Failed to save pricing configuration.");
      toast({ variant: "destructive", title: "Error Saving Data", description: err.message || "Failed to save pricing configuration." });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = !_.isEqual(pricingConfig, initialPricingConfig);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Pricing...</span>
      </div>
    );
  }

  if (error) {
    return (
       <div className="container mx-auto px-4 py-8 text-center">
         <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
         <h2 className="text-xl font-semibold text-destructive mb-2">Failed to Load Pricing</h2>
         <p className="text-muted-foreground mb-4">{error}</p>
         <Button onClick={loadPricingData}>Retry Loading</Button>
       </div>
     );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex justify-between items-center mb-8 sticky top-4 bg-background py-4 z-10">
          <h1 className="text-3xl font-bold">Admin Dashboard - Pricing</h1>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </div>

        {/* Materials Section */}
        <div className="bg-card p-6 rounded-lg shadow-lg border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Material Prices ($/in²)</h2>
          <div className="space-y-6">
            {Object.keys(pricingConfig.materials || {}).sort().map((materialKey) => (
              <div key={materialKey} className="border-b pb-4 last:border-b-0">
                <h3 className="text-xl font-medium mb-4">{formatLabel(materialKey)}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Object.keys(pricingConfig.materials[materialKey] || {}).sort((a, b) => parseFloat(a.replace('_','.')) - parseFloat(b.replace('_','.'))).map((thicknessKey) => (
                    <div key={thicknessKey} className="space-y-1">
                      <label className="text-sm font-medium">{thicknessKey.replace('_', '.')} "</label>
                      <input
                        type="number"
                        value={pricingConfig.materials[materialKey][thicknessKey]}
                        onChange={(e) => handleInputChange('materials', materialKey, e.target.value, thicknessKey)}
                        className="w-full p-2 border rounded-md text-sm"
                        step="0.01"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finishes Section */}
        <div className="bg-card p-6 rounded-lg shadow-lg border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Finish Prices ($)</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(pricingConfig.finishes || {}).sort().map((finishKey) => (
              <div key={finishKey} className="space-y-1">
                <label className="text-sm font-medium capitalize">{formatLabel(finishKey)}</label>
                <input
                  type="number"
                  value={pricingConfig.finishes[finishKey]}
                  onChange={(e) => handleInputChange('finishes', finishKey, e.target.value)}
                  className="w-full p-2 border rounded-md"
                  step="0.01"
                  min="0"
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-card p-6 rounded-lg shadow-lg border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Prices ($)</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(pricingConfig.services || {}).sort().map((serviceKey) => (
              <div key={serviceKey} className="space-y-1">
                <label className="text-sm font-medium capitalize">{formatLabel(serviceKey)}</label>
                <input
                  type="number"
                  value={pricingConfig.services[serviceKey]}
                  onChange={(e) => handleInputChange('services', serviceKey, e.target.value)}
                  className="w-full p-2 border rounded-md"
                  step="0.01"
                  min="0"
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-8">
           <Button onClick={handleSave} disabled={saving || !hasChanges}>
             {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
           </Button>
         </div>

      </motion.div>
    </div>
  );
};

export default AdminDashboard;
