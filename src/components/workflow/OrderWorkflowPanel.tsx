
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Package, 
  Truck, 
  FileText,
  Download,
  Play,
  MapPin,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useWorkflow, OrderWorkflow, WorkflowStep } from '@/contexts/WorkflowContext';
import { supabase } from '@/integrations/supabase/client';
import PickInstructionsPanel from './PickInstructionsPanel';
import WorkflowErrorBoundary from '@/components/common/WorkflowErrorBoundary';

interface OrderWorkflowPanelProps {
  orderId: string;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

const stepIcons = {
  'Pick Items': Package,
  'Pack Order': Package,
  'Generate Shipping': FileText,
  'Ship Order': Truck
};

const OrderWorkflowPanel: React.FC<OrderWorkflowPanelProps> = ({ orderId, onStatusUpdate }) => {
  const { 
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
  } = useWorkflow();
  const { toast } = useToast();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showPalletDetails, setShowPalletDetails] = useState(false);
  const [selectedPickingStrategy, setSelectedPickingStrategy] = useState<'FIFO' | 'LIFO'>('FIFO');
  const [isStarting, setIsStarting] = useState(false);
  const [hasExistingWorkflow, setHasExistingWorkflow] = useState(false);

  const workflow = workflows.find(w => w.orderId === orderId);

  // Check for existing workflow (including completed ones) when component mounts
  const checkExistingWorkflow = useCallback(async () => {
    if (!workflow) {
      try {
        const { data: existingWorkflow } = await supabase
          .from('order_workflows')
          .select('id, status')
          .eq('order_id', orderId)
          .single();
        
        setHasExistingWorkflow(!!existingWorkflow);
      } catch (error) {
        // No existing workflow found
        setHasExistingWorkflow(false);
      }
    } else {
      setHasExistingWorkflow(true);
    }
  }, [orderId, workflow]);

  useEffect(() => {
    checkExistingWorkflow();
  }, [checkExistingWorkflow]);

  const handleStartWorkflow = useCallback(async () => {
    if (isStarting) return; // Prevent double-clicking

    setIsStarting(true);
    try {
      await startWorkflow(orderId, selectedPickingStrategy);
    } catch (error) {
      console.error('Failed to start workflow:', error);
      toast({
        title: "Error",
        description: "Failed to start workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  }, [orderId, selectedPickingStrategy, startWorkflow, isStarting, toast]);

  const handlePickingStrategyChange = async (strategy: 'FIFO' | 'LIFO') => {
    if (workflow) {
      await updatePickingStrategy(orderId, strategy);
    } else {
      setSelectedPickingStrategy(strategy);
    }
  };

  const handleRegenerateInstructions = async () => {
    if (workflow) {
      const newInstructions = await generatePickInstructions(orderId, workflow.pickingStrategy);
      // Instructions are updated automatically via context
    }
  };

  const handleMarkItemPicked = (instructionId: string, locationId: string, quantity: number) => {
    markItemPicked(orderId, instructionId, locationId, quantity);
  };

  const handleValidatePick = (instructionId: string, locationId: string) => {
    validatePick(orderId, instructionId, locationId);
  };

  const handleCompleteStep = async (stepId: string, stepName: string) => {
    let documents: string[] = [];
    
    // Generate relevant documents based on step
    if (stepName === 'Pick Items') {
      documents = [generateDocument(orderId, 'pick-slip')];
    } else if (stepName === 'Pack Order') {
      documents = [generateDocument(orderId, 'packing-list')];
    } else if (stepName === 'Generate Shipping') {
      documents = [generateDocument(orderId, 'shipping-label')];
    }

    // Pass the onStatusUpdate callback to sync with order status
    await updateWorkflowStep(orderId, stepId, 'completed', documents, onStatusUpdate);
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getProgressPercentage = (workflow: OrderWorkflow) => {
    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    return (completedSteps / workflow.steps.length) * 100;
  };

  const getStepIcon = (step: WorkflowStep) => {
    if (step.status === 'completed') return CheckCircle;
    if (step.status === 'in-progress') return Clock;
    return Circle;
  };

  const getStepColor = (step: WorkflowStep) => {
    if (step.status === 'completed') return 'text-emerald-400';
    if (step.status === 'in-progress') return 'text-gray-400';
    return 'text-neutral-400';
  };

  if (!workflow) {
    return (
      <Card className="bg-neutral-700/30 border-neutral-600">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Pick/Pack/Ship Workflow</h4>
              <p className="text-xs text-neutral-400">Start automated workflow with FIFO pallet picking</p>
            </div>
            <Button
              onClick={handleStartWorkflow}
              size="sm"
              className="bg-gray-800 hover:bg-gray-900"
              disabled={isStarting || hasExistingWorkflow}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {hasExistingWorkflow ? 'Workflow Exists' : isStarting ? 'Starting...' : 'Start Workflow'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <WorkflowErrorBoundary>
      <Card className="bg-neutral-700/30 border-neutral-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center">
              <Play className="h-4 w-4 mr-2 text-gray-400" />
              Pick/Pack/Ship Workflow
              {workflow.completedAt && (
                <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Completed
                </Badge>
              )}
            </div>
            <div className="text-xs text-neutral-400">
              {workflow.steps.filter(s => s.status === 'completed').length} / {workflow.steps.length} steps
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="w-full">
            <Progress 
              value={getProgressPercentage(workflow)} 
              className="h-2 bg-neutral-600"
              indicatorClassName="bg-gradient-to-r from-gray-700 to-emerald-500" 
            />
          </div>

          {/* Pallet Adjustments Summary */}
          {workflow.palletAdjustments && workflow.palletAdjustments.length > 0 && (
            <div className="bg-neutral-600/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">Auto-Picked from Pallets</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {workflow.palletAdjustments.length} pallet(s)
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPalletDetails(!showPalletDetails)}
                  className="h-6 px-2 text-neutral-400 hover:text-white"
                >
                  {showPalletDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>
              
              {showPalletDetails && (
                <div className="space-y-1">
                  {workflow.palletAdjustments.map((adjustment, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-neutral-700/30 rounded px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-300">Pallet {adjustment.palletId}</span>
                        <ArrowRight className="h-3 w-3 text-neutral-500" />
                        <span className="text-neutral-300">{adjustment.productSku}</span>
                      </div>
                      <div className="text-neutral-400">
                        {adjustment.oldQuantity} → {adjustment.newQuantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pick Instructions Panel */}
          {workflow.pickInstructions && workflow.pickInstructions.length > 0 && (
            <div className="space-y-3">
              <WorkflowErrorBoundary>
                <PickInstructionsPanel
                  orderId={orderId}
                  pickInstructions={workflow.pickInstructions}
                  pickingStrategy={workflow.pickingStrategy}
                  onPickingStrategyChange={handlePickingStrategyChange}
                  onRegenerateInstructions={handleRegenerateInstructions}
                  onMarkItemPicked={handleMarkItemPicked}
                  onValidatePick={handleValidatePick}
                />
              </WorkflowErrorBoundary>
            </div>
          )}

          {/* Workflow Steps */}
          <div className="space-y-2">
            {workflow.steps.map((step, index) => {
              const StepIcon = getStepIcon(step);
              const stepColor = getStepColor(step);
              const canComplete = step.status === 'in-progress' && canCompleteStep(step);
              const hasPermission = canCompleteStep(step);

              return (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-600/30">
                    <div className="flex items-center space-x-3">
                      <StepIcon className={`h-4 w-4 ${stepColor}`} />
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{step.name}</span>
                        {step.roleRequired && (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs h-4 px-1 ${
                                step.roleRequired === 'admin' ? 'border-red-400 text-red-400' :
                                step.roleRequired === 'manager' ? 'border-yellow-400 text-yellow-400' :
                                'border-green-400 text-green-400'
                              }`}
                            >
                              {step.roleRequired}
                            </Badge>
                            {step.assignedTo && (
                              <Badge variant="outline" className="text-xs h-4 px-1 border-gray-500 text-gray-400">
                                assigned
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Timestamp Display */}
                      <div className="flex flex-col text-xs text-neutral-400">
                        {step.startedAt && (
                          <span>Started: {new Date(step.startedAt).toLocaleTimeString()}</span>
                        )}
                        {step.completedAt && (
                          <>
                            <span>Completed: {new Date(step.completedAt).toLocaleTimeString()}</span>
                            {step.startedAt && (
                              <span className="text-emerald-400">
                                Duration: {Math.round((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 60000)}m
                              </span>
                            )}
                          </>
                        )}
                        {step.status === 'in-progress' && step.startedAt && (
                          <span className="text-gray-400">
                            In progress: {Math.round((Date.now() - new Date(step.startedAt).getTime()) / 60000)}m
                          </span>
                        )}
                      </div>
                      {step.status === 'completed' && step.completedBy && (
                        <Badge variant="outline" className="text-xs h-4 px-1 border-emerald-400 text-emerald-400">
                          completed
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {step.documents && step.documents.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 border-neutral-500 bg-neutral-600/30 hover:bg-neutral-500/30"
                          onClick={() => toggleStepExpansion(step.id)}
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {canComplete ? (
                        <Button
                          onClick={() => handleCompleteStep(step.id, step.name)}
                          size="sm"
                          className="h-6 px-3 bg-gray-800 hover:bg-gray-900"
                        >
                          Complete
                        </Button>
                      ) : step.status === 'in-progress' && !hasPermission ? (
                        <Button
                          size="sm"
                          disabled
                          className="h-6 px-3"
                          title={`Requires ${step.roleRequired} role${step.assignedTo ? ' or assignment' : ''}`}
                        >
                          No Permission
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {expandedSteps.has(step.id) && step.documents && (
                    <div className="ml-7 space-y-1">
                      {step.documents.map((doc, docIndex) => (
                        <div key={docIndex} className="flex items-center justify-between p-2 bg-neutral-600/20 rounded text-xs">
                          <span className="text-neutral-300">Document {docIndex + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2"
                            onClick={() => window.open(doc, '_blank')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </WorkflowErrorBoundary>
  );
};

export default OrderWorkflowPanel;
