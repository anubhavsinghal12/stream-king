import { useState, useEffect } from 'react';
import { Send, Loader2, Mail, Clock, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SentEmail {
  id: string;
  to_emails: string[];
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

const SentEmails = () => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('sent_emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;

      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching sent emails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="mail-card text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-semibold mb-2">No Sent Emails</h2>
        <p className="text-muted-foreground">
          Emails you send will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mail-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-display font-semibold">Sent Emails</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {emails.length} email{emails.length !== 1 ? 's' : ''} sent
          </p>
        </div>

        <div className="divide-y divide-border">
          {emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="email-row"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {email.to_emails.join(', ')}
                  </span>
                  <span className={`status-badge ${email.status}`}>
                    {email.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {email.subject}
                </p>
                <p className="text-sm text-muted-foreground truncate-2">
                  {email.body}
                </p>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {format(new Date(email.sent_at), 'MMM d, h:mm a')}
                </span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail Modal */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Email Details</DialogTitle>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">To</label>
                <p className="text-foreground">{selectedEmail.to_emails.join(', ')}</p>
              </div>

              {selectedEmail.cc_emails && selectedEmail.cc_emails.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CC</label>
                  <p className="text-foreground">{selectedEmail.cc_emails.join(', ')}</p>
                </div>
              )}

              {selectedEmail.bcc_emails && selectedEmail.bcc_emails.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">BCC</label>
                  <p className="text-foreground">{selectedEmail.bcc_emails.join(', ')}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <p className="text-foreground font-medium">{selectedEmail.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Sent At</label>
                <p className="text-foreground">
                  {format(new Date(selectedEmail.sent_at), 'MMMM d, yyyy at h:mm a')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p>
                  <span className={`status-badge ${selectedEmail.status}`}>
                    {selectedEmail.status}
                  </span>
                </p>
              </div>

              {selectedEmail.error_message && (
                <div>
                  <label className="text-sm font-medium text-destructive">Error</label>
                  <p className="text-destructive">{selectedEmail.error_message}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <div className="bg-muted/50 rounded-lg p-4 mt-2 whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SentEmails;
