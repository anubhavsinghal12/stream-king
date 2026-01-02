import { useState, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

interface SmtpConfig {
  id: string;
  config_name: string;
  from_email: string;
  from_name: string | null;
}

const emailSchema = z.string().email('Invalid email address');

const ComposeEmail = () => {
  const [configs, setConfigs] = useState<SmtpConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_configs')
        .select('id, config_name, from_email, from_name')
        .order('is_default', { ascending: false });

      if (error) throw error;

      setConfigs(data || []);
      if (data && data.length > 0) {
        setSelectedConfig(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching SMTP configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const parseEmails = (input: string): string[] => {
    if (!input.trim()) return [];
    return input.split(',').map(e => e.trim()).filter(e => e);
  };

  const validateEmails = (emails: string[]): boolean => {
    for (const email of emails) {
      const result = emailSchema.safeParse(email);
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Invalid Email',
          description: `"${email}" is not a valid email address.`,
        });
        return false;
      }
    }
    return true;
  };

  const handleSend = async () => {
    if (!selectedConfig) {
      toast({
        variant: 'destructive',
        title: 'No SMTP Configuration',
        description: 'Please configure your SMTP settings first.',
      });
      return;
    }

    const toEmails = parseEmails(to);
    const ccEmails = parseEmails(cc);
    const bccEmails = parseEmails(bcc);

    if (toEmails.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Recipient',
        description: 'Please enter at least one recipient.',
      });
      return;
    }

    if (!validateEmails([...toEmails, ...ccEmails, ...bccEmails])) {
      return;
    }

    if (!subject.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Subject',
        description: 'Please enter an email subject.',
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          smtp_config_id: selectedConfig,
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
          bcc: bccEmails.length > 0 ? bccEmails : undefined,
          subject: subject.trim(),
          body: body.trim(),
          is_html: false,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: '✉️ Email Sent!',
          description: 'Your email has been sent successfully.',
        });

        // Clear form
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setShowCcBcc(false);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send',
        description: error.message || 'An error occurred while sending the email.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loadingConfigs) {
    return (
      <div className="mail-card flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="mail-card text-center py-16">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-3">No SMTP Configuration</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          You need to configure your SMTP settings before you can send emails. 
          Add your email provider details in Settings.
        </p>
        <p className="text-sm text-primary font-medium">
          Go to Settings → Add SMTP Configuration
        </p>
      </div>
    );
  }

  return (
    <div className="mail-card">
      <div className="space-y-5">
        {/* SMTP Config Selection */}
        <div>
          <label className="form-label">From</label>
          <Select value={selectedConfig} onValueChange={setSelectedConfig}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select email account" />
            </SelectTrigger>
            <SelectContent>
              {configs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.from_name ? `${config.from_name} <${config.from_email}>` : config.from_email}
                  <span className="text-muted-foreground ml-2">({config.config_name})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* To */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label mb-0">To</label>
            {!showCcBcc && (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Add CC/BCC
              </button>
            )}
          </div>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com (comma-separated for multiple)"
            className="h-12"
          />
        </div>

        {/* CC & BCC */}
        {showCcBcc && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="form-label">CC</label>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="h-12"
              />
            </div>
            <div>
              <label className="form-label">BCC</label>
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="h-12"
              />
            </div>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="form-label">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="h-12"
          />
        </div>

        {/* Body */}
        <div>
          <label className="form-label">Message</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here..."
            className="min-h-[240px] resize-y text-base"
          />
        </div>

        {/* Send Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="btn-primary-gradient h-12 px-8 text-base"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmail;
