
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ExpensesFinancial: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Expense tracking features coming soon.</p>
      </CardContent>
    </Card>
  );
};
