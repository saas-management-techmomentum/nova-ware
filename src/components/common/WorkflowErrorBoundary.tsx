import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class WorkflowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Workflow Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Workflow Error</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>Something went wrong with the workflow component.</p>
              <p className="text-sm text-amber-600">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default WorkflowErrorBoundary;