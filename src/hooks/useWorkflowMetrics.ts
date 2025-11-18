// NOTE: order_workflows table not available; this hook returns default metrics
import { useQuery } from '@tanstack/react-query';
import { useWarehouse } from '@/contexts/WarehouseContext';

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

const defaultMetrics: WorkflowMetrics = {
  processingSpeed: 0,
  averageProcessingTime: 0,
  totalWorkflows: 0,
  completedWorkflows: 0,
  inProgressWorkflows: 0,
  timeEfficiency: 0,
  strategyPerformance: 0,
  stepMetrics: [],
  strategyMetrics: {
    fifoPerformance: 0,
    lifoPerformance: 0,
    currentStrategy: 'FIFO',
    recommendedStrategy: 'FIFO',
  },
  historicalTrend: [],
};

export const useWorkflowMetrics = () => {
  const { selectedWarehouse } = useWarehouse();

  return useQuery({
    queryKey: ['workflow-metrics', selectedWarehouse],
    queryFn: async (): Promise<WorkflowMetrics> => {
      console.warn('useWorkflowMetrics is disabled: order_workflows table not available');
      return defaultMetrics;
    },
    enabled: false, // Disable query
  });
};
