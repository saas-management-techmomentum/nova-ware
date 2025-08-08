import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Package, Box, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentManagementProps {
  orderId: string;
  labels?: {
    productLabel?: string;
    boxLabel?: string;
    palletLabel?: string;
    bolDocument?: string;
  };
  onLabelsUpdate?: (orderId: string, labels: {
    productLabel?: string;
    boxLabel?: string;
    palletLabel?: string;
    bolDocument?: string;
  }) => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ 
  orderId, 
  labels, 
  onLabelsUpdate 
}) => {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [tempUrls, setTempUrls] = useState({
    productLabel: labels?.productLabel || '',
    boxLabel: labels?.boxLabel || '',
    palletLabel: labels?.palletLabel || '',
    bolDocument: labels?.bolDocument || ''
  });
  const [tempFiles, setTempFiles] = useState<Record<string, File | null>>({
    productLabel: null,
    boxLabel: null,
    palletLabel: null,
    bolDocument: null
  });

  const documentTypes = [
    {
      key: 'productLabel',
      label: 'Product Label',
      icon: Tag,
      color: 'text-indigo-400'
    },
    {
      key: 'boxLabel',
      label: 'Box Label',
      icon: Package,
      color: 'text-amber-400'
    },
    {
      key: 'palletLabel',
      label: 'Pallet Label',
      icon: Box,
      color: 'text-emerald-400'
    },
    {
      key: 'bolDocument',
      label: 'Bill of Lading',
      icon: FileText,
      color: 'text-sky-400'
    }
  ];

  const handleFileChange = (documentKey: string, file: File | null) => {
    setTempFiles(prev => ({ ...prev, [documentKey]: file }));
  };

  const handleUrlChange = (documentKey: string, url: string) => {
    setTempUrls(prev => ({ ...prev, [documentKey]: url }));
  };

  const handleSaveDocument = (documentKey: string) => {
    const url = tempUrls[documentKey as keyof typeof tempUrls];
    const file = tempFiles[documentKey];
    
    let finalUrl = url;
    if (!url && file) {
      finalUrl = URL.createObjectURL(file);
    }

    if (finalUrl && onLabelsUpdate) {
      const updatedLabels = {
        ...labels,
        [documentKey]: finalUrl
      };
      onLabelsUpdate(orderId, updatedLabels);
    }

    toast({
      title: "Document Updated",
      description: `${documentTypes.find(d => d.key === documentKey)?.label} has been updated`,
    });

    setActiveDialog(null);
  };

  const hasDocument = (documentKey: string) => {
    return !!(labels?.[documentKey as keyof typeof labels]);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-white">Documents</h4>
      <div className="grid grid-cols-2 gap-3">
        {documentTypes.map((docType) => {
          const IconComponent = docType.icon;
          const hasDoc = hasDocument(docType.key);
          
          return (
            <Dialog 
              key={docType.key} 
              open={activeDialog === docType.key} 
              onOpenChange={(open) => setActiveDialog(open ? docType.key : null)}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2 bg-slate-700/30 border-slate-600 hover:bg-slate-600/30"
                >
                  <IconComponent className={`h-5 w-5 ${docType.color}`} />
                  <div className="text-center">
                    <div className="text-xs font-medium text-white">{docType.label}</div>
                    {hasDoc ? (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs mt-1">
                        Not Available
                      </Badge>
                    )}
                  </div>
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Upload {docType.label}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Provide a URL or upload a file for the {docType.label.toLowerCase()}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.key}-url`} className="text-white">
                      Document URL
                    </Label>
                    <Input
                      id={`${docType.key}-url`}
                      placeholder={`Enter URL for ${docType.label.toLowerCase()}`}
                      value={tempUrls[docType.key as keyof typeof tempUrls]}
                      onChange={(e) => handleUrlChange(docType.key, e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div className="text-sm text-slate-400 text-center">Or</div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.key}-file`} className="text-white">
                      Upload File
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${docType.key}-file`}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(docType.key, e.target.files?.[0] || null)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Upload className="h-4 w-4 text-slate-400" />
                    </div>
                    {tempFiles[docType.key] && (
                      <div className="text-sm text-slate-400">
                        Selected: {tempFiles[docType.key]?.name}
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveDialog(null)}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSaveDocument(docType.key)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Save Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentManagement;