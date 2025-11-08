
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Activity,
  MapPin,
  Package,
  Clock,
  Zap
} from 'lucide-react';
import { LocationAnalytics, LocationSuggestion } from '@/hooks/useEnhancedLocationManagement';

interface LocationAnalyticsDashboardProps {
  analytics: LocationAnalytics[];
  suggestions: LocationSuggestion[];
  realtimeMovements: any[];
}

const LocationAnalyticsDashboard: React.FC<LocationAnalyticsDashboardProps> = ({
  analytics,
  suggestions,
  realtimeMovements
}) => {
  // Calculate overall metrics
  const avgUtilization = analytics.length > 0 
    ? analytics.reduce((sum, item) => sum + item.utilizationRate, 0) / analytics.length 
    : 0;

  const avgPickingEfficiency = analytics.length > 0
    ? analytics.reduce((sum, item) => sum + item.pickingEfficiency, 0) / analytics.length
    : 0;

  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
  const totalItems = analytics.reduce((sum, item) => sum + item.currentItems, 0);
  const totalCapacity = analytics.reduce((sum, item) => sum + item.capacity, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'optimal': return CheckCircle;
      case 'consolidation': return Package;
      case 'suboptimal': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Utilization</p>
                <p className="text-2xl font-bold text-white">{avgUtilization.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-gray-700/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <Progress value={avgUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Picking Efficiency</p>
                <p className="text-2xl font-bold text-white">{avgPickingEfficiency.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+2.4% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Locations</p>
                <p className="text-2xl font-bold text-white">{analytics.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-700/20 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {totalItems}/{totalCapacity} capacity used
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">High Priority Issues</p>
                <p className="text-2xl font-bold text-white">{highPrioritySuggestions.length}</p>
              </div>
              <div className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Suggestions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length > 0 ? (
              suggestions.slice(0, 5).map((suggestion, index) => {
                const Icon = getSuggestionIcon(suggestion.type);
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className={`h-8 w-8 rounded-full ${getPriorityColor(suggestion.priority)}/20 flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${getPriorityColor(suggestion.priority).replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          className={`${getPriorityColor(suggestion.priority)} text-white text-xs`}
                        >
                          {suggestion.priority.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400">{suggestion.locationId}</span>
                      </div>
                      <p className="text-sm text-slate-200">{suggestion.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <p className="text-lg font-medium text-slate-300">All Good!</p>
                <p className="text-sm">No optimization suggestions at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Activity */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-400" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {realtimeMovements.length > 0 ? (
              realtimeMovements.slice(-5).map((movement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">
                      Location update detected
                    </p>
                    <p className="text-xs text-slate-400">
                      {movement.eventType} • Just now
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-slate-400" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Activity className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-lg font-medium text-slate-300">No Recent Activity</p>
                <p className="text-sm">Location changes will appear here in real-time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Performance Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Location Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Utilization</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Efficiency</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Movement</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Last Access</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 10).map((location) => (
                  <tr key={location.locationId} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-gray-700/20 border-gray-600/30 text-gray-300">
                        {location.locationId}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              location.utilizationRate > 90 ? 'bg-red-500' :
                              location.utilizationRate > 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(location.utilizationRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-300">
                          {location.utilizationRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {location.pickingEfficiency.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {location.movementFrequency.toFixed(0)}/day
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {location.lastAccessed.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalyticsDashboard;
