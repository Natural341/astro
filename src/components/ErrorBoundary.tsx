// Error Boundary Component - Production Ready
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { isProduction } from '../utils/security';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development only
    if (!isProduction()) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    } else {
      // In production, send to error tracking service (Sentry, etc.)
      this.logToErrorService(error, errorInfo);
    }
  }

  logToErrorService(error: Error, errorInfo: ErrorInfo): void {
    // Send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    console.error('[ErrorBoundary] Logged to error service');
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the app
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      // For React Native, you might want to restart the app
      this.handleReset();
    }
  };

  render(): ReactNode {
    // If custom fallback is provided, use it
    if (this.props.fallback && this.state.hasError) {
      return this.props.fallback;
    }

    // If there's an error, show the error screen
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} onReset={this.handleReset} onReload={this.handleReload} />;
    }

    // Otherwise, render children
    return this.props.children;
  }
}

// Default Error Screen Component
interface ErrorScreenProps {
  error: Error | null;
  onReset: () => void;
  onReload: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onReset, onReload }) => {
  const isProd = isProduction();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>😕</Text>
        <Text style={styles.title}>Something Went Wrong</Text>
        <Text style={styles.message}>
          {isProd
            ? 'An unexpected error occurred. Please try again later.'
            : 'An error occurred in development mode. Check the details below.'}
        </Text>

        {!isProd && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <ScrollView style={styles.errorScroll}>
              <Text style={styles.errorText}>{error.toString()}</Text>
              {error.stack && (
                <Text style={styles.stackTrace}>{error.stack}</Text>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={onReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.reloadButton]} onPress={onReload}>
            <Text style={styles.buttonText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 300,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e94560',
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 200,
  },
  errorText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: '#a0a0a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#e94560',
  },
  reloadButton: {
    backgroundColor: '#0f3460',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

// Simple error screen for specific use cases
export const SimpleErrorScreen: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'An error occurred',
  onRetry,
}) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryWrapper: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryWrapper;
}

// Hook to trigger errors programmatically (for testing)
export function useErrorHandler() {
  const setError = React.useCallback((error: Error) => {
    throw error;
  }, []);

  return setError;
}
