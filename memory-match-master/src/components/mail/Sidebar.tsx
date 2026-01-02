import { 
  Mail, 
  Send, 
  Settings, 
  PenSquare, 
  LogOut,
  User,
  Inbox
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type View = 'compose' | 'sent' | 'settings';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
      });
    }
  };

  const menuItems = [
    { id: 'compose' as View, icon: PenSquare, label: 'Compose' },
    { id: 'sent' as View, icon: Send, label: 'Sent' },
    { id: 'settings' as View, icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="mail-sidebar w-64 h-screen flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-mail-accent flex items-center justify-center shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-xl block">MailApp</span>
            <span className="text-xs text-white/60">Send emails easily</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs uppercase tracking-wider text-white/40 px-4 mb-3">Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`mail-sidebar-item w-full ${
              currentView === item.id ? 'active' : ''
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.id === 'compose' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-mail-accent" />
            )}
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-mail-accent flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.display_name || 'User'}
            </p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mail-sidebar-item w-full mt-3 text-white/70 hover:text-white hover:bg-destructive/20"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
