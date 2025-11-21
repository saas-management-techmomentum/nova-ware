
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Warehouse, ZoomIn, ZoomOut, RotateCcw, Download, Boxes, Package, LayoutPanelTop, Search, X, Building, Coffee, User, Forklift, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ProductLocation = {
  sku: string;
  name: string;
  locations: string[];
  totalQty: number;
  upc: string;
};

type Pallet = {
  id: string;
  location: string;
  products: {
    sku: string;
    name: string;
    qty: number;
    upc: string;
  }[];
  lastUpdated: string;
};

type WarehouseLayoutProps = {
  optimizationResult?: any;
  className?: string;
  pallets?: Pallet[];
  products?: ProductLocation[];
  onPalletSelect?: (palletId: string) => void;
};

const WarehouseLayout = ({ 
  optimizationResult, 
  className, 
  pallets = [], 
  products = [],
  onPalletSelect 
}: WarehouseLayoutProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1);
  const [highlightedPallet, setHighlightedPallet] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { toast } = useToast();
  const [layoutImageLoaded, setLayoutImageLoaded] = useState(false);
  const layoutImageRef = useRef<HTMLImageElement | null>(null);
  
  // Drawing constants
  const colors = {
    highVelocity: '#4f46e5', // indigo
    mediumVelocity: '#0ea5e9', // sky blue
    lowVelocity: '#10b981', // emerald
    bulkStorage: '#f59e0b', // amber
    wall: '#334155', // slate-700
    path: '#94a3b8', // slate-400
    door: '#475569', // slate-600
    background: '#1e293b', // slate-800
    highlighted: '#d946ef', // magenta
    officeArea: '#6366f130', // indigo with transparency
    loungeArea: '#ec489930', // rose with transparency
    storageAreaA: '#f59e0b30', // amber with transparency 
    storageAreaB: '#0ea5e930', // sky with transparency
  };

  // Process pallets to determine which ones should be displayed on the layout
  const processedPallets = pallets.map(pallet => {
    // Extract location information (aisle letter and section number)
    const locationMatch = pallet.location.match(/([A-Z]).*?(\d+)/);
    let aisle = 'X';
    let section = 0;
    
    if (locationMatch) {
      aisle = locationMatch[1];
      section = parseInt(locationMatch[2], 10);
    }
    
    // Determine velocity based on product types and quantities
    let velocity = 'medium';
    const totalItems = pallet.products.reduce((sum, p) => sum + p.qty, 0);
    
    if (totalItems > 40) {
      velocity = 'high';
    } else if (totalItems < 20) {
      velocity = 'low';
    }
    
    // Generate position based on aisle and section
    let quadrantIndex = 0;
    
    if (aisle === 'A') {
      quadrantIndex = 2 + (section - 1) % 2;
    } else if (aisle === 'B') {
      quadrantIndex = (section - 1) % 2;
    } else {
      // Default positioning for unknown locations
      quadrantIndex = (aisle.charCodeAt(0) % 4);
    }
    
    return {
      ...pallet,
      velocity,
      quadrantIndex,
      highlight: highlightedPallet === pallet.id || 
                (searchTerm && (
                  pallet.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  pallet.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  pallet.products.some(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                ))
    };
  });
  
  // Preload warehouse layout image
  useEffect(() => {
    const img = new Image();
    img.src = '/uploads/e934f213-896d-49a6-bda0-781cbee8840b.png';
    img.onload = () => {
      setLayoutImageLoaded(true);
      layoutImageRef.current = img;
    };
  }, []);

  // Draw the warehouse layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on parent
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    
    // Apply scaling
    ctx.save();
    ctx.scale(scale, scale);
    
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

    if (layoutImageLoaded && layoutImageRef.current) {
      // Draw the warehouse layout image with semi-transparency
      ctx.globalAlpha = 0.7;
      ctx.drawImage(layoutImageRef.current, 0, 0, canvas.width / scale, canvas.height / scale);
      ctx.globalAlpha = 1.0;
      
      // Overlay our interactive elements on top of the image
      drawWarehouseElements(ctx, canvas.width / scale, canvas.height / scale, processedPallets);
    } else {
      // Fallback to the original drawing if image isn't loaded
      drawDefaultLayout(ctx, Math.floor((canvas.width / scale) / 20), Math.floor((canvas.height / scale) / 20), 20);
    }
    
    ctx.restore();
  }, [optimizationResult, processedPallets, scale, highlightedPallet, searchTerm, layoutImageLoaded]);
  
  // Function to draw warehouse elements on top of the layout image
  const drawWarehouseElements = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pallets: typeof processedPallets
  ) => {
    // Define the zones based on the image
    const zones = [
      { id: 'B1', name: 'Storage B1', color: colors.storageAreaB, x: width * 0.15, y: height * 0.35, w: width * 0.15, h: height * 0.08 },
      { id: 'B2', name: 'Storage B2', color: colors.storageAreaB, x: width * 0.15, y: height * 0.45, w: width * 0.15, h: height * 0.08 },
      { id: 'B3', name: 'Storage B3', color: colors.storageAreaB, x: width * 0.15, y: height * 0.55, w: width * 0.15, h: height * 0.08 },
      { id: 'A1', name: 'Storage A1', color: colors.storageAreaA, x: width * 0.25, y: height * 0.7, w: width * 0.3, h: height * 0.08 },
      { id: 'A2', name: 'Storage A2', color: colors.storageAreaA, x: width * 0.25, y: height * 0.8, w: width * 0.3, h: height * 0.08 },
      { id: 'A3', name: 'Storage A3', color: colors.storageAreaA, x: width * 0.25, y: height * 0.9, w: width * 0.3, h: height * 0.08 },
    ];
    
    // Highlight the zones with pallets
    zones.forEach(zone => {
      const zoneHasPallets = pallets.some(p => {
        const locationMatch = p.location.match(/([A-Z]).*?(\d+)/);
        if (locationMatch) {
          const aisle = locationMatch[1];
          const section = parseInt(locationMatch[2], 10);
          return (zone.id === `${aisle}${section}`);
        }
        return false;
      });
      
      if (zoneHasPallets) {
        // Draw highlighted zone
        ctx.fillStyle = `${zone.color.replace(/30$/, '50')}`; // Increase opacity
        ctx.beginPath();
        ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 5);
        ctx.fill();
        
        // Add zone label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(zone.id, zone.x + 10, zone.y + 20);
      }
    });
    
    // Draw pallets 
    pallets.forEach(pallet => {
      const locationMatch = pallet.location.match(/([A-Z]).*?(\d+)/);
      if (!locationMatch) return;
      
      const aisle = locationMatch[1];
      const section = parseInt(locationMatch[2], 10);
      const zoneId = `${aisle}${section}`;
      
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;
      
      // Calculate position within the zone
      const cellWidth = zone.w / 6;
      const cellHeight = zone.h;
      
      const palletIndex = pallets
        .filter(p => p.location.includes(`${aisle}`) && p.location.includes(`Section ${section}`))
        .findIndex(p => p.id === pallet.id);
      
      const col = palletIndex % 6;
      const row = Math.floor(palletIndex / 6);
      
      const palletX = zone.x + col * cellWidth + cellWidth / 4;
      const palletY = zone.y + row * (cellHeight / 2) + cellHeight / 4;
      
      // Determine pallet color based on velocity
      let palletColor;
      switch (pallet.velocity) {
        case 'high':
          palletColor = colors.highVelocity;
          break;
        case 'low':
          palletColor = colors.lowVelocity;
          break;
        default:
          palletColor = colors.mediumVelocity;
      }
      
      // Highlight pallet if it's selected
      if (pallet.highlight) {
        ctx.fillStyle = colors.highlighted;
        // Draw a highlight halo
        ctx.beginPath();
        ctx.arc(palletX + cellWidth / 4, palletY + cellHeight / 4, cellWidth / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw pallet
      ctx.fillStyle = palletColor;
      ctx.beginPath();
      ctx.arc(palletX + cellWidth / 4, palletY + cellHeight / 4, cellWidth / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Add pallet ID if there's room
      if (cellWidth > 30) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          pallet.id,
          palletX + cellWidth / 4,
          palletY + cellHeight / 4 + 4
        );
      }
      
      // Reset text alignment
      ctx.textAlign = 'left';
    });
  };
  
  // Function to draw a default sample layout
  const drawDefaultLayout = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    gridSize: number
  ) => {
    // Define grid size
    const grid = gridSize;
    
    // Draw walls
    ctx.fillStyle = colors.wall;
    
    // Outer walls
    ctx.fillRect(0, 0, width * grid, grid); // Top
    ctx.fillRect(0, 0, grid, height * grid); // Left
    ctx.fillRect(0, (height - 1) * grid, width * grid, grid); // Bottom
    ctx.fillRect((width - 1) * grid, 0, grid, height * grid); // Right
    
    // Draw door (entrance)
    ctx.fillStyle = colors.door;
    ctx.fillRect(Math.floor(width / 2) * grid - grid * 2, 0, grid * 4, grid);
    
    // Draw main aisle
    ctx.fillStyle = colors.path;
    ctx.fillRect(Math.floor(width / 2) * grid - grid, grid, grid * 2, (height - 2) * grid);
    
    // Draw cross aisles
    const aislePositions = [0.25, 0.5, 0.75];
    aislePositions.forEach(pos => {
      const y = Math.floor(height * pos) * grid;
      ctx.fillRect(grid, y, (width - 2) * grid, grid);
    });
    
    // Add the main areas
    // Office area
    ctx.fillStyle = colors.officeArea;
    ctx.fillRect(grid * 2, grid * 2, grid * 8, grid * 6);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('Office', grid * 5, grid * 5);
    
    // Lounge area
    ctx.fillStyle = colors.loungeArea;
    ctx.fillRect(width * grid - grid * 10, height * grid - grid * 8, grid * 8, grid * 6);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('Lounge', width * grid - grid * 6, height * grid - grid * 5);
    
    // Storage areas
    const storageZones = [
      { id: 'A1', color: colors.storageAreaA, x: grid * 2, y: height * grid - grid * 15, w: grid * 15, h: grid * 3 },
      { id: 'A2', color: colors.storageAreaA, x: grid * 2, y: height * grid - grid * 10, w: grid * 15, h: grid * 3 },
      { id: 'A3', color: colors.storageAreaA, x: grid * 2, y: height * grid - grid * 5, w: grid * 15, h: grid * 3 },
      { id: 'B1', color: colors.storageAreaB, x: grid * 2, y: grid * 10, w: grid * 8, h: grid * 3 },
      { id: 'B2', color: colors.storageAreaB, x: grid * 2, y: grid * 15, w: grid * 8, h: grid * 3 },
      { id: 'B3', color: colors.storageAreaB, x: grid * 2, y: grid * 20, w: grid * 8, h: grid * 3 },
    ];
    
    storageZones.forEach(zone => {
      ctx.fillStyle = zone.color;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(zone.id, zone.x + zone.w / 2 - 10, zone.y + zone.h / 2 + 5);
    });
    
    // Draw truck loading area
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(width * grid - grid * 3, grid * (5 + i * 5), grid * 3, grid * 3);
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText('Loading', width * grid - grid * 2, grid * (6.5 + i * 5));
    }
    
    // Draw some conveyor belts
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(grid * 15, grid * 10, grid * 10, grid);
    ctx.fillRect(grid * 15, grid * 20, grid * 10, grid);
    ctx.fillRect(grid * 25, grid * 10, grid, grid * 11);
  };
  
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.0));
    toast({
      title: "Zoomed In",
      description: "Increased map zoom level",
    });
  };
  
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.6));
    toast({
      title: "Zoomed Out",
      description: "Decreased map zoom level",
    });
  };
  
  const handleReset = () => {
    setScale(1);
    setHighlightedPallet(null);
    setSearchTerm('');
    setSearchInput('');
    toast({
      title: "View Reset",
      description: "Map view has been reset to default",
    });
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link
    const link = document.createElement('a');
    link.download = 'warehouse-layout.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Layout Downloaded",
      description: "Warehouse layout has been saved as an image",
    });
  };
  
  const handlePalletClick = (palletId: string) => {
    setHighlightedPallet(palletId);
    if (onPalletSelect) {
      onPalletSelect(palletId);
    }
    
    toast({
      title: "Pallet Selected",
      description: `Pallet ${palletId} selected on the layout`,
    });
  };
  
  // Get metrics for sidebar based on pallet data
  const getZoneMetrics = () => {
    const metrics = {
      highVelocity: 0,
      mediumVelocity: 0,
      lowVelocity: 0,
      bulkStorage: 0
    };
    
    // Use real data if available
    if (processedPallets.length > 0) {
      processedPallets.forEach(pallet => {
        const totalItems = pallet.products.reduce((sum, p) => sum + p.qty, 0);
        
        if (pallet.velocity === 'high') {
          metrics.highVelocity += totalItems;
        } else if (pallet.velocity === 'low') {
          metrics.lowVelocity += totalItems;
        } else if (pallet.quadrantIndex === 3) { // Bulk storage is quadrant 3
          metrics.bulkStorage += totalItems;
        } else {
          metrics.mediumVelocity += totalItems;
        }
      });
    } else {
      // Use mock data
      metrics.highVelocity = 124;
      metrics.mediumVelocity = 256;
      metrics.lowVelocity = 178;
      metrics.bulkStorage = 89;
    }
    
    return metrics;
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    
    const matchedPallets = processedPallets.filter(pallet => 
      pallet.id.toLowerCase().includes(searchInput.toLowerCase()) ||
      pallet.location.toLowerCase().includes(searchInput.toLowerCase()) ||
      pallet.products.some(product => 
        product.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchInput.toLowerCase()) ||
        product.upc.toLowerCase().includes(searchInput.toLowerCase())
      )
    );
    
    if (matchedPallets.length > 0) {
      toast({
        title: "Pallets Found",
        description: `Found ${matchedPallets.length} pallet(s) matching "${searchInput}"`,
      });
      
      // If there's exactly one match, highlight it
      if (matchedPallets.length === 1) {
        setHighlightedPallet(matchedPallets[0].id);
      }
    } else {
      toast({
        title: "No Pallets Found",
        description: `No pallets match "${searchInput}"`,
        variant: "destructive",
      });
    }
  };
  
  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setHighlightedPallet(null);
  };

  return (
    <Card className={cn("bg-slate-800/50 backdrop-blur-md border-slate-700/50 shadow-md overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center text-white">
              <Warehouse className="h-5 w-5 mr-2 text-indigo-400" />
              Warehouse Layout Visualization
            </CardTitle>
            <CardDescription className="text-slate-400">
              {optimizationResult 
                ? `Optimized layout for ${optimizationResult.warehouseName}` 
                : pallets && pallets.length > 0 
                  ? `Current layout with ${pallets.length} pallets`
                  : 'Interactive warehouse layout visualization'}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <form onSubmit={handleSearch} className="relative mr-2">
              <input
                type="text"
                placeholder="Search pallets..."
                className="h-8 py-1 px-3 pl-8 rounded-md bg-slate-700/50 border border-slate-600 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 w-[180px]"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              {searchInput && (
                <button 
                  type="button" 
                  onClick={clearSearch}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
            <Button variant="outline" size="sm" onClick={handleZoomIn} 
                className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}
                className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}
                className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Reset View">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}
                className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Download Layout">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-indigo-500 mr-1"></div>
            <span className="text-xs text-slate-300">High velocity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-sky-500 mr-1"></div>
            <span className="text-xs text-slate-300">Medium velocity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-emerald-500 mr-1"></div>
            <span className="text-xs text-slate-300">Low velocity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-sm bg-amber-500 mr-1"></div>
            <span className="text-xs text-slate-300">Bulk storage</span>
          </div>
          {(highlightedPallet || searchTerm) && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-sm bg-fuchsia-500 mr-1"></div>
              <span className="text-xs text-slate-300">Highlighted</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-stretch h-[400px]">
          <div className="w-full relative">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full block"
            />
          </div>
          
          <div className="w-64 bg-slate-800 border-l border-slate-700 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-white mb-1 flex items-center">
                <LayoutPanelTop className="h-4 w-4 mr-1 text-indigo-400" />
                Layout Details
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-700/50 rounded-md p-2">
                  <p className="text-xs text-slate-400">Total Area</p>
                  <p className="text-sm text-white">15,000 sq. ft.</p>
                </div>
                <div className="bg-slate-700/50 rounded-md p-2">
                  <p className="text-xs text-slate-400">Total Pallets</p>
                  <p className="text-sm text-white">{pallets.length || 5} pallets</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-white mb-1 flex items-center">
                <Boxes className="h-4 w-4 mr-1 text-indigo-400" />
                Zone Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">High Velocity:</span>
                  <Badge className="bg-indigo-500/70">{getZoneMetrics().highVelocity} items</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Medium Velocity:</span>
                  <Badge className="bg-sky-500/70">{getZoneMetrics().mediumVelocity} items</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Low Velocity:</span>
                  <Badge className="bg-emerald-500/70">{getZoneMetrics().lowVelocity} items</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Bulk Storage:</span>
                  <Badge className="bg-amber-500/70">{getZoneMetrics().bulkStorage} items</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-white mb-1 flex items-center">
                <User className="h-4 w-4 mr-1 text-indigo-400" />
                Staff
              </h4>
              <div className="space-y-2 max-h-[100px] overflow-y-auto">
                <div className="bg-slate-700/50 rounded-md p-2">
                  <div className="flex justify-between">
                    <p className="text-xs text-white">John Taylor</p>
                    <Badge variant="outline" className="text-xs bg-slate-600/50">Conveyor</Badge>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-md p-2">
                  <div className="flex justify-between">
                    <p className="text-xs text-white">George Murphy</p>
                    <Badge variant="outline" className="text-xs bg-slate-600/50">Forklift</Badge>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-md p-2">
                  <div className="flex justify-between">
                    <p className="text-xs text-white">Kyle Brown</p>
                    <Badge variant="outline" className="text-xs bg-slate-600/50">Inventory</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {optimizationResult && (
              <div>
                <h4 className="text-sm font-medium text-white mb-1 flex items-center">
                  <Package className="h-4 w-4 mr-1 text-indigo-400" />
                  Optimization Metrics
                </h4>
                <div className="space-y-2">
                  <div className="bg-slate-700/50 rounded-md p-2">
                    <p className="text-xs text-slate-400">Path Efficiency</p>
                    <p className="text-sm text-emerald-400">{optimizationResult.pathEfficiency}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-md p-2">
                    <p className="text-xs text-slate-400">Picking Time</p>
                    <p className="text-sm text-emerald-400">{optimizationResult.pickingTime}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseLayout;
