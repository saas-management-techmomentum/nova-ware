import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouse } from '@/contexts/WarehouseContext';

interface OrderDocumentUploadProps {
  orderId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUploaded?: () => void;
}

export const OrderDocumentUpload: React.FC<OrderDocumentUploadProps> = ({
  orderId,
  isOpen,
  onOpenChange,
  onDocumentUploaded
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedWarehouse, warehouses } = useWarehouse();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const currentWarehouse = warehouses.find(w => w.warehouse_id === selectedWarehouse);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${orderId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-documents')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: "Failed to upload file to storage",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('order-documents')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        toast({
          title: "Error",
          description: "Failed to get file URL",
          variant: "destructive",
        });
        return;
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('order_documents')
        .insert({
          order_id: orderId,
          user_id: user.id,
          company_id: currentWarehouse?.company_id,
          warehouse_id: selectedWarehouse,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        toast({
          title: "Database error",
          description: "Failed to save document information",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Upload successful",
        description: "Document has been uploaded successfully",
      });

      // Reset state and close dialog
      setSelectedFile(null);
      onOpenChange(false);
      
      // Notify parent component
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (error) {
      console.error('Upload exception:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document for order {orderId}. Supported formats: PDF, PNG, JPG (Max 10MB)
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-file">Select Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={uploadDocument}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};