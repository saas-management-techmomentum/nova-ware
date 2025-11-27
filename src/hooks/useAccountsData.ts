
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AccountType {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type_id: string;
  description?: string;
  current_balance: number;
  opening_balance: number;
  account_type?: AccountType;
}

export const useAccountsData = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccountTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setAccountTypes(data || []);
    } catch (error) {
      console.error('Error fetching account types:', error);
      toast({
        title: 'Error fetching account types',
        description: 'Could not load account types',
        variant: 'destructive',
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          account_type:account_types(*)
        `)
        .eq('is_active', true)
        .order('account_code', { ascending: true });


      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error fetching accounts',
        description: 'Could not load chart of accounts',
        variant: 'destructive',
      });
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    await Promise.all([fetchAccountTypes(), fetchAccounts()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refetch();
  }, []);

  const createAccount = async (accountData: any) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          ...accountData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Account created',
        description: 'New account has been added to your chart of accounts',
      });

      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error creating account',
        description: 'Could not create new account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateAccount = async (accountId: string, accountData: any) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(accountData)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Account updated',
        description: 'Account has been successfully updated',
      });

      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: 'Error updating account',
        description: 'Could not update account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    accounts,
    accountTypes,
    isLoading,
    refetch,
    createAccount,
    updateAccount,
  };
};
