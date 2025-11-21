
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  role: z.enum(['admin', 'manager', 'employee'], {
    required_error: "Please select a role",
  })
});

type FormValues = z.infer<typeof formSchema>;

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const RoleSelectionDialog = ({ open, onOpenChange, userId }: RoleSelectionDialogProps) => {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "employee"
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      let userIdToUse = userId;
      
      // If userId is not provided, get the current user
      if (!userIdToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Error",
            description: "No user found. Please try signing up again.",
            variant: "destructive",
          });
          return;
        }
        
        userIdToUse = user.id;
      }

      // Check if user role exists in company_users table
      const { data: existingRole } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', userIdToUse as any)
        .single();

      let error;
      
      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('company_users')
          .update({ role: data.role } as any)
          .eq('user_id', userIdToUse as any);
          
        error = updateError;
      } else {
        // Insert new role - we need a company_id, for now we'll create a default company
        // First, check if a default company exists or create one
        let { data: company } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .single();

        if (!company) {
          // Create a default company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert([{ name: 'Default Company' } as any])
            .select('id')
            .single();
          
          if (companyError) throw companyError;
          company = newCompany;
        }

        // Safely access company id
        const companyId = company && typeof company === 'object' && 'id' in company ? company.id : null;
        if (!companyId) {
          throw new Error('Failed to get company ID');
        }

        const { error: insertError } = await supabase
          .from('company_users')
          .insert([{ 
            user_id: userIdToUse, 
            role: data.role,
            company_id: companyId
          } as any]);
          
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Role selected successfully!",
        description: "You will be redirected to the dashboard.",
      });

      onOpenChange(false);
      navigate('/');
    } catch (error) {
      console.error('Error setting user role:', error);
      toast({
        title: "Error",
        description: "Failed to set user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Choose your role in the organization. This will determine your access level and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="admin" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Admin - Full access to all features and company management
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="manager" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Manager - Full access to warehouse management capabilities
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="employee" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Employee - Access to essential features for daily operations
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;
