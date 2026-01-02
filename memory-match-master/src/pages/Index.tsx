import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/mail/Sidebar';
import ComposeEmail from '@/components/mail/ComposeEmail';
import SentEmails from '@/components/mail/SentEmails';
import SmtpSettings from '@/components/mail/SmtpSettings';
import { Loader2, PenSquare, Send, Settings } from 'lucide-react';

type View = 'compose' | 'sent' | 'settings';

const viewTitles: Record<View, { title: string; subtitle: string; icon: React.ElementType }> = {
  compose: { title: 'Compose Email', subtitle: 'Write and send a new email', icon: PenSquare },
  sent: { title: 'Sent Emails', subtitle: 'View your email history', icon: Send },
  settings: { title: 'SMTP Settings', subtitle: 'Configure your email server', icon: Settings },
};

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('compose');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentViewConfig = viewTitles[currentView];
  const IconComponent = currentViewConfig.icon;

  const renderContent = () => {
    switch (currentView) {
      case 'compose':
        return <ComposeEmail />;
      case 'sent':
        return <SentEmails />;
      case 'settings':
        return <SmtpSettings />;
      default:
        return <ComposeEmail />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {currentViewConfig.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentViewConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-4xl animate-fade-in">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
