
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
      description:
        "See stock move as it happens, from receiving to shipping. Monitor inventory levels, track movements, and get instant alerts when stock is low.",
      highlight: "Real-time visibility",
      image: "/uploads/Screenshot_1.png"
    },
    {
      title: "Optimize Order Fulfillment",
      description:
        "Custom workflows and live updates streamline pick-pack-ship processes with automated task assignments.",
      highlight: "Zero bottlenecks",
      image: "/uploads/Screenshot_2.png"
    },
    {
      title: "Financials You Can Trust",
      description:
        "Built-in invoicing, ledger, and COGS tracking with automatic generation of accurate financial records.",
      highlight: "Integrated accounting",
      image: "/uploads/Screenshot_3.png"
    }
  ];


  const analyticsKPIs = [
    { title: "Order Processing Speed", value: "2.3x", trend: "faster", color: "text-green-400" },
    { title: "Inventory Accuracy", value: "99.8%", trend: "accuracy", color: "text-blue-400" },
    { title: "Warehouse Throughput", value: "+47%", trend: "increase", color: "text-neutral-300" },
    { title: "Cost Reduction", value: "32%", trend: "savings", color: "text-neutral-300" }
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
    { name: "Modern web interface", description: "" },
    { name: "Real-time database", description: "" },
    { name: "Reliable data storage", description: "" },
    { name: "Type-safe development", description: "" }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-neutral-800 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                LogistiX - WMS
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/pricing" className="text-neutral-300 hover:text-white transition-all duration-300 font-medium">
                Pricing
              </Link>
              <Link to="/about" className="text-neutral-300 hover:text-white transition-all duration-300 font-medium">
                About
              </Link>
              <Link to="/auth" className="text-neutral-300 hover:text-white transition-all duration-300 font-medium">
                Sign In
              </Link>
              <Link to="/auth">
                <Button className="bg-white hover:bg-neutral-100 text-black border-0 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300">
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
              <Badge className="bg-neutral-800 text-neutral-200 border-0 px-6 py-2 text-base rounded-full shadow-lg">
                <Package className="h-5 w-5 mr-2" />
                Warehouse Management System
              </Badge>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="text-white">
                  Modern Warehouse
                </span>
                <br />
                <span className="text-neutral-200">
                  Management.
                </span>
                <br />
                <span className="text-neutral-300">
                  Real-Time Precision.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">
                LogistiX is a next-generation WMS designed for
                <span className="text-neutral-100 font-semibold"> speed, accuracy, and control</span> —
                across every warehouse you manage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button onClick={() => window.location.href = "mailto:contact@unsynth.ai"} size="lg" className="bg-white hover:bg-neutral-100 text-black border-0 px-12 py-6 text-lg rounded-2xl font-semibold shadow-2xl transition-all duration-300 transform">
                <Calendar className="mr-3 h-6 w-6" />
                Request a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for <span className="text-neutral-200">High-Performance Operations</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Powerful functionality designed for speed, accuracy, and control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="bg-neutral-900/20 border-neutral-700/30 backdrop-blur-xl hover:bg-neutral-800/30 hover:border-neutral-600 transition-all duration-500 group">
                <CardContent className="p-8">
                  <div className="h-16 w-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Feature Walkthrough */}
      {/* Visual Feature Walkthrough */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See LogistiX in <span className="text-neutral-200">Action</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Discover how our WMS transforms warehouse operations with real-world scenarios.
            </p>
          </div>

          <div className="max-w-7xl mx-auto space-y-32">
            {visualFeatures.map((feature, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
                  }`}
              >
                <div className={`space-y-8 ${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                  <Badge className="bg-neutral-800/50 text-neutral-300 border-neutral-600 px-4 py-2">
                    {feature.highlight}
                  </Badge>

                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {feature.title}
                  </h3>

                  <p className="text-lg text-neutral-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className={`${index % 2 === 1 ? "lg:col-start-1" : ""}`}>
                  <div className="bg-neutral-900/20 border border-neutral-700/30 backdrop-blur-xl rounded-3xl p-8 hover:bg-neutral-800/30 hover:border-neutral-600 transition-all duration-500">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-900/50">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
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
              Data-Driven Decisions <span className="text-neutral-200">Start Here</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Transform raw data into actionable insights with comprehensive analytics and real-time reporting.
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {analyticsKPIs.map((kpi, index) => (
                <Card key={index} className="bg-neutral-900/20 border-neutral-700/30 backdrop-blur-xl hover:bg-neutral-800/30 hover:border-neutral-600 transition-all duration-500">
                  <CardContent className="p-6 text-center">
                    <div className={`text-3xl font-bold ${kpi.color} mb-2`}>
                      {kpi.value}
                    </div>
                    <div className="text-white font-semibold mb-1">{kpi.title}</div>
                    <div className="text-neutral-400 text-sm">{kpi.trend}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 relative">
        <div className="w-full px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What You Can <span className="text-neutral-200">Accomplish</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Comprehensive warehouse management capabilities built for modern operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {capabilities.map((category, index) => (
              <Card key={index} className="bg-neutral-900/20 border-neutral-700/30 backdrop-blur-xl hover:bg-neutral-800/30 hover:border-neutral-600 transition-all duration-500">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-neutral-200 mb-6">
                    {category.category}
                  </h3>
                  <ul className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <span className="text-neutral-300">{item}</span>
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
              Built with <span className="text-neutral-200">Modern Technology</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Reliable, scalable, and secure technology stack for enterprise operations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {techStack.map((tech, index) => (
              <div key={index} className="text-center">
                <div className="bg-neutral-900/20 border border-neutral-700/30 backdrop-blur-xl rounded-2xl p-6 hover:bg-neutral-800/30 hover:border-neutral-600 transition-all duration-300">
                  <div className="text-2xl font-bold text-neutral-200 mb-2">
                    {tech.name}
                  </div>
                  <div className="text-neutral-400">{tech.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-32 bg-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(100,100,100,0.05)_0%,transparent_70%)]"></div>
        </div>
        <div className="w-full text-center px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <Badge className="bg-neutral-800/50 text-neutral-300 border-neutral-600 px-6 py-3 text-lg rounded-full">
              <Target className="h-5 w-5 mr-2" />
              Upgrade Your Warehouse with LogistiX
            </Badge>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Start Your <span className="text-neutral-200">Transformation</span> Today
            </h2>

            <p className="text-xl md:text-2xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Join businesses that have revolutionized their warehouse operations with our comprehensive management system. Let's talk.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button onClick={() => window.location.href = "mailto:contact@unsynth.ai"} size="lg" className="bg-neutral-800 hover:bg-neutral-700 text-white border-0 px-12 py-6 text-lg rounded-2xl font-semibold shadow-2xl transition-all duration-300 transform">
                <Calendar className="mr-3 h-6 w-6" />
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-xl">
        <div className="w-full px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-neutral-800 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    LogistiX
                  </span>
                  <Badge className="bg-neutral-800/50 text-neutral-300 border-neutral-600">
                    WMS
                  </Badge>
                </div>
                <p className="text-neutral-400 max-w-md leading-relaxed">
                  Next-generation warehouse management system designed for speed, accuracy, and control across every warehouse you manage.
                </p>
              </div>

              {/* Navigation Links */}
              <div className="space-y-6">
                <h4 className="text-white font-semibold text-lg">Product</h4>
                <div className="space-y-3">
                  <Link to="/features" className="block text-neutral-400 hover:text-neutral-300 transition-colors">Features</Link>
                  <Link to="/pricing" className="block text-neutral-400 hover:text-neutral-300 transition-colors">Pricing</Link>
                  <Link to="/integrations" className="block text-neutral-400 hover:text-neutral-300 transition-colors">Integrations</Link>
                  <Link to="/security" className="block text-neutral-400 hover:text-neutral-300 transition-colors">Security</Link>
                </div>
              </div>

              {/* Support Links */}
              <div className="space-y-6">
                <h4 className="text-white font-semibold text-lg">Support</h4>
                <div className="space-y-3">
                  <Link to="/about" className="block text-neutral-400 hover:text-neutral-300 transition-colors">About</Link>
                  <div className="block text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer">Contact</div>
                  <div className="block text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer">Documentation</div>
                  <div className="block text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer">Privacy Policy</div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-neutral-800">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-neutral-500">
                  &copy; 2025 LogistiX. Advanced Warehouse Management Platform. Designed and developed by Unsynth.ai
                </p>
                <div className="flex space-x-6">
                  <div className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer">
                    <a
                      href="https://www.linkedin.com/company/unsynth-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      LinkedIn
                    </a>
                  </div>
                  <div className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer">
                    <a
                      href="https://twitter.com/unsynth"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      Twitter
                    </a>
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
