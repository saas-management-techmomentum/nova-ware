// DISABLED: Workflow metrics require order_workflows and workflow_steps tables
// This hook has been stubbed out to prevent build errors

export const useWorkflowMetrics = () => {
  console.warn('useWorkflowMetrics: Feature disabled - requires order_workflows table');
  
  return {
    metrics: null,
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
};
