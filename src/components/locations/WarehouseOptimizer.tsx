
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, Warehouse, Check, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  warehouseName: z.string().min(2, {
    message: "Warehouse name must be at least 2 characters.",
  }),
});

type WarehouseOptimizerProps = {
  onOptimizationComplete?: (layout: any) => void;
};

const WarehouseOptimizer = ({ onOptimizationComplete }: WarehouseOptimizerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseName: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFloorplanFile(e.target.files[0]);
    }
  };

  const handleOptimize = async (values: z.infer<typeof formSchema>) => {
    if (!floorplanFile) {
      toast({
        title: "Missing floorplan",
        description: "Please upload a warehouse floorplan image",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis with a delay
    setTimeout(() => {
      // Mock optimization result
      const result = {
        warehouseName: values.warehouseName,
        fileName: floorplanFile.name,
        optimizationScore: 92,
        recommendedZones: [
          { id: "A1", type: "High velocity", area: "North entrance", items: 124 },
          { id: "B3", type: "Medium velocity", area: "Central area", items: 256 },
          { id: "C5", type: "Low velocity", area: "South section", items: 178 },
          { id: "D2", type: "Bulk storage", area: "East wall", items: 89 },
        ],
        pathEfficiency: "68% improvement",
        pickingTime: "42% reduction",
        spaceUtilization: "94% optimization",
      };
      
      setOptimizationResult(result);
      setIsAnalyzing(false);
      setOptimizationComplete(true);
      
      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }
      
      toast({
        title: "Analysis complete",
        description: "Your warehouse layout has been optimized",
      });
    }, 3000);
  };

  const resetState = () => {
    setFloorplanFile(null);
    setIsAnalyzing(false);
    setOptimizationComplete(false);
    setOptimizationResult(null);
    form.reset();
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after the dialog closing animation completes
    setTimeout(resetState, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) handleClose();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-indigo-600/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
        >
          <Warehouse className="w-4 h-4" />
          Optimize Warehouse Layout
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Warehouse Layout Optimizer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload your warehouse floorplan to generate an optimized layout for product locations.
          </DialogDescription>
        </DialogHeader>
        
        {!optimizationComplete ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOptimize)} className="space-y-6">
              <FormField
                control={form.control}
                name="warehouseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Warehouse Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Main Warehouse" 
                        {...field} 
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel className="text-slate-300">Upload Floorplan</FormLabel>
                <div className="border-2 border-dashed border-slate-600 rounded-md p-6 flex flex-col items-center justify-center bg-slate-700/20 hover:bg-slate-700/30 transition-colors cursor-pointer">
                  {floorplanFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Check className="h-10 w-10 text-emerald-500" />
                      <p className="text-sm text-slate-300">{floorplanFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(floorplanFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setFloorplanFile(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="h-10 w-10 text-slate-400" />
                      <p className="text-slate-300">Drag & drop or click to upload</p>
                      <p className="text-xs text-slate-400">
                        Supports JPG, PNG, PDF (max 10MB)
                      </p>
                      <Input 
                        type="file" 
                        className="hidden" 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isAnalyzing} 
                  className="bg-indigo-500 hover:bg-indigo-600 ml-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Optimize Layout"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Check className="mr-2 h-5 w-5 text-emerald-500" />
                  Optimization Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Warehouse Name</p>
                    <p className="text-sm text-white">{optimizationResult?.warehouseName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Optimization Score</p>
                    <p className="text-sm text-emerald-400 font-medium">{optimizationResult?.optimizationScore}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Path Efficiency</p>
                    <p className="text-sm text-emerald-400">{optimizationResult?.pathEfficiency}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Picking Time</p>
                    <p className="text-sm text-emerald-400">{optimizationResult?.pickingTime}</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-slate-300 mb-2">Recommended Zone Layout</p>
                  <div className="bg-slate-800 rounded-md p-3 max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400 text-xs border-b border-slate-700">
                          <th className="text-left py-2">Zone</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Area</th>
                          <th className="text-right py-2">Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizationResult?.recommendedZones.map((zone: any) => (
                          <tr key={zone.id} className="border-b border-slate-700/50">
                            <td className="py-2 font-medium">{zone.id}</td>
                            <td className="py-2">{zone.type}</td>
                            <td className="py-2">{zone.area}</td>
                            <td className="py-2 text-right">{zone.items}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col items-start">
                <div className="flex items-center text-xs text-amber-400 mb-2">
                  <Info className="h-3 w-3 mr-1" />
                  This is a preliminary analysis. Our team can help with implementation.
                </div>
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600" onClick={handleClose}>
                  Done
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WarehouseOptimizer;
