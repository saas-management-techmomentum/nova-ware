import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Eye, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  design_config: any;
  user_id: string;
  warehouse_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyBrandingEditorProps {
  onTemplateSelect: (template: InvoiceTemplate | null) => void;
  selectedTemplate?: InvoiceTemplate | null;
}

export const CompanyBrandingEditor: React.FC<CompanyBrandingEditorProps> = ({
  onTemplateSelect,
  selectedTemplate
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Your Company Name',
    address: '123 Business Street',
    city: 'City',
    state: 'State',
    zipCode: '12345',
    phone: '(555) 123-4567',
    email: 'info@yourcompany.com',
    website: 'www.yourcompany.com',
    logoUrl: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate?.design_config) {
      try {
        const config = typeof selectedTemplate.design_config === 'string' 
          ? JSON.parse(selectedTemplate.design_config)
          : selectedTemplate.design_config;
        if (config?.company) {
          setCompanyInfo(config.company);
        }
      } catch (error) {
        console.error('Error parsing template config:', error);
      }
    } else if (selectedTemplate === null) {
      // Reset to empty values when creating new template
      setCompanyInfo({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        website: '',
        logoUrl: ''
      });
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoice-logos')
        .getPublicUrl(fileName);

      setCompanyInfo(prev => ({ ...prev, logoUrl: publicUrl }));
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = () => {
    setCompanyInfo(prev => ({ ...prev, logoUrl: '' }));
  };

  const saveTemplate = async () => {
    if (!companyInfo.name.trim()) {
      toast({
        title: "Company Name Required",
        description: "Please enter a company name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const templateData = {
        name: `${companyInfo.name} Template`,
        design_config: JSON.stringify({
          company: companyInfo,
          colors: {
            primary: '#6b7280',
            accent: '#4b5563'
          }
        }),
        is_default: templates.length === 0, // First template becomes default
        user_id: user.id,
        warehouse_id: null
      };

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('invoice_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        
        const updatedTemplate = { ...selectedTemplate, ...templateData };
        onTemplateSelect(updatedTemplate);
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('invoice_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        onTemplateSelect(data);
      }

      await fetchTemplates();
      
      toast({
        title: "Success",
        description: "Company information saved successfully",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save company information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PreviewHeader = () => (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          {companyInfo.logoUrl && (
            <img 
              src={companyInfo.logoUrl} 
              alt="Company Logo" 
              className="h-16 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
            <div className="text-sm text-gray-600 mt-1">
              <p>{companyInfo.address}</p>
              <p>{companyInfo.city}, {companyInfo.state} {companyInfo.zipCode}</p>
              <p>{companyInfo.phone} • {companyInfo.email}</p>
              {companyInfo.website && <p>{companyInfo.website}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-600">INVOICE</h2>
          <p className="text-sm text-gray-500">#INV-001</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Company Information</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveTemplate}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Template
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Template Selector */}
        {templates.length > 0 && (
          <div>
            <Label>Template</Label>
            <Select 
              value={selectedTemplate?.id || '__create_new__'} 
              onValueChange={(value) => {
                if (value === '__create_new__') {
                  onTemplateSelect(null);
                } else {
                  const template = templates.find(t => t.id === value);
                  onTemplateSelect(template || null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__create_new__">Create New Template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <Label className="text-sm font-medium mb-2 block">Invoice Header Preview</Label>
            <PreviewHeader />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Company Logo */}
          <div className="col-span-2">
            <Label>Company Logo</Label>
            <div className="mt-2">
              {companyInfo.logoUrl ? (
                <div className="flex items-center space-x-3">
                  <img 
                    src={companyInfo.logoUrl} 
                    alt="Company Logo" 
                    className="h-12 w-auto object-contain border rounded"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                  >
                    Click to upload logo
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Company Name */}
          <div className="col-span-2">
            <Label>Company Name</Label>
            <Input
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your Company Name"
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <Label>Street Address</Label>
            <Input
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Business Street"
            />
          </div>

          {/* City, State, ZIP */}
          <div>
            <Label>City</Label>
            <Input
              value={companyInfo.city}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
              placeholder="City"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>State</Label>
              <Input
                value={companyInfo.state}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
            <div>
              <Label>ZIP Code</Label>
              <Input
                value={companyInfo.zipCode}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="12345"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <Label>Phone</Label>
            <Input
              value={companyInfo.phone}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={companyInfo.email}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="info@yourcompany.com"
            />
          </div>

          {/* Website */}
          <div className="col-span-2">
            <Label>Website (optional)</Label>
            <Input
              value={companyInfo.website}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
              placeholder="www.yourcompany.com"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};