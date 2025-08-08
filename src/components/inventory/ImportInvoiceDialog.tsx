import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileBox, Zap, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessedInvoiceItem, processInvoiceFile, processInvoiceWithAI, matchProductsWithInventory } from '@/utils/invoiceProcessor';
import { useInventory } from '@/contexts/InventoryContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface ImportInvoiceDialogProps {
  disabled?: boolean;
}

const ImportInvoiceDialog: React.FC<ImportInvoiceDialogProps> = ({ disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [fileType, setFileType] = useState<'incoming' | 'outgoing'>('incoming');
  const [processedItems, setProcessedItems] = useState<ProcessedInvoiceItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importMethod, setImportMethod] = useState<'ai' | 'excel'>('ai');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { inventoryItems } = useInventory();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setShowPreview(false);
      setProcessedItems([]);
      
      // Auto-detect import method based on file type
      if (selectedFile.type.includes('image') || selectedFile.type === 'application/pdf') {
        setImportMethod('ai');
      } else if (selectedFile.type.includes('sheet') || selectedFile.type.includes('excel')) {
        setImportMethod('excel');
      }
    }
  };

  const processExcelFile = async () => {
    if (!file) return;
    
    try {
      const items = await processInvoiceFile(file);
      const matchedItems = matchProductsWithInventory(items, inventoryItems);
      setProcessedItems(matchedItems);
      setShowPreview(true);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "Error",
        description: "Failed to process the Excel file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const processWithAI = async () => {
    if (!file) return;
    
    setIsProcessingAI(true);
    
    try {
      toast({
        title: "Processing Invoice",
        description: "AI is analyzing your invoice document...",
      });
      
      const items = await processInvoiceWithAI(file);
      const matchedItems = matchProductsWithInventory(items, inventoryItems);
      setProcessedItems(matchedItems);
      setShowPreview(true);
      
      toast({
        title: "Success",
        description: `AI extracted ${items.length} products from your invoice.`,
      });
    } catch (error) {
      console.error('Error processing invoice with AI:', error);
      toast({
        title: "Error",
        description: "Failed to process the invoice with AI. Please try again or use Excel import.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an invoice file to upload",
        variant: "destructive",
      });
      return;
    }

    if (importMethod === 'ai') {
      processWithAI();
    } else {
      processExcelFile();
    }
  };

  const handleConfirmUpload = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to process invoices",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const transactionPromises = processedItems
        .filter(item => item.found && item.productId)
        .map(async (item) => {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.productId)
            .eq('user_id', user.id)
            .single();

          if (productError) throw productError;

          const remainingStock = fileType === 'incoming' 
            ? product.quantity + item.quantity
            : product.quantity - item.quantity;

          // Prepare update data for the product
          const updateData: any = {
            quantity: remainingStock
          };

          // Only update fields that have values in the imported data
          if (item.name) updateData.name = item.name;
          if (item.upc) updateData.upc = item.upc;
          if (item.asin) updateData.asin = item.asin;
          if (item.category) updateData.category = item.category;
          if (item.description) updateData.description = item.description;
          if (item.unit_price !== undefined) updateData.unit_price = item.unit_price;
          if (item.cost_price !== undefined) updateData.cost_price = item.cost_price;
          if (item.case_price !== undefined) updateData.case_price = item.case_price;
          if (item.case_cost !== undefined) updateData.case_cost = item.case_cost;
          if (item.casesize) updateData.casesize = item.casesize;
          if (item.dimensions) updateData.dimensions = item.dimensions;
          if (item.weight) updateData.weight = item.weight;
          if (item.image_url) updateData.image_url = item.image_url;
          if (item.expiration) updateData.expiration = item.expiration;

          // Update the product with comprehensive data
          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', item.productId)
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          // Create inventory history record
          const { error } = await supabase
            .from('inventory_history')
            .insert({
              product_id: item.productId,
              quantity: item.quantity,
              transaction_type: fileType,
              reference: `Imported from ${file?.name}`,
              notes: `Invoice import - ${fileType}`,
              user_id: user.id,
              remaining_stock: remainingStock
            });

          if (error) throw error;
        });

      await Promise.all(transactionPromises);
      
      setIsUploading(false);
      setFile(null);
      setShowPreview(false);
      setProcessedItems([]);
      setOpen(false);
      
      toast({
        title: "Success",
        description: `Invoice processed successfully. ${processedItems.filter(i => i.found).length} products updated.`,
      });
    } catch (error) {
      console.error('Error processing invoice:', error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to process invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadSampleTemplate = () => {
    // Complete product template with all available fields
    const sampleData = [
      {
        SKU: 'PROD-001',
        Name: 'Sample Product 1',
        UPC: '123456789012',
        ASIN: 'B08EXAMPLE1',
        Quantity: 50,
        Unit_Price: 29.99,
        Cost_Price: 15.50,
        Case_Price: 299.90,
        Case_Cost: 155.00,
        Category: 'Electronics',
        Description: 'High-quality sample product for demonstration',
        Case_Size: '10 units',
        Dimensions: '10x5x3 inches',
        Weight: '1.2 lbs',
        Image_URL: 'https://example.com/product1.jpg',
        Expiration: '2025-12-31',
        Has_Batches: 'FALSE'
      },
      {
        SKU: 'PROD-002',
        Name: 'Sample Product 2',
        UPC: '234567890123',
        ASIN: 'B08EXAMPLE2',
        Quantity: 25,
        Unit_Price: 45.00,
        Cost_Price: 22.75,
        Case_Price: 450.00,
        Case_Cost: 227.50,
        Category: 'Home & Garden',
        Description: 'Another sample product with different specifications',
        Case_Size: '5 units',
        Dimensions: '8x8x4 inches',
        Weight: '2.5 lbs',
        Image_URL: 'https://example.com/product2.jpg',
        Expiration: '',
        Has_Batches: 'TRUE'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 12 }, // SKU
      { wch: 25 }, // Name
      { wch: 15 }, // UPC
      { wch: 15 }, // ASIN
      { wch: 10 }, // Quantity
      { wch: 12 }, // Unit_Price
      { wch: 12 }, // Cost_Price
      { wch: 12 }, // Case_Price
      { wch: 12 }, // Case_Cost
      { wch: 15 }, // Category
      { wch: 40 }, // Description
      { wch: 12 }, // Case_Size
      { wch: 15 }, // Dimensions
      { wch: 10 }, // Weight
      { wch: 30 }, // Image_URL
      { wch: 12 }, // Expiration
      { wch: 12 }  // Has_Batches
    ];
    worksheet['!cols'] = colWidths;
    
    // Create instructions sheet
    const instructions = [
      { Field: 'SKU', Description: 'Unique product identifier (required)', Example: 'PROD-001' },
      { Field: 'Name', Description: 'Product name (required)', Example: 'Sample Product' },
      { Field: 'UPC', Description: 'Universal Product Code', Example: '123456789012' },
      { Field: 'ASIN', Description: 'Amazon Standard Identification Number', Example: 'B08EXAMPLE1' },
      { Field: 'Quantity', Description: 'Current stock quantity (required)', Example: '50' },
      { Field: 'Unit_Price', Description: 'Selling price per unit', Example: '29.99' },
      { Field: 'Cost_Price', Description: 'Cost price per unit', Example: '15.50' },
      { Field: 'Case_Price', Description: 'Selling price per case', Example: '299.90' },
      { Field: 'Case_Cost', Description: 'Cost price per case', Example: '155.00' },
      { Field: 'Category', Description: 'Product category', Example: 'Electronics' },
      { Field: 'Description', Description: 'Product description', Example: 'High-quality product...' },
      { Field: 'Case_Size', Description: 'Units per case', Example: '10 units' },
      { Field: 'Dimensions', Description: 'Product dimensions', Example: '10x5x3 inches' },
      { Field: 'Weight', Description: 'Product weight', Example: '1.2 lbs' },
      { Field: 'Image_URL', Description: 'URL to product image', Example: 'https://example.com/image.jpg' },
      { Field: 'Expiration', Description: 'Expiration date (YYYY-MM-DD or empty)', Example: '2025-12-31' },
      { Field: 'Has_Batches', Description: 'TRUE if product uses batch tracking', Example: 'FALSE' }
    ];
    
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [
      { wch: 15 }, // Field
      { wch: 50 }, // Description
      { wch: 25 }  // Example
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Template");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Field Descriptions");
    
    const fileName = fileType === 'incoming' 
      ? 'complete_product_template_incoming.xlsx' 
      : 'complete_product_template_outgoing.xlsx';
    
    XLSX.writeFile(workbook, fileName);
  };

  const resetForm = () => {
    setFile(null);
    setShowPreview(false);
    setProcessedItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStockImpactSummary = () => {
    return processedItems.map(item => {
      const inventoryItem = inventoryItems.find(
        invItem => invItem.id.toString() === item.productId
      );
      
      if (!inventoryItem) return null;
      
      const currentStock = inventoryItem.stock;
      const newStock = fileType === 'incoming' 
        ? currentStock + item.quantity 
        : currentStock - item.quantity;
      
      return {
        ...item,
        currentStock,
        newStock,
        valid: fileType === 'incoming' || (fileType === 'outgoing' && currentStock >= item.quantity)
      };
    }).filter(Boolean);
  };

  const stockImpact = getStockImpactSummary();
  const hasInvalidItems = stockImpact.some(item => !item.valid);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2" 
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <Upload className="h-4 w-4" />
          Import Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-500" />
            AI-Powered Invoice Import
          </DialogTitle>
          <DialogDescription>
            Upload any invoice document and let AI extract product information automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file-type">Invoice Type</Label>
            <Select 
              value={fileType} 
              onValueChange={(value: 'incoming' | 'outgoing') => {
                setFileType(value);
                resetForm();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select invoice type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">Incoming Shipment</SelectItem>
                <SelectItem value="outgoing">Outgoing Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={importMethod} onValueChange={(value: 'ai' | 'excel') => setImportMethod(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Processing
              </TabsTrigger>
              <TabsTrigger value="excel" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Excel Template
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                  ✨ AI-Powered Processing
                </h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Upload any invoice image (JPG, PNG) or PDF. AI will automatically extract product SKUs, UPCs, names, and quantities.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ai-invoice-file">Invoice Document</Label>
                <Input
                  id="ai-invoice-file"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="excel" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="excel-invoice-file">Excel File</Label>
                <Input
                  id="excel-invoice-file"
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name}
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-fit gap-2" 
                  onClick={downloadSampleTemplate}
                  title="Download comprehensive product template with all available fields"
                >
                  <Download className="h-4 w-4" />
                  Download Complete Template
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {showPreview && processedItems.length > 0 && (
            <div className="border rounded-md p-4 mt-2">
              <h3 className="font-medium mb-2">Preview of Stock Changes</h3>
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">SKU/UPC</th>
                      <th className="text-right p-2">Current</th>
                      <th className="text-right p-2">Change</th>
                      <th className="text-right p-2">New Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockImpact.map((item, idx) => (
                      <tr key={idx} className={!item.valid ? "text-red-600" : ""}>
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-xs">
                          {item.sku && <div>SKU: {item.sku}</div>}
                          {item.upc && <div>UPC: {item.upc}</div>}
                        </td>
                        <td className="text-right p-2">{item.currentStock}</td>
                        <td className="text-right p-2">
                          {fileType === 'incoming' ? '+' : '-'}{item.quantity}
                        </td>
                        <td className="text-right p-2">
                          {item.newStock}
                          {!item.valid && " (Out of stock!)"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasInvalidItems && fileType === 'outgoing' && (
                <p className="text-red-600 text-sm mt-2">
                  Warning: Some items don't have enough stock for this sale!
                </p>
              )}
              {processedItems.some(item => !item.found) && (
                <p className="text-amber-600 text-sm mt-2">
                  Warning: Some products were not found in inventory.
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => showPreview ? setShowPreview(false) : setOpen(false)}>
            {showPreview ? "Back" : "Cancel"}
          </Button>
          
          {!showPreview ? (
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading || isProcessingAI}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessingAI ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  AI Processing...
                </>
              ) : isUploading ? (
                "Processing..."
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleConfirmUpload} 
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-700"
              variant={hasInvalidItems ? "destructive" : "default"}
            >
              {isUploading ? "Processing..." : "Confirm Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportInvoiceDialog;
