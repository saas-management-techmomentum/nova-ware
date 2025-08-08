
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  DollarSign, 
  Star,
  Home
} from 'lucide-react';

// Pricing tiers data
const pricingTiers = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    color: 'from-blue-600 to-indigo-600',
    popular: false,
    features: [
      'Up to 500 SKUs',
      '1,000 transactions/month',
      'Basic inventory tracking',
      'Email support',
      '2 user accounts',
      'Standard reporting',
      'Mobile app access'
    ],
    limits: {
      skus: 500,
      transactions: 1000,
      users: 2,
      storage: '10 GB'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing businesses with advanced needs',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    color: 'from-purple-600 to-indigo-600',
    popular: true,
    features: [
      'Up to 2,500 SKUs',
      '5,000 transactions/month',
      'Advanced inventory tracking',
      'Priority email & phone support',
      '10 user accounts',
      'Advanced reporting & analytics',
      'API access',
      'Custom integrations',
      'Predictive inventory',
      'Low stock alerts'
    ],
    limits: {
      skus: 2500,
      transactions: 5000,
      users: 10,
      storage: '50 GB'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large operations requiring maximum flexibility',
    monthlyPrice: 1299,
    yearlyPrice: 12990,
    color: 'from-emerald-600 to-teal-600',
    popular: false,
    features: [
      'Unlimited SKUs',
      'Unlimited transactions',
      'Full warehouse management suite',
      '24/7 dedicated support',
      'Unlimited user accounts',
      'Custom reporting & dashboards',
      'Full API access',
      'White-label options',
      'Advanced analytics & BI',
      'Multi-warehouse support',
      'Custom workflows',
      'SLA guarantees'
    ],
    limits: {
      skus: 'Unlimited',
      transactions: 'Unlimited',
      users: 'Unlimited',
      storage: '500 GB'
    }
  }
];

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const formatPrice = (monthlyPrice: number, yearlyPrice: number) => {
    if (billingCycle === 'monthly') {
      return `$${monthlyPrice}`;
    }
    const monthlySavings = monthlyPrice * 12 - yearlyPrice;
    return `$${Math.round(yearlyPrice / 12)}`;
  };

  const getSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlySavings = monthlyPrice * 12 - yearlyPrice;
    return Math.round((monthlySavings / (monthlyPrice * 12)) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
        {/* Home Button */}
        <div className="flex justify-start">
          <Button 
            asChild
            variant="ghost" 
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Pricing Plans
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Choose the perfect plan for your warehouse management needs. Scale up or down anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4 bg-slate-800/50 backdrop-blur-md p-1 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 bg-emerald-600 text-white">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 ${
                tier.popular ? 'ring-2 ring-indigo-500/50' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 text-sm font-medium">
                  <Star className="inline h-4 w-4 mr-1" />
                  Most Popular
                </div>
              )}
              
              <CardHeader className={tier.popular ? 'pt-12' : 'pt-6'}>
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-slate-400">{tier.description}</CardDescription>
                
                <div className="pt-4">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">
                      {formatPrice(tier.monthlyPrice, tier.yearlyPrice)}
                    </span>
                    <span className="text-slate-400 ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-emerald-400 text-sm mt-1">
                      Save {getSavings(tier.monthlyPrice, tier.yearlyPrice)}% annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button 
                  className={`w-full bg-gradient-to-r ${tier.color} hover:opacity-90 text-white transition-all duration-200 hover:shadow-lg`}
                >
                  {tier.popular ? 'Start Free Trial' : 'Get Started'}
                </Button>

                <div className="space-y-3">
                  <h4 className="font-medium text-white">Features included:</h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-slate-300">
                        <Check className="h-4 w-4 text-emerald-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <h4 className="font-medium text-white mb-3">Plan Limits:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">SKUs:</span>
                      <span className="text-white ml-2">{tier.limits.skus}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Users:</span>
                      <span className="text-white ml-2">{tier.limits.users}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Transactions:</span>
                      <span className="text-white ml-2">{tier.limits.transactions}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Storage:</span>
                      <span className="text-white ml-2">{tier.limits.storage}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-2">Can I change my plan anytime?</h4>
                <p className="text-slate-400 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Is there a setup fee?</h4>
                <p className="text-slate-400 text-sm">
                  No setup fees for any of our software plans. Get started immediately with no hidden costs.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">What payment methods do you accept?</h4>
                <p className="text-slate-400 text-sm">
                  We accept all major credit cards, ACH transfers, and wire transfers for enterprise clients.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Do you offer custom integrations?</h4>
                <p className="text-slate-400 text-sm">
                  Yes, Professional and Enterprise plans include API access and custom integration support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pricing;
