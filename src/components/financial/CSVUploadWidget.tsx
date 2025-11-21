import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBankConnections } from '@/hooks/useBankConnections';

interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
}

export const CSVUploadWidget = () => {
  const { toast } = useToast();
  const { connectedAccounts } = useBankConnections();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [parsedTransactions, setParsedTransactions] = useState<CSVTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      parseCSV(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
    }
  };

  const parseCSV = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const transactions: CSVTransaction[] = [];

      // Skip header row and process data
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (handles basic cases)
        const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
        
        if (columns.length >= 3) {
          const transaction: CSVTransaction = {
            date: columns[0] || new Date().toISOString().split('T')[0],
            description: columns[1] || 'Unknown Transaction',
            amount: parseFloat(columns[2]) || 0,
            type: parseFloat(columns[2]) >= 0 ? 'credit' : 'debit',
            reference: columns[3] || undefined
          };
          
          transactions.push(transaction);
        }
      }

      setParsedTransactions(transactions);
      setStep('preview');
      toast({
        title: "CSV parsed successfully",
        description: `Found ${transactions.length} transactions`
      });
    } catch (error) {
      toast({
        title: "Failed to parse CSV",
        description: "Please check your file format",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedAccount || parsedTransactions.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select an account and ensure transactions are loaded",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Mock import process - in real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('complete');
      toast({
        title: "Import completed",
        description: `Successfully imported ${parsedTransactions.length} transactions`
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Unable to import transactions",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setSelectedAccount('');
    setParsedTransactions([]);
    setStep('upload');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Manual CSV Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV file with columns: Date, Description, Amount, Reference (optional).
                Positive amounts are treated as credits, negative as debits.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="target-account">Target Bank Account</Label>
              <select
                id="target-account"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isProcessing}
              >
                <option value="">Select an account...</option>
                {connectedAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - ****{account.account_number.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            {isProcessing && (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Processing CSV file...</p>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview Transactions</h3>
              <Button variant="outline" onClick={resetUpload}>
                Upload Different File
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Review the parsed transactions below. Click Import to add them to your selected account.
              </AlertDescription>
            </Alert>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.slice(0, 50).map((transaction, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{transaction.date}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className={`p-2 text-right ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="p-2 capitalize">{transaction.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedTransactions.length > 50 && (
                <div className="p-2 text-sm text-muted-foreground text-center border-t">
                  Showing first 50 of {parsedTransactions.length} transactions
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={isProcessing || !selectedAccount}>
                {isProcessing ? 'Importing...' : 'Import Transactions'}
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">Import Successful!</h3>
              <p className="text-muted-foreground">
                {parsedTransactions.length} transactions have been imported and are ready for reconciliation.
              </p>
            </div>
            <Button onClick={resetUpload}>
              Import Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};