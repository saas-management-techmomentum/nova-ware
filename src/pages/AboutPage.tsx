
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Package,
  BarChart3,
  Users,
  MapPin,
  Truck,
  FileText,
  Zap,
  Shield,
  Database,
  Home,
  CheckCircle,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AboutPage = () => {
  const coreFeatures = [
    {
      icon: <Package className="h-8 w-8 text-neutral-400" />,
      title: "Advanced Inventory Management",
      description: "Real-time stock tracking with batch management, expiration date monitoring, barcode scanning, and automated low-stock alerts. Support for multiple pricing tiers and cost tracking."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-neutral-400" />,
      title: "Comprehensive Analytics",
      description: "Built-in dashboard with warehouse efficiency metrics, order processing analytics, inventory accuracy tracking, and predictive inventory insights powered by machine learning."
    },
    {
      icon: <Users className="h-8 w-8 text-neutral-400" />,
      title: "Multi-User Workflow Management",
      description: "Role-based access control with company and warehouse-level permissions. Task assignment, employee management, and collaborative order processing workflows."
    },
    {
      icon: <MapPin className="h-8 w-8 text-neutral-400" />,
      title: "Smart Location Management",
      description: "Pallet-based location tracking with automatic optimization suggestions. Visual warehouse layout management and efficient pick path routing."
    },
    {
      icon: <Truck className="h-8 w-8 text-neutral-400" />,
      title: "Intelligent Shipping",
      description: "Automated shipment scheduling, receiving management, and real-time tracking. Integration-ready for major shipping carriers."
    },
    {
      icon: <FileText className="h-8 w-8 text-neutral-400" />,
      title: "Financial Integration",
      description: "Complete accounting integration with automatic journal entries, invoice generation, billing management, and financial reporting for warehouse operations."
    }
  ];

  const keyMetrics = [
    {
      icon: <TrendingUp className="h-6 w-6 text-neutral-400" />,
      title: "Real-Time Analytics",
      description: "Live warehouse efficiency tracking with historical comparisons"
    },
    {
      icon: <Clock className="h-6 w-6 text-neutral-400" />,
      title: "Workflow Automation",
      description: "Automated order processing with step-by-step workflow tracking"
    },
    {
      icon: <Target className="h-6 w-6 text-neutral-400" />,
      title: "Predictive Insights",
      description: "AI-powered inventory forecasting and demand prediction"
    },
    {
      icon: <Shield className="h-6 w-6 text-neutral-400" />,
      title: "Enterprise Security",
      description: "Row-level security with multi-tenant architecture"
    }
  ];

  const faqs = [
    {
      question: "What types of businesses is LogistiX designed for?",
      answer: "LogistiX is built for businesses that need comprehensive warehouse management - from small distribution centers to large multi-warehouse operations. It's particularly effective for companies managing complex inventory with batch tracking, expiration dates, and multiple client requirements."
    },
    {
      question: "How does the multi-company architecture work?",
      answer: "LogistiX supports true multi-tenant operations where users can be assigned to multiple companies and warehouses with different permission levels. Each company's data is completely isolated while allowing for corporate-level oversight when needed."
    },
    {
      question: "What inventory tracking methods are supported?",
      answer: "The system supports SKU-based tracking, batch management with expiration dates, barcode scanning, pallet-based location management, and both FIFO and FEFO allocation strategies depending on your product requirements."
    },
    {
      question: "How does the workflow system work?",
      answer: "Our workflow engine automatically guides users through order processing steps - from picking to packing to shipping. Each step is tracked with timestamps, user assignments, and can include document attachments and quality checks."
    },
    {
      question: "What financial features are included?",
      answer: "LogistiX includes complete accounting integration with automatic journal entries, invoice generation with customizable templates, billing rate management, expense tracking, and comprehensive financial reporting - all tied directly to warehouse operations."
    },
    {
      question: "Can I track performance metrics?",
      answer: "Yes, the system provides detailed analytics including warehouse efficiency metrics, task completion rates, order processing speeds, inventory accuracy measurements, and predictive analytics for demand forecasting."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-neutral-500/5 rounded-full blur-3xl transform -translate-y-1/3 translate-x-1/4 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-neutral-500/5 rounded-full blur-3xl transform translate-y-1/3 -translate-x-1/4 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neutral-500/3 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-neutral-900/90 to-neutral-800/90 backdrop-blur-sm py-16 px-6 border-b border-neutral-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button 
              asChild 
              variant="ghost" 
              className="text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200"
            >
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-neutral-200 to-neutral-300 bg-clip-text text-transparent mb-6">
              About LogistiX
            </h1>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Advanced warehouse management software designed for modern businesses. 
              Streamline operations, track inventory intelligently, and scale your business with confidence.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Key Metrics Overview */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Built for Performance
              </h2>
              <p className="text-lg text-neutral-300">
                Real-time insights and automation that drive results
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {keyMetrics.map((metric, index) => (
                <Card key={index} className="bg-neutral-800/50 border-neutral-700 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 bg-neutral-700/50 rounded-full group-hover:bg-neutral-700 transition-colors duration-300">
                        {metric.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{metric.title}</h3>
                    <p className="text-neutral-300 text-sm">{metric.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 px-6 bg-neutral-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Comprehensive Warehouse Management
              </h2>
              <p className="text-lg text-neutral-300">
                Everything you need to run an efficient, modern warehouse operation
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreFeatures.map((feature, index) => (
                <Card key={index} className="bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800/60 transition-all duration-300 hover:shadow-xl hover:shadow-neutral-500/10 group">
                  <CardHeader>
                    <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Modern Technology Stack
              </h2>
              <p className="text-lg text-neutral-300">
                Built with cutting-edge technologies for reliability and performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-neutral-800/40 border-neutral-700 text-center">
                <CardHeader>
                  <Database className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <CardTitle className="text-white">Real-Time Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-300">
                    Powered by Supabase with PostgreSQL for enterprise-grade data management, 
                    real-time subscriptions, and row-level security.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-neutral-800/40 border-neutral-700 text-center">
                <CardHeader>
                  <Zap className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <CardTitle className="text-white">High Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-300">
                    React-based frontend with optimized queries, intelligent caching, 
                    and responsive design for desktop and mobile use.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-neutral-800/40 border-neutral-700 text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <CardTitle className="text-white">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-300">
                    Multi-tenant architecture with role-based access control, 
                    data isolation, and comprehensive audit trails.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 bg-neutral-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-neutral-300">
                Learn more about LogistiX's capabilities and features
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-neutral-700">
                  <AccordionTrigger className="text-left text-lg font-medium text-white hover:text-neutral-300 transition-colors duration-200">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-300 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-neutral-900/90 to-neutral-800/90 backdrop-blur-sm py-16 px-6 text-white border-t border-neutral-700/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Transform Your Warehouse Operations?
            </h2>
            <p className="text-xl mb-8 text-neutral-300">
              Experience the power of modern warehouse management with LogistiX's comprehensive platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-neutral-800 text-white hover:bg-neutral-700 transition-all duration-200 hover:scale-105">
                <Link to="/app">Get Started Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all duration-200">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-neutral-950 text-white py-8 px-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-neutral-400 mr-2" />
            <div className="text-xl font-bold">LogistiX</div>
          </div>
          <div className="text-neutral-400 text-sm">
            &copy; {new Date().getFullYear()} LogistiX. Advanced Warehouse Management Software.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
