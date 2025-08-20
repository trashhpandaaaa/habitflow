'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const reportWebVital = (metric: WebVitalMetric) => {
      // Report to analytics service (replace with your analytics)
      if (window.gtag) {
        window.gtag('event', metric.name, {
          custom_parameter_name: metric.value,
          custom_parameter_name2: metric.id,
        });
      }
      
      // Console log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${metric.name}: ${metric.value}`);
      }
    };

    // Dynamically import web-vitals to reduce initial bundle
    import('web-vitals').then((webVitals) => {
      webVitals.onCLS(reportWebVital);
      webVitals.onINP(reportWebVital);
      webVitals.onFCP(reportWebVital);
      webVitals.onLCP(reportWebVital);
      webVitals.onTTFB(reportWebVital);
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  useEffect(() => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // Browser doesn't support longtask
      }

      return () => observer.disconnect();
    }
  }, []);
}
