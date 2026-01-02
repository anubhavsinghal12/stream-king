import { useState, useEffect } from 'react';
import { Plus, Loader2, Settings, Trash2, Edit2, Save, X, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

interface SmtpConfig {
  id: string;
  config_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string | null;
  use_tls: boolean;
  is_default: boolean;
}

const smtpSchema = z.object({
  config_name: z.string().min(1, 'Configuration name is required'),
  smtp_host: z.string().min(1, 'SMTP host is required'),
  smtp_port: z.number().min(1).max(65535, 'Invalid port number'),
  smtp_username: z.string().min(1, 'SMTP username is required'),
  smtp_password: z.string().min(1, 'SMTP password is required'),
  from_email: z.string().email('Invalid email address'),
  from_name: z.string().optional(),
  use_tls: z.boolean(),
  is_default: z.boolean(),
});

const SmtpSettings = () => {
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SmtpConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [configName, setConfigName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching SMTP configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfigName('');
    setSmtpHost('');
    setSmtpPort(587);
    setSmtpUsername('');
    setSmtpPassword('');
    setFromEmail('');
    setFromName('');
    setUseTls(true);
    setIsDefault(false);
    setEditingConfig(null);
  };

  const openEditDialog = (config: SmtpConfig) => {
    setEditingConfig(config);
    setConfigName(config.config_name);
    setSmtpHost(config.smtp_host);
    setSmtpPort(config.smtp_port);
    setSmtpUsername(config.smtp_username);
    setSmtpPassword(config.smtp_password);
    setFromEmail(config.from_email);
    setFromName(config.from_name || '');
    setUseTls(config.use_tls);
    setIsDefault(config.is_default);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const formData = {
      config_name: configName.trim(),
      smtp_host: smtpHost.trim(),
      smtp_port: smtpPort,
      smtp_username: smtpUsername.trim(),
      smtp_password: smtpPassword,
      from_email: fromEmail.trim(),
      from_name: fromName.trim() || null,
      use_tls: useTls,
      is_default: isDefault,
    };

    const result = smtpSchema.safeParse(formData);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: result.error.errors[0].message,
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingConfig) {
        // Update existing
        const { error } = await supabase
          .from('smtp_configs')
          .update(formData)
          .eq('id', editingConfig.id);

        if (error) throw error;

        toast({
          title: 'Configuration Updated',
          description: 'Your SMTP settings have been updated.',
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('smtp_configs')
          .insert({
            ...formData,
            user_id: user?.id,
          });

        if (error) throw error;

        toast({
          title: 'Configuration Added',
          description: 'Your SMTP settings have been saved.',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      console.error('Error saving SMTP config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('smtp_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Configuration Deleted',
        description: 'The SMTP configuration has been removed.',
      });

      fetchConfigs();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete configuration.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mail-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-semibold">SMTP Settings</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configure your email server settings
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
                <Plus className="w-5 h-5 mr-2" />
                Add Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingConfig ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="form-label">Configuration Name</label>
                  <Input
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Gmail, Work Email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">SMTP Host</label>
                    <Input
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="form-label">SMTP Port</label>
                    <Input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">SMTP Username</label>
                  <Input
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="form-label">SMTP Password / App Password</label>
                  <Input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For Gmail, use an App Password. For other providers, check their documentation.
                  </p>
                </div>

                <div>
                  <label className="form-label">From Email</label>
                  <Input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="form-label">From Name (optional)</label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <label className="form-label mb-0">Use TLS</label>
                    <p className="text-xs text-muted-foreground">Encrypt connection with TLS</p>
                  </div>
                  <Switch checked={useTls} onCheckedChange={setUseTls} />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <label className="form-label mb-0">Set as Default</label>
                    <p className="text-xs text-muted-foreground">Use this config by default</p>
                  </div>
                  <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="btn-primary-gradient">
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold mb-2">No SMTP Configurations</h3>
            <p className="text-muted-foreground text-sm">
              Add your first SMTP configuration to start sending emails.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.config_name}</span>
                      {config.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {config.smtp_host}:{config.smtp_port} • {config.from_email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(config)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the SMTP configuration "{config.config_name}".
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(config.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common SMTP Settings Info */}
      <div className="mail-card">
        <h3 className="font-display font-semibold mb-4">Common SMTP Settings</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Gmail</h4>
            <p className="text-sm text-muted-foreground">
              Host: smtp.gmail.com<br />
              Port: 587 (TLS) or 465 (SSL)<br />
              <span className="text-mail-warning">Requires App Password</span>
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Outlook / Office 365</h4>
            <p className="text-sm text-muted-foreground">
              Host: smtp.office365.com<br />
              Port: 587 (TLS)<br />
              Use your email as username
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Yahoo Mail</h4>
            <p className="text-sm text-muted-foreground">
              Host: smtp.mail.yahoo.com<br />
              Port: 587 (TLS) or 465 (SSL)<br />
              <span className="text-mail-warning">Requires App Password</span>
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Custom SMTP</h4>
            <p className="text-sm text-muted-foreground">
              Check with your email provider<br />
              for specific SMTP settings<br />
              and authentication requirements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpSettings;
