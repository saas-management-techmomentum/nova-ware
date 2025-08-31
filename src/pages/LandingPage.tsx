
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Package, 
  BarChart3,
  Users,
  MapPin,
  Truck,
  Calculator,
  Database,
  Clock,
  CheckCircle2,
  TrendingUp,
  Building2,
  Shield,
  Zap,
  Eye,
  Globe,
  Calendar,
  Star,
  Target,
  Monitor,
  Boxes
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WarehouseSphere from '@/components/WarehouseSphere';

const LandingPage = () => {
  const coreFeatures = [
    {
      icon: Zap,
      title: "Real-Time Inventory Tracking",
      description: "Monitor stock movements instantly across all locations"
    },
    {
      icon: Globe,
      title: "Multi-Warehouse & Multi-Company Support",
      description: "Manage multiple facilities and organizations seamlessly"
    },
    {
      icon: Calculator,
      title: "Integrated Financial Management",
      description: "Built-in invoicing, billing, and accounting workflows"
    },
    {
      icon: Boxes,
      title: "Batch & Pallet Location Control",
      description: "Precise tracking of inventory down to specific locations"
    },
    {
      icon: Truck,
      title: "Pick-Pack-Ship Order Workflow",
      description: "Streamlined order fulfillment from start to finish"
    },
    {
      icon: Shield,
      title: "Role-Based Access & Security",
      description: "Granular permissions and enterprise-grade security"
    },
    {
      icon: Monitor,
      title: "Live Analytics Dashboard",
      description: "Real-time insights and performance metrics"
    },
    {
      icon: Users,
      title: "Employee Management",
      description: "Manage warehouse staff, roles, and task assignments efficiently"
    }
  ];

  const visualFeatures = [
    {
      title: "Track Everything in Real-Time",
      description: "See stock move as it happens, from receiving to shipping. Monitor inventory levels, track product movements, and get instant alerts when stock levels reach critical thresholds.",
      highlight: "Real-time visibility"
    },
    {
      title: "Optimize Order Fulfillment", 
      description: "Custom workflows and live updates to eliminate bottlenecks. Streamline pick-pack-ship processes with automated task assignments and progress tracking.",
      highlight: "Zero bottlenecks"
    },
    {
      title: "Financials You Can Trust",
      description: "Built-in invoicing, ledger, and COGS tracking. Automatically generate accurate invoices, track costs, and maintain complete financial records integrated with your warehouse operations.",
      highlight: "Integrated accounting"
    }
  ];

  const analyticsKPIs = [
    { title: "Order Processing Speed", value: "2.3x", trend: "faster", color: "text-green-400" },
    { title: "Inventory Accuracy", value: "99.8%", trend: "accuracy", color: "text-blue-400" },
    { title: "Warehouse Throughput", value: "+47%", trend: "increase", color: "text-purple-400" },
    { title: "Cost Reduction", value: "32%", trend: "savings", color: "text-indigo-400" }
  ];

  const testimonials = [
    {
      quote: "LogistiX revolutionized our warehouse operations. We've seen a 45% improvement in order processing speed and perfect inventory accuracy.",
      author: "Sarah Chen",
      role: "Operations Director",
      company: "SupplyChain Pro"
    },
    {
      quote: "The real-time visibility and integrated financial tools have been game-changers for our multi-location distribution network.",
      author: "Michael Rodriguez", 
      role: "Logistics Manager",
      company: "FastFlow Logistics"
    }
  ];

  const capabilities = [
    {
      category: "Inventory",
      items: [
        "Product catalog with SKU, UPC tracking",
        "Batch management and expiration dates",
        "Low-stock threshold alerts",
        "Inventory transaction history"
      ]
    },
    {
      category: "Operations",
      items: [
        "Multi-warehouse management",
        "Pallet and location tracking",
        "Order workflow processing",
        "Real-time inventory updates"
      ]
    },
    {
      category: "Analytics",
      items: [
        "Warehouse efficiency metrics",
        "Order processing reports",
        "Inventory accuracy tracking",
        "Performance dashboards"
      ]
    }
  ];

  const techStack = [
    { name: "React", description: "Modern web interface" },
    { name: "Supabase", description: "Real-time database" },
    { name: "PostgreSQL", description: "Reliable data storage" },
    { name: "TypeScript", description: "Type-safe development" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-indigo-500/20 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                LogistiX
              </span>
              <Badge className="bg-gradient-to-r from-orange-600 to-blue-600 text-white border-0 ml-2">
                WMS
              </Badge>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/pricing" className="text-slate-300 hover:text-white transition-all duration-300 font-medium">
                Pricing
              </Link>
              <Link to="/about" className="text-slate-300 hover:text-white transition-all duration-300 font-medium">
                About
              </Link>
              <Link to="/auth" className="text-slate-300 hover:text-white transition-all duration-300 font-medium">
                Sign In
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white border-0 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <WarehouseSphere />
        
        <div className="w-full px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center space-y-8 max-w-6xl mx-auto">
            <div className="space-y-6">
              <Badge className="bg-gradient-to-r from-orange-600 to-blue-600 text-white border-0 px-6 py-2 text-base rounded-full shadow-lg">
                <Package className="h-5 w-5 mr-2" />
                Advanced Warehouse Management
              </Badge>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
                  Streamline.
                </span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-blue-400 to-orange-400 bg-clip-text text-transparent">
                  Optimize.
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
                  Scale.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                LogistiX is next-generation warehouse management software designed for 
                <span className="text-transparent bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text font-semibold"> efficiency, control, and growth</span> — 
                across every warehouse you operate.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white border-0 px-12 py-6 text-lg rounded-2xl font-semibold shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105">
                  <Calendar className="mr-3 h-6 w-6" />
                  Request a Demo
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-600 hover:border-indigo-500/50 px-12 py-6 text-lg rounded-2xl font-semibold transition-all duration-300">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">Peak Performance</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Powerful functionality designed for speed, accuracy, and control.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="bg-slate-900/20 border-slate-700/30 backdrop-blur-xl hover:bg-slate-800/30 hover:border-indigo-500/40 transition-all duration-500 group">
                <CardContent className="p-8">
                  <div className="h-16 w-16 bg-gradient-to-r from-orange-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Feature Walkthrough */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See LogistiX in <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">Action</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Discover how our WMS transforms warehouse operations with real-world scenarios.
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto space-y-32">
            {visualFeatures.map((feature, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={`space-y-8 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <Badge className="bg-gradient-to-r from-orange-600/20 to-blue-600/20 text-orange-300 border-orange-500/30 px-4 py-2">
                    {feature.highlight}
                  </Badge>
                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <Button className="bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white border-0 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="bg-slate-900/20 border border-slate-700/30 backdrop-blur-xl rounded-3xl p-8 hover:bg-slate-800/30 hover:border-indigo-500/40 transition-all duration-500">
                    <div className="aspect-video bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-slate-900/50 rounded-2xl flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                          <Monitor className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-slate-400">Interactive Demo Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics & Business Insights */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Data-Driven Decisions <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Start Here</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Transform raw data into actionable insights with comprehensive analytics and real-time reporting.
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {analyticsKPIs.map((kpi, index) => (
                <Card key={index} className="bg-slate-900/20 border-slate-700/30 backdrop-blur-xl hover:bg-slate-800/30 hover:border-indigo-500/40 transition-all duration-500">
                  <CardContent className="p-6 text-center">
                    <div className={`text-3xl font-bold ${kpi.color} mb-2`}>
                      {kpi.value}
                    </div>
                    <div className="text-white font-semibold mb-1">{kpi.title}</div>
                    <div className="text-slate-400 text-sm">{kpi.trend}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Dashboard Preview */}
            <Card className="bg-slate-900/20 border-slate-700/30 backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="aspect-video bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-slate-900/30 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="h-20 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Live Analytics Dashboard</h3>
                      <p className="text-slate-400">Real-time insights, trend analysis, and performance metrics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">Industry Leaders</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-900/20 border-slate-700/30 backdrop-blur-xl hover:bg-slate-800/30 hover:border-indigo-500/40 transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-slate-300 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="space-y-1">
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                    <div className="text-sm text-indigo-400">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What You Can <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Accomplish</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Comprehensive warehouse management capabilities built for modern operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {capabilities.map((category, index) => (
              <Card key={index} className="bg-slate-900/20 border-slate-700/30 backdrop-blur-xl hover:bg-slate-800/30 hover:border-indigo-500/40 transition-all duration-500">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-6">
                    {category.category}
                  </h3>
                  <ul className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built with <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Modern Technology</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Reliable, scalable, and secure technology stack for enterprise operations.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {techStack.map((tech, index) => (
              <div key={index} className="text-center">
                <div className="bg-slate-900/20 border border-slate-700/30 backdrop-blur-xl rounded-2xl p-6 hover:bg-slate-800/30 hover:border-indigo-500/40 transition-all duration-300">
                  <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-2">
                    {tech.name}
                  </div>
                  <div className="text-slate-400">{tech.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-32 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent"></div>
        </div>
        <div className="w-full text-center px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <Badge className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 border-indigo-500/30 px-6 py-3 text-lg rounded-full">
              <Target className="h-5 w-5 mr-2" />
              Upgrade Your Warehouse with LogistiX
            </Badge>
            
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Start Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Transformation</span> Today
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Join businesses that have revolutionized their warehouse operations with our comprehensive management system. Let's talk.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button size="lg" className="bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white border-0 px-12 py-6 text-lg rounded-2xl font-semibold shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105">
                <Calendar className="mr-3 h-6 w-6" />
                Book a Demo
              </Button>
              <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-600 hover:border-indigo-500/50 px-12 py-6 text-lg rounded-2xl font-semibold transition-all duration-300">
                <TrendingUp className="mr-3 h-6 w-6" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-indigo-500/20 bg-slate-950/90 backdrop-blur-xl">
        <div className="w-full px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                    LogistiX
                  </span>
                  <Badge className="bg-gradient-to-r from-orange-600/20 to-blue-600/20 text-orange-300 border-orange-500/30">
                    WMS
                  </Badge>
                </div>
                <p className="text-slate-400 max-w-md leading-relaxed">
                  Next-generation warehouse management system designed for efficiency, control, and growth across every warehouse you operate.
                </p>
                
                {/* Email Capture */}
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Stay updated on LogistiX releases</h4>
                  <div className="flex max-w-md">
                    <input 
                      type="email" 
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-l-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                    <Button className="bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white border-0 px-6 py-3 rounded-r-xl font-semibold">
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="space-y-6">
                <h4 className="text-white font-semibold text-lg">Product</h4>
                <div className="space-y-3">
                  <Link to="/features" className="block text-slate-400 hover:text-indigo-400 transition-colors">Features</Link>
                  <Link to="/pricing" className="block text-slate-400 hover:text-indigo-400 transition-colors">Pricing</Link>
                  <Link to="/integrations" className="block text-slate-400 hover:text-indigo-400 transition-colors">Integrations</Link>
                  <Link to="/security" className="block text-slate-400 hover:text-indigo-400 transition-colors">Security</Link>
                </div>
              </div>
              
              {/* Support Links */}
              <div className="space-y-6">
                <h4 className="text-white font-semibold text-lg">Support</h4>
                <div className="space-y-3">
                  <Link to="/about" className="block text-slate-400 hover:text-indigo-400 transition-colors">About</Link>
                  <div className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer">Contact</div>
                  <div className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer">Documentation</div>
                  <div className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer">Privacy Policy</div>
                </div>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-slate-500">
                  &copy; 2024 LogistiX. Advanced Warehouse Management System for modern operations.
                </p>
                <div className="flex space-x-6">
                  <div className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                    LinkedIn
                  </div>
                  <div className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                    Twitter
                  </div>
                  <div className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                    GitHub
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
