import React from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowLeft, Building2, Warehouse, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  industry: z.string().min(2, {
    message: "Industry must be at least 2 characters.",
  }),
  contactFirstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  contactLastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  contactEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  contactPhone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  addressLine1: z.string().min(5, {
    message: "Address should be at least 5 characters.",
  }),
  addressLine2: z.string().optional(),
  city: z.string().min(2, {
    message: "City is required.",
  }),
  state: z.string().min(2, {
    message: "State is required.",
  }),
  postalCode: z.string().min(5, {
    message: "Postal code is required.",
  }),
  warehouseSize: z.string().min(1, {
    message: "Warehouse size is required.",
  }),
  employeeCount: z.string().min(1, {
    message: "Employee count is required.",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const OnboardingPage = () => {
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      contactFirstName: "",
      contactLastName: "",
      contactEmail: "",
      contactPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      warehouseSize: "",
      employeeCount: "",
      notes: "",
    },
  });

  function onSubmit(data: FormValues) {
    toast("Account setup initiated", {
      description: "We'll review your information and contact you shortly.",
    });
    
    setTimeout(() => navigate('/'), 1500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/landing" className="flex items-center text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Landing Page
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-md p-8">
              <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
              <p className="text-slate-400 mb-8">Fill out the form below to set up your warehouse management system</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Company Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Building2 className="h-5 w-5" />
                      <h2 className="text-xl font-semibold">Company Information</h2>
                    </div>
                    <Separator className="bg-slate-700" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Company Name*</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Logistics Inc." 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Industry*</FormLabel>
                            <FormControl>
                              <Input placeholder="Retail, Manufacturing, etc." 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Primary Contact */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Users className="h-5 w-5" />
                      <h2 className="text-xl font-semibold">Primary Contact</h2>
                    </div>
                    <Separator className="bg-slate-700" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="contactFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">First Name*</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Last Name*</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Email*</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Phone Number*</FormLabel>
                            <FormControl>
                              <Input placeholder="(123) 456-7890" 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Company Address */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Building2 className="h-5 w-5" />
                      <h2 className="text-xl font-semibold">Company Address</h2>
                    </div>
                    <Separator className="bg-slate-700" />
                    
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Address Line 1*</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Address Line 2</FormLabel>
                            <FormControl>
                              <Input placeholder="Suite 200" 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-slate-500">Optional</FormDescription>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300">City*</FormLabel>
                              <FormControl>
                                <Input 
                                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage className="text-rose-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300">State/Province*</FormLabel>
                              <FormControl>
                                <Input 
                                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage className="text-rose-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300">Postal Code*</FormLabel>
                              <FormControl>
                                <Input 
                                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage className="text-rose-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Warehouse Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Warehouse className="h-5 w-5" />
                      <h2 className="text-xl font-semibold">Warehouse Details</h2>
                    </div>
                    <Separator className="bg-slate-700" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="warehouseSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Warehouse Size (sq ft)*</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="employeeCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Number of Employees*</FormLabel>
                            <FormControl>
                              <Input 
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-rose-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Additional Notes */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-indigo-400">Additional Notes</h2>
                    <Separator className="bg-slate-700" />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Tell us about your warehouse operations or specific requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share any additional information that might help us customize your experience..." 
                              className="h-32 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-slate-500">Optional</FormDescription>
                          <FormMessage className="text-rose-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-indigo-500/20 transition-all"
                  >
                    Submit Application
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          
          {/* Benefits/Info Column */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Account Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Real-time inventory tracking across multiple warehouses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Streamlined order processing and fulfillment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Automated low stock alerts and reordering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Detailed reporting and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Mobile access for on-the-go management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">What Happens Next?</h3>
                <ol className="space-y-3 list-decimal pl-5 text-slate-300">
                  <li>Our team reviews your application</li>
                  <li>We'll contact you to confirm details</li>
                  <li>Your account will be set up within 24 hours</li>
                  <li>You'll receive login credentials</li>
                  <li>Schedule an optional onboarding call</li>
                </ol>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Need Help?</h3>
                <p className="mb-4 text-slate-300">If you have any questions about the application process or our services, please contact our support team.</p>
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-slate-300">Email:</span>
                  <span className="text-indigo-400">support@cargocommand.com</span>
                  <span className="font-medium text-slate-300 mt-2">Phone:</span>
                  <span className="text-indigo-400">(800) 123-4567</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
