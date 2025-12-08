import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useSystemStatus, getStatusColor, getStatusText, StatusLevel } from '@/hooks/useSystemStatus';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const StatusIcon = ({ status }: { status: StatusLevel }) => {
  switch (status) {
    case 'operational':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    case 'outage':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
};

const Status = () => {
  const systemStatus = useSystemStatus();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getOverallBgColor = (status: StatusLevel): string => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 border-green-200';
      case 'degraded':
        return 'bg-orange-50 border-orange-200';
      case 'outage':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallTextColor = (status: StatusLevel): string => {
    switch (status) {
      case 'operational':
        return 'text-green-700';
      case 'degraded':
        return 'text-orange-700';
      case 'outage':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            System Status
          </h1>
          <p className="text-lg text-foreground">
            Current status of Promptbox services and infrastructure
          </p>
        </div>

        {/* Overall Status Banner */}
        <div className={`rounded-lg border p-6 mb-8 ${getOverallBgColor(systemStatus.overall)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(systemStatus.overall)}`} />
              <span className={`text-xl font-semibold ${getOverallTextColor(systemStatus.overall)}`}>
                {getStatusText(systemStatus.overall)}
              </span>
            </div>
            <span className="text-sm text-foreground/70">
              Last updated: {systemStatus.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Services</h2>
          </div>
          <div className="divide-y divide-border">
            {systemStatus.services.map((service) => (
              <div key={service.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-foreground/70 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={service.status} />
                  <span className="text-sm capitalize text-foreground">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident History */}
        <div className="mt-8 bg-background border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Incidents</h2>
          </div>
          <div className="px-6 py-8 text-center text-foreground/70">
            <p>No incidents reported in the last 90 days.</p>
          </div>
        </div>

        {/* Uptime Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-500">99.99%</div>
            <div className="text-sm text-foreground mt-1">Uptime (30 days)</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-foreground">45ms</div>
            <div className="text-sm text-foreground mt-1">Avg Response Time</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-foreground">0</div>
            <div className="text-sm text-foreground mt-1">Incidents (30 days)</div>
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="mt-12 text-center">
          <p className="text-foreground mb-4">
            Subscribe to receive updates on system status changes
          </p>
          <a 
            href="mailto:support@promptbox.com" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Status;
