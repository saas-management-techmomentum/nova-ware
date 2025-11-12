import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  orderStatus?: string; // Maps to order status when completed
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

const defaultWorkflowSteps: Omit<WorkflowStep, 'id'>[] = [
  { name: 'Pick Items', status: 'pending', orderStatus: 'prep-in-progress' },
  { name: 'Pack Order', status: 'pending', orderStatus: 'pallet-details-sent' },
  { name: 'Ready to Ship', status: 'pending', orderStatus: 'order-ready' }
];

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workflows, setWorkflows] = useState<OrderWorkflow[]>([]);
  const [userRole, setUserRole] = useState<string>('employee');
  const { toast } = useToast();
  const { user } = useAuth();

  // Load workflows from database on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserRole();
      loadWorkflows();
      const cleanup = setupRealtimeSubscriptions();
      return cleanup; // Proper cleanup on unmount
    }
  }, [user?.id]);

  const loadUserRole = async () => {
    if (!user?.id) return;
    
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('role')
        .or(`user_id_auth.eq.${user.id},user_id.eq.${user.id}`)
        .order('role', { ascending: false }) // Admin > Manager > Employee
        .limit(1)
        .single();
      
      setUserRole(employee?.role || 'employee');
    } catch (error) {
      console.warn('Could not load user role, defaulting to employee:', error);
      setUserRole('employee');
    }
  };

  const loadWorkflows = async () => {
    if (!user?.id) return;

    try {
      // Load workflows with their steps
      const { data: workflowData, error: workflowError } = await supabase
        .from('order_workflows')
        .select(`
          *,
          workflow_steps (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'in-progress', 'completed']);

      if (workflowError) throw workflowError;

      const loadedWorkflows: OrderWorkflow[] = [];

      for (const dbWorkflow of workflowData || []) {
        // Load pick instructions for this workflow
        const { data: pickData, error: pickError } = await supabase
          .from('workflow_pick_instructions')
          .select('*')
          .eq('order_id', dbWorkflow.order_id);

        if (pickError) throw pickError;

        // Convert database format to client format
        const steps: WorkflowStep[] = dbWorkflow.workflow_steps
          .sort((a: any, b: any) => a.step_order - b.step_order)
          .map((dbStep: any) => ({
            id: dbStep.id,
            name: dbStep.step_name,
            status: dbStep.status,
            startedAt: dbStep.started_at,
            completedAt: dbStep.completed_at,
            assignedTo: dbStep.assigned_to,
            completedBy: dbStep.completed_by,
            roleRequired: dbStep.role_required || 'employee',
            documents: dbStep.documents || [],
            orderStatus: getOrderStatusForStep(dbStep.step_name)
          }));

        const pickInstructions = await loadPickInstructions(dbWorkflow.order_id);

        const workflow: OrderWorkflow = {
          orderId: dbWorkflow.order_id,
          currentStep: steps.find(s => s.status === 'in-progress')?.id || steps[0]?.id || '',
          steps,
          startedAt: dbWorkflow.started_at,
          completedAt: dbWorkflow.completed_at,
          pickingStrategy: (dbWorkflow.picking_strategy as 'FIFO' | 'LIFO') || 'FIFO',
          pickInstructions,
          palletAdjustments: (dbWorkflow.pallet_adjustments as any) || []
        };

        loadedWorkflows.push(workflow);
      }

      setWorkflows(loadedWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const loadPickInstructions = async (orderId: string): Promise<PickInstruction[]> => {
    try {
      const { data: pickData, error: pickError } = await supabase
        .from('workflow_pick_instructions')
        .select('*')
        .eq('order_id', orderId)
        .order('pick_sequence');

      if (pickError) throw pickError;

      const instructions: PickInstruction[] = [];
      
      for (const pick of pickData || []) {
        const { data: locations, error: locError } = await supabase
          .from('workflow_pick_locations')
          .select('*')
          .eq('pick_instruction_id', pick.id)
          .order('pick_order');

        if (locError) throw locError;

        const instruction: PickInstruction = {
          id: pick.id,
          productId: pick.product_id,
          sku: pick.sku,
          productName: pick.sku, // Use SKU as fallback since product_name doesn't exist yet
          totalQuantity: pick.total_quantity,
          pickSequence: pick.pick_sequence,
          locations: locations?.map(loc => ({
            id: loc.id,
            palletId: loc.pallet_id,
            palletLocation: loc.pallet_location,
            quantityToPick: loc.quantity_to_pick,
            pickOrder: loc.pick_order,
            currentQuantity: 0, // Default value since column doesn't exist yet
            quantityPicked: 0, // Default value since column doesn't exist yet
            expirationDate: undefined // Default value since column doesn't exist yet
          })) || [],
          picked: false, // Default value since column doesn't exist yet
          pickedQuantity: 0 // Default value since column doesn't exist yet
        };

        instructions.push(instruction);
      }

      return instructions;
    } catch (error) {
      console.error('Error loading pick instructions:', error);
      return [];
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    let reloadTimeout: NodeJS.Timeout;
    
    const debouncedReload = () => {
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        loadWorkflows();
      }, 500); // Reduced debounce for faster updates
    };

    // Subscribe to workflow changes
    const workflowChannel = supabase
      .channel('workflow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_workflows',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          debouncedReload(); // Use debounced reload
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_steps'
        },
        () => {
          debouncedReload(); // Use debounced reload
        }
      )
      .subscribe();

    return () => {
      clearTimeout(reloadTimeout);
      supabase.removeChannel(workflowChannel);
    };
  };

  const getOrderStatusForStep = (stepName: string): string => {
    const stepMapping: Record<string, string> = {
      'Pick Items': 'prep-in-progress',
      'Pack Order': 'pallet-details-sent',
      'Ready to Ship': 'order-ready'
    };
    return stepMapping[stepName] || '';
  };

  const createRevenueRecognitionEntry = async (orderId: string) => {
    if (!user?.id) return;

    try {
      // Skip revenue recognition for now - function may not exist
      console.log('Skipping revenue recognition for order:', orderId);
      return;
    } catch (error) {
      console.warn('Revenue recognition failed (non-critical):', error);
      // Revenue recognition is optional - don't let it break the workflow
    }
  };

  const performAutomaticPalletAdjustments = async (orderId: string) => {
    if (!user?.id) return [];

    try {
      // Get order items
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          sku,
          quantity,
          product_id,
          products (
            name,
            sku
          )
        `)
        .eq('order_id', orderId);

      if (orderError) throw orderError;

      const adjustments: {
        palletId: string;
        oldQuantity: number;
        newQuantity: number;
        productSku: string;
      }[] = [];

      // Process each order item
      for (const orderItem of orderItems || []) {
        let remainingQty = orderItem.quantity;

        // Find pallet products with this SKU using FIFO
        const { data: palletProducts, error: palletError } = await supabase
          .from('pallet_products')
          .select(`
            id,
            pallet_id,
            quantity,
            product_id,
            created_at,
            products (
              sku
            )
          `)
          .eq('product_id', orderItem.product_id)
          .gt('quantity', 0)
          .order('created_at', { ascending: true }); // FIFO: First In, First Out

        if (palletError) throw palletError;

        // Reduce quantities from pallets using FIFO
        for (const palletProduct of palletProducts || []) {
          if (remainingQty <= 0) break;

          const oldQuantity = palletProduct.quantity;
          let newQuantity: number;

          if (palletProduct.quantity >= remainingQty) {
            // This pallet has enough quantity
            newQuantity = palletProduct.quantity - remainingQty;
            remainingQty = 0;
          } else {
            // Use all quantity from this pallet and continue
            remainingQty -= palletProduct.quantity;
            newQuantity = 0;
          }

          // Update pallet quantity
          const { error: updateError } = await supabase
            .from('pallet_products')
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', palletProduct.id);

          if (updateError) throw updateError;

          // Track the adjustment
          adjustments.push({
            palletId: palletProduct.pallet_id,
            oldQuantity,
            newQuantity,
            productSku: orderItem.sku
          });

          // Log the adjustment in inventory history
          const { error: historyError } = await supabase
            .from('inventory_history')
            .insert({
              product_id: orderItem.product_id,
              quantity: -(oldQuantity - newQuantity),
              transaction_type: 'outgoing',
              reference: `Workflow: ${orderId}`,
              user_id: user.id,
              remaining_stock: newQuantity,
              notes: `Automatic pallet adjustment for workflow start - Pallet: ${palletProduct.pallet_id}`
            });

          if (historyError) throw historyError;
        }
      }

      return adjustments;
    } catch (error) {
      console.error('Error performing automatic pallet adjustments:', error);
      toast({
        title: "Error",
        description: "Failed to automatically adjust pallet quantities",
        variant: "destructive",
      });
      return [];
    }
  };

  const startWorkflow = async (orderId: string, pickingStrategy: 'FIFO' | 'LIFO' = 'FIFO') => {
    if (!user?.id) return;

    // Check database directly for any existing workflow (including completed ones)
    try {
      const { data: existingWorkflow, error: checkError } = await supabase
        .from('order_workflows')
        .select('id, status, completed_at')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .single();

      if (!checkError && existingWorkflow) {
        const isCompleted = existingWorkflow.status === 'completed';
        toast({
          title: isCompleted ? "Workflow Already Completed" : "Workflow Already Started",
          description: isCompleted 
            ? `Workflow for order ${orderId} was completed on ${new Date(existingWorkflow.completed_at).toLocaleDateString()}.`
            : `Workflow for order ${orderId} is already in progress.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      // If error is not "no rows returned", it's a real error
      if (error.code !== 'PGRST116') {
        console.error('Error checking existing workflow:', error);
        toast({
          title: "Error",
          description: "Failed to check workflow status. Please try again.",
          variant: "destructive",
        });
        return;
      }
      // PGRST116 means no rows found, which is what we want - proceed with creation
    }

    let workflowData: any = null;

    try {
      // Show loading toast
      toast({
        title: "Starting Workflow",
        description: "Setting up pick/pack/ship workflow...",
      });

      // Create workflow in database first (core operation)
      const { data: newWorkflowData, error: workflowError } = await supabase
        .from('order_workflows')
        .insert({
          order_id: orderId,
          user_id: user.id,
          picking_strategy: pickingStrategy,
          pallet_adjustments: [] // Start with empty, will update after adjustments
        })
        .select()
        .single();

      if (workflowError) throw workflowError;
      workflowData = newWorkflowData;

      // Create workflow steps in database
      const stepsToInsert = defaultWorkflowSteps.map((step, index) => ({
        workflow_id: workflowData.id,
        step_name: step.name,
        step_order: index + 1,
        status: index === 0 ? 'in-progress' : 'pending',
        started_at: index === 0 ? new Date().toISOString() : null
      }));

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      // Show early success feedback
      toast({
        title: "Workflow Started",
        description: "Pick/Pack/Ship workflow is now active. Processing adjustments...",
      });

      // Perform pallet adjustments in background (non-blocking)
      const performBackgroundTasks = async () => {
        try {
          const palletAdjustments = await performAutomaticPalletAdjustments(orderId);
          
          // Update workflow with pallet adjustments
          if (palletAdjustments.length > 0) {
            await supabase
              .from('order_workflows')
              .update({ pallet_adjustments: palletAdjustments })
              .eq('id', workflowData.id);
          }

          // Generate pick instructions
          await generatePickInstructions(orderId, pickingStrategy);

          // Try revenue recognition (completely optional)
          createRevenueRecognitionEntry(orderId).catch(() => {
            // Silently ignore revenue recognition failures
          });

          // Show final success message
          if (palletAdjustments.length > 0) {
            toast({
              title: "Adjustments Complete",
              description: `${palletAdjustments.length} pallet(s) automatically adjusted using ${pickingStrategy}.`,
            });
          }
        } catch (error) {
          console.warn('Background task failed (non-critical):', error);
          toast({
            title: "Warning",
            description: "Workflow started but some background tasks failed.",
            variant: "default",
          });
        }

        // Reload workflows after all background tasks
        setTimeout(() => {
          loadWorkflows();
        }, 500);
      };

      // Start background tasks without awaiting
      performBackgroundTasks();

      // Immediate reload to show the workflow
      setTimeout(() => {
        loadWorkflows();
      }, 100);

    } catch (error) {
      console.error('Error starting workflow:', error);
      
      // Clean up if workflow was created but steps failed
      if (workflowData?.id) {
        try {
          await supabase.from('order_workflows').delete().eq('id', workflowData.id);
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
      }
      
      // Handle specific duplicate key error
      const isDuplicateKeyError = error.message?.includes('duplicate key value violates unique constraint');
      
      toast({
        title: "Error",
        description: isDuplicateKeyError 
          ? `A workflow already exists for order ${orderId}. Please refresh the page.`
          : `Failed to start workflow: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const updateWorkflowStep = async (
    orderId: string, 
    stepId: string, 
    status: WorkflowStep['status'], 
    documents?: string[], 
    onStatusUpdate?: (orderId: string, newStatus: string) => void
  ) => {
    if (!user?.id) return;

    try {
      // Check if user can complete this step using database function
      if (status === 'completed') {
        const { data: canComplete, error: permError } = await supabase
          .rpc('can_complete_workflow_step', { 
            step_id: stepId,
            input_user_id: user.id 
          });

        if (permError) throw permError;
        
        if (!canComplete) {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to complete this step",
            variant: "destructive",
          });
          return;
        }
      }

      // Get the current workflow and step before updating
      const workflow = workflows.find(w => w.orderId === orderId);
      const currentStep = workflow?.steps.find(s => s.id === stepId);

      // Update step in database
      const { error: stepError } = await supabase
        .from('workflow_steps')
        .update({
          status,
          started_at: status === 'in-progress' && !currentStep?.startedAt ? new Date().toISOString() : undefined,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          completed_by: status === 'completed' ? user.id : null,
          documents: documents || []
        })
        .eq('id', stepId);

      if (stepError) throw stepError;

      // Get the current workflow to determine next actions
      if (!workflow) return;

      const step = workflow.steps.find(s => s.id === stepId);
      
      // If step is completed and has an order status mapping, update the order status
      if (status === 'completed' && step?.orderStatus && onStatusUpdate) {
        onStatusUpdate(orderId, step.orderStatus);
        
        // Special notification for "Ready to Ship" completion
        if (step.name === 'Ready to Ship') {
          toast({
            title: "Order Ready to Ship!",
            description: `Order ${orderId} has been automatically transferred to Outgoing Shipments.`,
            className: "bg-green-50 border-green-200 text-green-800",
          });
        }
      }

      // If current step is completed, activate next step
      if (status === 'completed') {
        const currentStepIndex = workflow.steps.findIndex(s => s.id === stepId);
        if (currentStepIndex < workflow.steps.length - 1) {
          const nextStepId = workflow.steps[currentStepIndex + 1].id;
          
          await supabase
            .from('workflow_steps')
            .update({ 
              status: 'in-progress',
              started_at: new Date().toISOString()
            })
            .eq('id', nextStepId);
        }

        // Check if all steps are completed
        const allStepsCompleted = workflow.steps.every((s, index) => 
          s.id === stepId || s.status === 'completed' || index > currentStepIndex
        );

        if (allStepsCompleted) {
          // Mark workflow as completed
          await supabase
            .from('order_workflows')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

          // Create revenue recognition entry
          await createRevenueRecognitionEntry(orderId);
        }
      }

      // Immediate reload for real-time updates
      await loadWorkflows();
      
      toast({
        title: "Step Updated",
        description: `Workflow step ${status === 'completed' ? 'completed' : 'updated'} for order ${orderId}`,
      });

    } catch (error) {
      console.error('Error updating workflow step:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow step",
        variant: "destructive",
      });
    }
  };

  const generatePickInstructions = async (orderId: string, pickingStrategy: 'FIFO' | 'LIFO'): Promise<PickInstruction[]> => {
    if (!user?.id) return [];

    try {
      // Get order items
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          sku,
          quantity,
          product_id,
          products (
            name,
            sku
          )
        `)
        .eq('order_id', orderId);

      if (orderError) throw orderError;

      const pickInstructions: PickInstruction[] = [];

      // Process each order item to generate pick instructions
      for (let i = 0; i < (orderItems || []).length; i++) {
        const orderItem = orderItems![i];
        let remainingQty = orderItem.quantity;

        // Get pallet products with locations, ordered by strategy
        const orderDirection = pickingStrategy === 'FIFO' ? 'asc' : 'desc';
        const { data: palletProducts, error: palletError } = await supabase
          .from('pallet_products')
          .select(`
            id,
            pallet_id,
            quantity,
            created_at,
            pallet_locations!inner (
              id,
              location
            )
          `)
          .eq('product_id', orderItem.product_id)
          .gt('quantity', 0)
          .order('created_at', { ascending: orderDirection === 'asc' });

        if (palletError) throw palletError;

        const locations = [];
        let pickOrder = 1;

        // Generate pick locations for this product
        for (const palletProduct of palletProducts || []) {
          if (remainingQty <= 0) break;

          const quantityToPick = Math.min(palletProduct.quantity, remainingQty);
          
          locations.push({
            id: `${palletProduct.id}-${pickOrder}`,
            palletId: palletProduct.pallet_id,
            palletLocation: palletProduct.pallet_locations.location,
            quantityToPick,
            pickOrder,
            currentQuantity: palletProduct.quantity,
            expirationDate: undefined // TODO: Add expiration tracking
          });

          remainingQty -= quantityToPick;
          pickOrder++;
        }

        // Create pick instruction for this product
        const instruction: PickInstruction = {
          id: `pick-${orderId}-${i + 1}`,
          productId: orderItem.product_id,
          sku: orderItem.sku,
          productName: orderItem.products?.name || orderItem.sku,
          totalQuantity: orderItem.quantity,
          pickSequence: i + 1,
          locations,
          picked: false,
          pickedQuantity: 0
        };

        pickInstructions.push(instruction);

        // Save to database
        const { error: insertError } = await supabase
          .from('workflow_pick_instructions')
          .insert({
            order_id: orderId,
            product_id: orderItem.product_id,
            sku: orderItem.sku,
            total_quantity: orderItem.quantity,
            pick_sequence: i + 1,
            user_id: user.id
          });

        if (insertError) throw insertError;
      }

      return pickInstructions;
    } catch (error) {
      console.error('Error generating pick instructions:', error);
      toast({
        title: "Error",
        description: "Failed to generate pick instructions",
        variant: "destructive",
      });
      return [];
    }
  };

  const updatePickingStrategy = async (orderId: string, strategy: 'FIFO' | 'LIFO') => {
    try {
      // Update picking strategy in database
      const { error } = await supabase
        .from('order_workflows')
        .update({ picking_strategy: strategy })
        .eq('order_id', orderId);

      if (error) throw error;

      // The real-time subscription will automatically reload workflows
      toast({
        title: "Picking Strategy Updated",
        description: `Changed to ${strategy} for order ${orderId}`,
      });
    } catch (error) {
      console.error('Error updating picking strategy:', error);
      toast({
        title: "Error",
        description: "Failed to update picking strategy",
        variant: "destructive",
      });
    }
  };

  const markItemPicked = (orderId: string, instructionId: string, locationId: string, quantity: number) => {
    setWorkflows(prev => prev.map(workflow => {
      if (workflow.orderId !== orderId) return workflow;

      const updatedInstructions = workflow.pickInstructions.map(instruction => {
        if (instruction.id === instructionId) {
          const updatedLocations = instruction.locations.map(location => {
            if (location.id === locationId) {
              return { ...location, quantityPicked: quantity };
            }
            return location;
          });

          const totalPicked = updatedLocations.reduce((sum, loc) => sum + (loc.quantityPicked || 0), 0);
          const isPicked = totalPicked >= instruction.totalQuantity;

          return {
            ...instruction,
            locations: updatedLocations,
            picked: isPicked,
            pickedQuantity: totalPicked
          };
        }
        return instruction;
      });

      return { ...workflow, pickInstructions: updatedInstructions };
    }));
  };

  const validatePick = (orderId: string, instructionId: string, locationId: string) => {
    // TODO: Implement barcode scanning validation
    toast({
      title: "Pick Validated",
      description: "Item validated successfully",
    });
  };

  const generateDocument = (orderId: string, documentType: 'pick-slip' | 'packing-list' | 'shipping-label'): string => {
    // Simulate document generation
    const documentUrl = `#${documentType}-${orderId}-${Date.now()}`;
    
    toast({
      title: "Document Generated",
      description: `${documentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} generated for order ${orderId}`,
    });
    
    return documentUrl;
  };

  const canCompleteStep = (step: WorkflowStep): boolean => {
    if (!step.roleRequired) return true;
    
    // If step is assigned to specific user, check assignment
    if (step.assignedTo && step.assignedTo !== user?.id) {
      return false;
    }
    
    // Check role hierarchy: admin > manager > employee
    switch (step.roleRequired) {
      case 'admin':
        return userRole === 'admin';
      case 'manager':
        return userRole === 'manager' || userRole === 'admin';
      case 'employee':
      default:
        return true; // Everyone can complete employee-level tasks
    }
  };

  return (
    <WorkflowContext.Provider value={{
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
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
