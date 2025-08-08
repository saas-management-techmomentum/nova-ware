
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WarehouseFormData } from '@/hooks/useWarehouseCreation';

interface WarehouseFormProps {
  form: UseFormReturn<WarehouseFormData>;
  onSubmit: (data: WarehouseFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({
  form,
  onSubmit,
  isLoading,
  onCancel
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Warehouse name is required' }}
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Warehouse Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Main Warehouse"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="code"
            rules={{ 
              required: 'Warehouse code is required',
              pattern: {
                value: /^[A-Z0-9]+$/,
                message: 'Code must contain only uppercase letters and numbers'
              }
            }}
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Warehouse Code</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="WH001"
                    className="bg-slate-700 border-slate-600 text-white"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-slate-400">
                  Must be unique. Use uppercase letters and numbers only.
                </p>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="123 Industrial Ave"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Los Angeles"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="CA"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="90210"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="(555) 123-4567"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="email"
                    placeholder="warehouse@company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? 'Adding...' : 'Add Warehouse'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WarehouseForm;
