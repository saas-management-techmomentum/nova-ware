// COMMENTED OUT: RPC functions not available in schema
// This utils file is disabled until required RPC functions are added to the database

export const getUserDataScope = async () => {
  console.warn('getUserDataScope: RPC not available');
  return null;
};

export const getCompanyMetrics = async () => {
  console.warn('getCompanyMetrics: RPC not available');
  return null;
};

export const testRLSPolicies = async () => {
  console.warn('testRLSPolicies: RPC not available');
  return null;
};
