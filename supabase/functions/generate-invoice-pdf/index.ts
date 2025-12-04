// invoice_pdf_generator.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import jsPDF from 'https://esm.sh/jspdf@2.5.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) throw new Error('Invoice ID is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid authentication token');

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();
    if (!invoice) throw new Error('Invoice not found');

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .single();
    if (!client) throw new Error('Client not found');

    const [productItemsResult, lineItemsResult] = await Promise.all([
      supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId),
      supabase.from('invoice_line_items').select('*').eq('invoice_id', invoiceId)
    ]);

    const productItems = (productItemsResult.data || []).map(item => ({
      type: 'product',
      description: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_rate: item.unit_price,
      total_amount: item.total_amount,
    }));

    const serviceItems = (lineItemsResult.data || []).map(item => ({
      type: 'service',
      description: item.description,
      service_type: item.service_type,
      quantity: item.quantity,
      unit_rate: item.unit_rate,
      total_amount: item.total_amount,
    }));

    const allItems = [...productItems, ...serviceItems];

    let companyInfo = {
      name: 'LogitixWMS',
      address: '1000',
      city: 'Skopje MKD',
      phone: '(555) 123-4567',
      email: 'support@unsynth.ai',
      website: 'logistixwms.com',
    };

    try {
      let template = null;
      if (invoice.template_id) {
        const { data: invoiceTemplate } = await supabase
          .from('invoice_templates')
          .select('design_config')
          .eq('id', invoice.template_id)
          .eq('user_id', user.id)
          .maybeSingle();
        template = invoiceTemplate;
      }
      if (!template) {
        const { data: defaultTemplate } = await supabase
          .from('invoice_templates')
          .select('design_config')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        template = defaultTemplate;
      }
      if (template?.design_config) {
        const config = typeof template.design_config === 'string' 
          ? JSON.parse(template.design_config)
          : template.design_config;
        if (config?.company) {
          companyInfo = { ...companyInfo, ...config.company };
        }
      }
    } catch (_) {}

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = 40;

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, margin, yPosition);
    doc.setFontSize(11);
    yPosition += 6;
    doc.text(companyInfo.address, margin, yPosition);
    yPosition += 6;
    doc.text(companyInfo.city, margin, yPosition);
    yPosition += 6;
    doc.text(companyInfo.phone, margin, yPosition);
    yPosition += 6;
    doc.text(companyInfo.website, margin, yPosition);

    let rightColumnY = 55;
    const rightStart = pageWidth / 2 + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', rightStart, rightColumnY);
    doc.setFontSize(11);
    rightColumnY += 8;
    doc.text(client.name, rightStart, rightColumnY);
    if (client.billing_address || client.shipping_address) {
      rightColumnY += 6;
      const address = client.billing_address || client.shipping_address || '';
      address.split('\n').forEach((line: string) => {
        doc.text(line, rightStart, rightColumnY);
        rightColumnY += 6;
      });
    }

    yPosition = Math.max(yPosition, rightColumnY) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', margin, yPosition);
    doc.text('Invoice Date:', margin + 80, yPosition);
    doc.text('Due Date:', margin + 160, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, margin, yPosition);
    doc.text(new Date(invoice.invoice_date).toLocaleDateString(), margin + 80, yPosition);
    doc.text(new Date(invoice.due_date).toLocaleDateString(), margin + 160, yPosition);
    yPosition += 15;

    const columnWidths = [100, 25, 25, 25];
    const columnPositions = [margin, margin + 100, margin + 125, margin + 150];

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', columnPositions[0] + 2, yPosition);
    doc.text('Qty', columnPositions[1] + 2, yPosition);
    doc.text('Price', columnPositions[2] + 2, yPosition);
    doc.text('Amount', columnPositions[3] + 2, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    allItems.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 12, 'F');
      }
      const desc = doc.splitTextToSize(item.description, 95);
      doc.text(desc, columnPositions[0] + 2, yPosition);
      doc.text(`${item.quantity}`, columnPositions[1] + 12, yPosition);
      doc.text(`$${item.unit_rate.toFixed(2)}`, columnPositions[2] + 10, yPosition);
      doc.text(`$${item.total_amount.toFixed(2)}`, columnPositions[3] + 10, yPosition);
      yPosition += 12 + (desc.length - 1) * 5;
    });

    yPosition += 8;
    const totalsX = pageWidth - margin - 60;
    const labelX = totalsX - 40;
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', labelX, yPosition);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, totalsX, yPosition);
    yPosition += 6;
    doc.text('Tax:', labelX, yPosition);
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, totalsX, yPosition);
    yPosition += 6;
    doc.text('Total:', labelX, yPosition);
    doc.text(`$${invoice.total_amount.toFixed(2)}`, totalsX, yPosition);
    yPosition += 10;
    doc.setFillColor(240, 248, 255);
    doc.rect(labelX - 2, yPosition - 6, 80, 10, 'F');
    doc.setFontSize(13);
    doc.text('Amount Due:', labelX, yPosition);
    doc.text(`$${invoice.total_amount.toFixed(2)}`, totalsX, yPosition);
    yPosition += 15;

    if (invoice.notes) {
      doc.setFontSize(11);
      doc.text('Notes:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      invoice.notes.split('\n').forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
    }

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Thank you for your business! Contact us at ${companyInfo.email}`,
      margin,
      pageHeight - 20
    );

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    const pdfUint8Array = new Uint8Array(pdfBytes);

    return new Response(pdfUint8Array, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
