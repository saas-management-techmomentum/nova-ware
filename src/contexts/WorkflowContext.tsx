import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PickInstruction } from '@/components/workflow/PickInstructionsPanel';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  completedBy?: string;
  roleRequired?: 'employee' | 'manager' | 'admin';
  documents?: string[];
  orderStatus?: string;
}

export interface OrderWorkflow {
  orderId: string;
  currentStep: string;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  pickingStrategy: 'FIFO' | 'LIFO';
  pickInstructions: PickInstruction[];
  palletAdjustments?: {
    palletId: string;
    oldQuantity: number;
    newQuantity: number;
    productSku: string;
  }[];
}

interface WorkflowContextType {
  workflows: OrderWorkflow[];
  userRole?: string;
  canCompleteStep: (step: WorkflowStep) => boolean;
  startWorkflow: (orderId: string, pickingStrategy?: 'FIFO' | 'LIFO') => Promise<void>;
  updateWorkflowStep: (orderId: string, stepId: string, status: WorkflowStep['status'], documents?: string[], onStatusUpdate?: (orderId: string, newStatus: string) => void) => Promise<void>;
  generateDocument: (orderId: string, documentType: 'pick-slip' | 'packing-list' | 'shipping-label') => string;
  generatePickInstructions: (orderId: string, pickingStrategy: 'FIFO' | 'LIFO') => Promise<PickInstruction[]>;
  updatePickingStrategy: (orderId: string, strategy: 'FIFO' | 'LIFO') => Promise<void>;
  markItemPicked: (orderId: string, instructionId: string, locationId: string, quantity: number) => void;
  validatePick: (orderId: string, instructionId: string, locationId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

// Workflow features are disabled - missing database tables (order_workflows, workflow_pick_instructions, workflow_pick_locations)
export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workflows] = useState<OrderWorkflow[]>([]);
  const [userRole] = useState<string>('employee');
  const { toast } = useToast();

  const showDisabledToast = () => {
    toast({
      title: "Feature Unavailable",
      description: "Workflow features are currently disabled.",
      variant: "destructive"
    });
  };

  const canCompleteStep = () => false;

  const startWorkflow = async () => {
    showDisabledToast();
  };

  const updateWorkflowStep = async () => {
    showDisabledToast();
  };

  const generateDocument = () => {
    showDisabledToast();
    return '';
  };

  const generatePickInstructions = async (): Promise<PickInstruction[]> => {
    showDisabledToast();
    return [];
  };

  const updatePickingStrategy = async () => {
    showDisabledToast();
  };

  const markItemPicked = () => {
    showDisabledToast();
  };

  const validatePick = () => {
    showDisabledToast();
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflows,
        userRole,
        canCompleteStep,
        startWorkflow,
        updateWorkflowStep,
        generateDocument,
        generatePickInstructions,
        updatePickingStrategy,
        markItemPicked,
        validatePick
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
