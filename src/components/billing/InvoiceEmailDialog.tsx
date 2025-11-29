
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Paperclip, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useBilling } from '@/contexts/BillingContext';
import { useToast } from '@/components/ui/use-toast';

interface InvoiceEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  recipientEmail: string;
}

export const InvoiceEmailDialog: React.FC<InvoiceEmailDialogProps> = ({
  open,
  onOpenChange,
  invoiceId,
  recipientEmail
}) => {
  const { sendInvoiceEmail } = useBilling();
  const { toast } = useToast();
  const [email, setEmail] = useState(recipientEmail);
  const [subject, setSubject] = useState('Invoice from LogistiX');
  const [message, setMessage] = useState(`Hi there,

Please find your invoice attached.

Payment can be made online by clicking the payment link in the attached invoice, or you can remit payment using the details provided in the invoice.

Thank you for your business!

Best regards,
LogistiX`);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  React.useEffect(() => {
    setEmail(recipientEmail);
    setEmailSent(false);
    setEmailError(null);
  }, [recipientEmail, open]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = async () => {
    if (!email || !invoiceId) return;
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSending(true);
    setEmailError(null);
    
    try {
      const result = await sendInvoiceEmail(invoiceId, email, message);
      
      // Check if the result indicates success
      if (result && result.success) {
        setEmailSent(true);
        toast({
          title: "Email sent successfully",
          description: `Invoice email sent to ${email}`,
        });
        
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onOpenChange(false);
          setEmailSent(false);
          setMessage(`Hi there,

Please find your invoice attached.

Payment can be made online by clicking the payment link in the attached invoice, or you can remit payment using the details provided in the invoice.

Thank you for your business!

Best regards,
LogistiX`);
        }, 2000);
      } else {
        // Handle case where result doesn't indicate success
        const errorMsg = result?.error || 'Failed to send email - unknown error';
        setEmailError(errorMsg);
        toast({
          title: "Failed to send email",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to send email';
      setEmailError(errorMsg);
      toast({
        title: "Failed to send email",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onOpenChange(false);
      setEmailSent(false);
      setEmailError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send Invoice Email</span>
            {emailSent && (
              <Badge variant="secondary" className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sent
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {emailSent ? (
          <div className="space-y-4 text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Email Sent Successfully!</h3>
              <p className="text-slate-400">
                The invoice has been sent to {email}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {emailError && (
              <div className="flex items-center space-x-2 p-3 bg-red-600/20 border border-red-600/30 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-sm">{emailError}</span>
              </div>
            )}

            <div>
              <Label className="text-slate-300">To</Label>
              <Input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="recipient@email.com"
                className="bg-slate-700/50 border-slate-600 text-white"
                disabled={sending}
              />
            </div>

            <div>
              <Label className="text-slate-300">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
                disabled={sending}
              />
            </div>

            <div>
              <Label className="text-slate-300">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="bg-slate-700/50 border-slate-600 text-white"
                disabled={sending}
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-slate-700/30 rounded-md">
              <Paperclip className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                Invoice PDF will be attached automatically
              </span>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="border-slate-600"
                disabled={sending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSend}
                disabled={sending || !email || !validateEmail(email)}
                className="bg-gray-800 hover:bg-gray-900"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
