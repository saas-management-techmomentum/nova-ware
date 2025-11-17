// COMMENTED OUT: billing_transactions table does not exist
// This hook requires database schema updates before it can be re-enabled

// The original hook code is preserved below for future re-enabling
/*
Original file: src/hooks/useLastActivity.ts
Issue: Queries the billing_transactions table which does not exist in current schema

The hook needs to be refactored to exclude billing_transactions or the table needs to be created.
*/
