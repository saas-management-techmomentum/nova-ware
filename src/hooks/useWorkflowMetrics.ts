
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/WarehouseContext';

export interface WorkflowMetrics {
  processingSpeed: number; // Real-time processing efficiency score
  averageProcessingTime: number; // in minutes
  totalWorkflows: number;
  completedWorkflows: number;
  inProgressWorkflows: number;
  timeEfficiency: number; // How actual times compare to targets
  strategyPerformance: number; // FIFO vs LIFO performance score
  stepMetrics: {
    stepName: string;
    averageTime: number; // in minutes
    efficiency: number; // percentage
    currentCount: number;
    completedCount: number;
    bottleneckScore: number; // Higher score = bigger bottleneck
    targetTime: number; // Target time for this step
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
  const { selectedWarehouse } = useWarehouse();

  return useQuery({
    queryKey: ['workflow-metrics', selectedWarehouse],
    queryFn: async (): Promise<WorkflowMetrics> => {
      console.log('Fetching enhanced workflow metrics for warehouse:', selectedWarehouse);

      // Fetch workflows with their steps
      const { data: workflows, error: workflowError } = await supabase
        .from('order_workflows')
        .select(`
          *,
          workflow_steps (*)
        `)
        .eq('warehouse_id', selectedWarehouse || '')
        .order('created_at', { ascending: false });

      if (workflowError) {
        console.error('Error fetching workflows:', workflowError);
        throw workflowError;
      }

      console.log('Fetched workflows:', workflows?.length || 0);

      const totalWorkflows = workflows?.length || 0;
      const completedWorkflows = workflows?.filter(w => w.status === 'completed').length || 0;
      const inProgressWorkflows = totalWorkflows - completedWorkflows;

      // Define step order and target times
      const stepOrder = ['Pick Items', 'Pack Order', 'Generate Shipping', 'Ship Order'];
      const targetTimes = { 'Pick Items': 16, 'Pack Order': 12, 'Generate Shipping': 9, 'Ship Order': 13 };
      const totalTargetTime = Object.values(targetTimes).reduce((sum, time) => sum + time, 0);

      // Calculate real processing times for completed workflows
      const completedWorkflowTimes = workflows
        ?.filter(w => w.status === 'completed' && w.completed_at && w.started_at)
        .map(w => {
          const startTime = new Date(w.started_at).getTime();
          const endTime = new Date(w.completed_at).getTime();
          return (endTime - startTime) / (1000 * 60); // Convert to minutes
        }) || [];

      const averageProcessingTime = completedWorkflowTimes.length > 0 
        ? completedWorkflowTimes.reduce((sum, time) => sum + time, 0) / completedWorkflowTimes.length
        : totalTargetTime;

      // Calculate enhanced step metrics with bottleneck analysis
      const stepMetrics = stepOrder.map(stepName => {
        const allStepsOfType = workflows?.flatMap(w => 
          w.workflow_steps?.filter((s: any) => s.step_name === stepName) || []
        ) || [];

        const completedSteps = allStepsOfType.filter((s: any) => s.status === 'completed' && s.started_at && s.completed_at);
        const currentSteps = allStepsOfType.filter((s: any) => s.status === 'in-progress');

        // Calculate actual step times with proper started_at handling
        const stepTimes = completedSteps.map((s: any) => {
          const startTime = new Date(s.started_at).getTime();
          const endTime = new Date(s.completed_at).getTime();
          return (endTime - startTime) / (1000 * 60); // Convert to minutes
        });

        const targetTime = targetTimes[stepName as keyof typeof targetTimes];
        const averageTime = stepTimes.length > 0 
          ? stepTimes.reduce((sum: number, time: number) => sum + time, 0) / stepTimes.length
          : targetTime;

        // Calculate efficiency: (Target Time / Actual Average Time) * 100, capped at 100%
        const efficiency = Math.min(100, (targetTime / averageTime) * 100);

        // Calculate bottleneck score: higher score = worse bottleneck
        // Based on: how much time exceeds target + how many steps are currently stuck
        const timeExcess = Math.max(0, averageTime - targetTime);
        const stuckSteps = currentSteps.length;
        const bottleneckScore = (timeExcess / targetTime) * 50 + stuckSteps * 10;

        return {
          stepName,
          averageTime: Math.round(averageTime),
          efficiency: Math.round(efficiency * 10) / 10,
          currentCount: currentSteps.length,
          completedCount: completedSteps.length,
          bottleneckScore: Math.round(bottleneckScore * 10) / 10,
          targetTime
        };
      });

      // Calculate time efficiency: actual vs target performance
      const timeEfficiency = totalTargetTime > 0 && averageProcessingTime > 0
        ? Math.min(100, (totalTargetTime / averageProcessingTime) * 100)
        : 85;

      // Calculate strategy performance by comparing FIFO vs LIFO workflows
      const fifoWorkflows = workflows?.filter(w => w.picking_strategy === 'FIFO') || [];
      const lifoWorkflows = workflows?.filter(w => w.picking_strategy === 'LIFO') || [];

      const calculateStrategyPerformance = (strategyWorkflows: any[]) => {
        const completedStrategyWorkflows = strategyWorkflows.filter(w => 
          w.status === 'completed' && w.completed_at && w.started_at
        );

        if (completedStrategyWorkflows.length === 0) return 85; // Default

        const strategyTimes = completedStrategyWorkflows.map(w => {
          const startTime = new Date(w.started_at).getTime();
          const endTime = new Date(w.completed_at).getTime();
          return (endTime - startTime) / (1000 * 60);
        });

        const avgTime = strategyTimes.reduce((sum, time) => sum + time, 0) / strategyTimes.length;
        return Math.min(100, (totalTargetTime / avgTime) * 100);
      };

      const fifoPerformance = calculateStrategyPerformance(fifoWorkflows);
      const lifoPerformance = calculateStrategyPerformance(lifoWorkflows);

      // Get current strategy from most recent workflow or default to FIFO
      const currentStrategy = workflows?.[0]?.picking_strategy || 'FIFO';
      const recommendedStrategy = fifoPerformance >= lifoPerformance ? 'FIFO' : 'LIFO';

      const strategyPerformance = currentStrategy === 'FIFO' ? fifoPerformance : lifoPerformance;

      // Calculate comprehensive processing speed
      // Weighted formula: 40% completion rate + 30% time efficiency + 30% strategy performance
      const completionRate = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;
      const processingSpeed = (
        completionRate * 0.4 +
        timeEfficiency * 0.3 +
        strategyPerformance * 0.3
      );

      // Generate enhanced historical trend (last 6 months)
      const historicalTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const monthWorkflows = workflows?.filter(w => {
          const createdDate = new Date(w.created_at);
          return createdDate >= monthStart && createdDate <= monthEnd;
        }) || [];

        const monthCompleted = monthWorkflows.filter(w => w.status === 'completed').length;
        const monthTotal = monthWorkflows.length;
        const monthCompletionRate = monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0;

        const monthCompletedTimes = monthWorkflows
          .filter(w => w.status === 'completed' && w.completed_at && w.started_at)
          .map(w => {
            const startTime = new Date(w.started_at).getTime();
            const endTime = new Date(w.completed_at).getTime();
            return (endTime - startTime) / (1000 * 60);
          });

        const monthAverageTime = monthCompletedTimes.length > 0
          ? monthCompletedTimes.reduce((sum, time) => sum + time, 0) / monthCompletedTimes.length
          : averageProcessingTime;

        const monthTimeEfficiency = totalTargetTime > 0 && monthAverageTime > 0
          ? Math.min(100, (totalTargetTime / monthAverageTime) * 100)
          : 85;

        const monthEfficiency = (monthCompletionRate * 0.6 + monthTimeEfficiency * 0.4);

        historicalTrend.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          speed: Math.round(monthCompletionRate),
          averageTime: Math.round(monthAverageTime),
          efficiency: Math.round(monthEfficiency)
        });
      }

      return {
        processingSpeed: Math.round(processingSpeed * 10) / 10,
        averageProcessingTime: Math.round(averageProcessingTime),
        totalWorkflows,
        completedWorkflows,
        inProgressWorkflows,
        timeEfficiency: Math.round(timeEfficiency * 10) / 10,
        strategyPerformance: Math.round(strategyPerformance * 10) / 10,
        stepMetrics,
        strategyMetrics: {
          fifoPerformance: Math.round(fifoPerformance * 10) / 10,
          lifoPerformance: Math.round(lifoPerformance * 10) / 10,
          currentStrategy: currentStrategy as 'FIFO' | 'LIFO',
          recommendedStrategy: recommendedStrategy as 'FIFO' | 'LIFO'
        },
        historicalTrend
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};
