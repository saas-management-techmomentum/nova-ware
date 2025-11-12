import React from 'react';
import { EnhancedInvoiceManagement } from './EnhancedInvoiceManagement';

// Keep the original component as a wrapper for backward compatibility
export const InvoiceManagement = () => {
  return <EnhancedInvoiceManagement />;
};
