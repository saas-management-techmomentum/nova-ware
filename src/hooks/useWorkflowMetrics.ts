// COMMENTED OUT: order_workflows table does not exist in schema
// This hook is disabled until the database schema includes order_workflows and workflow_steps

export interface WorkflowMetrics {
  processingSpeed: number;
  averageProcessingTime: number;
  totalWorkflows: number;
  completedWorkflows: number;
  inProgressWorkflows: number;
  timeEfficiency: number;
  strategyPerformance: number;
  stepMetrics: {
    stepName: string;
    averageTime: number;
    efficiency: number;
    currentCount: number;
    completedCount: number;
    bottleneckScore: number;
    targetTime: number;
  }[];
  strategyMetrics: {
    fifoPerformance: number;
    lifoPerformance: number;
    currentStrategy: 'FIFO' | 'LIFO';
    recommendedStrategy: 'FIFO' | 'LIFO';
  };
  historicalTrend: {
    month: string;
    speed: number;
    averageTime: number;
    efficiency: number;
  }[];
}

export const useWorkflowMetrics = () => {
  return {
    data: {
      processingSpeed: 85,
      averageProcessingTime: 50,
      totalWorkflows: 0,
      completedWorkflows: 0,
      inProgressWorkflows: 0,
      timeEfficiency: 85,
      strategyPerformance: 85,
      stepMetrics: [],
      strategyMetrics: {
        fifoPerformance: 85,
        lifoPerformance: 85,
        currentStrategy: 'FIFO' as const,
        recommendedStrategy: 'FIFO' as const,
      },
      historicalTrend: [],
    } as WorkflowMetrics,
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
};
