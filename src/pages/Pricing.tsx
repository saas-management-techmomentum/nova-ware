import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Home, Mail } from 'lucide-react';

const Pricing = () => {
  const features = [
    'Unlimited SKUs',
    'Unlimited transactions',
    'Advanced warehouse automation suite',
    '24/7 premium support',
    'Unlimited user accounts',
    'Custom reporting & dashboards',
    'API access & integrations',
    'Multi-warehouse support',
    'AI-powered analytics',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 to-neutral-900">
      <div className="space-y-8 animate-fade-in p-6 max-w-5xl mx-auto">
        
        {/* Home Button */}
        <div className="flex justify-start">
          <Button 
            asChild
            variant="ghost" 
            className="text-neutral-300 hover:text-white hover:bg-neutral-800/50"
          >
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
            Pricing
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            We offer flexible, fully customizable pricing tailored to your warehouse operations.
          </p>
        </div>

        {/* Single Customized Pricing Card */}
        <div className="flex justify-center">
          <Card className="bg-neutral-800/50 backdrop-blur-md border border-neutral-700/50 shadow-xl w-full max-w-lg p-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-600 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">Custom Enterprise Plan</CardTitle>
              <CardDescription className="text-neutral-400">
                Built to match your exact warehouse needs.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Contact Button */}
              <Button
                className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:opacity-90 text-white transition-all duration-200 hover:shadow-lg"
                onClick={() => window.location.href = "mailto:contact@unsynth.ai"}
              >
                Contact Us to Schedule Pricing
              </Button>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-medium text-white">What's Included:</h4>
                <ul className="space-y-2">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-neutral-300">
                      <Check className="h-4 w-4 text-neutral-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
