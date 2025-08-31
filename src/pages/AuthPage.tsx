
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const signUpSchema = z.object({
  invitationCode: z.string().min(1, 'Invitation code is required.'),
  firstName: z.string().min(2, 'First name must be at least 2 characters.'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const AuthPage = () => {
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      invitationCode: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSignIn = async (data: SignInFormValues) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
      navigate('/app');
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true);
      
      console.log('Starting signup process...');
      
      await signUp(data.email, data.password, data.firstName, data.lastName, data.companyName, data.invitationCode);
      
      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to confirm your account. Once confirmed, you'll be set up as the company administrator with full permissions.",
      });
      
    } catch (error) {
      console.error('Complete signup error:', error);
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      toast({
        title: 'Password reset email sent!',
        description: 'Please check your email for instructions to reset your password.',
      });
      setShowResetPassword(false);
      resetPasswordForm.reset();
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Reset password failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl transform -translate-y-1/3 translate-x-1/4 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-sky-500/10 rounded-full blur-3xl transform translate-y-1/3 -translate-x-1/4 opacity-30"></div>
      </div>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10 text-white relative z-10">
        <CardHeader className="text-center">
          <img 
            src="/lovable-uploads/dd870201-0ebd-4ec5-9c73-0cf538750747.png" 
            alt="Logo" 
            className="h-16 w-16 mx-auto mb-4 opacity-90"
          />
          <CardTitle className="text-2xl font-bold text-white">Welcome to LogistiX</CardTitle>
          <CardDescription className="text-white/70">
            Advanced warehouse management for modern businesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Create Company
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {!showResetPassword ? (
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="you@example.com" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-logistix-orange hover:bg-logistix-blue text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-sm text-white/70 hover:text-white underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                </Form>
              ) : (
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Reset Password</h3>
                      <p className="text-sm text-white/70">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="you@example.com" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-logistix-orange hover:bg-logistix-blue text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending Reset Email...' : 'Send Reset Email'}
                    </Button>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetPassword(false);
                          resetPasswordForm.reset();
                        }}
                        className="text-sm text-white/70 hover:text-white underline"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </Form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="invitationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Invitation Code</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showInvitationCode ? "text" : "password"}
                              placeholder="Enter your invitation code" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10" 
                            />
                            <button
                              type="button"
                              onClick={() => setShowInvitationCode(!showInvitationCode)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                            >
                              {showInvitationCode ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">First Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signUpForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Doe" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={signUpForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Company Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Acme Inc." 
                            {...field} 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="you@example.com" 
                            {...field} 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10" 
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10" 
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                            >
                              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-sm text-white/90 mb-2">
                      <strong>Admin Account Setup</strong>
                    </div>
                    <div className="text-xs text-white/70">
                      You will be registered as the company administrator with full access to manage warehouses, inventory, and team members. Please check your email after signup to confirm your account.
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-logistix-orange hover:bg-logistix-blue text-white" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
