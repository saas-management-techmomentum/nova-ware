
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Check, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentExpectedDateEditorProps {
  shipmentId: string;
  currentDate: string;
  onDateUpdated: () => void;
}

export const ShipmentExpectedDateEditor: React.FC<ShipmentExpectedDateEditorProps> = ({
  shipmentId,
  currentDate,
  onDateUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(currentDate);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveDate = async () => {
    if (!editDate) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ expected_date: editDate })
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: "Expected Date Updated",
        description: `Expected arrival date has been updated to ${new Date(editDate).toLocaleDateString()}`,
      });

      setIsEditing(false);
      onDateUpdated();
    } catch (error) {
      console.error('Error updating expected date:', error);
      toast({
        title: "Error",
        description: "Failed to update expected date",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditDate(currentDate);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          className="h-8 w-auto text-xs bg-slate-700/50 border-slate-600"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-green-600/20"
          onClick={handleSaveDate}
          disabled={isLoading}
        >
          <Check className="h-4 w-4 text-green-400" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-600/20"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 text-red-400" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-400" />
      <span className="text-slate-300">
        {new Date(currentDate).toLocaleDateString()}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-slate-600"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-3 w-3 text-slate-400" />
      </Button>
    </div>
  );
};
