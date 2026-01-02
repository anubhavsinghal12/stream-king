import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  smtp_config_id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  is_html?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { smtp_config_id, to, cc, bcc, subject, body, is_html = false }: SendEmailRequest = await req.json();

    // Validate required fields
    if (!smtp_config_id || !to || to.length === 0 || !subject || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMTP config (using service role to bypass RLS for reading password)
    const { data: smtpConfig, error: configError } = await supabaseAdmin
      .from("smtp_configs")
      .select("*")
      .eq("id", smtp_config_id)
      .eq("user_id", user.id)
      .single();

    if (configError || !smtpConfig) {
      console.error("SMTP config error:", configError);
      return new Response(
        JSON.stringify({ success: false, error: "SMTP configuration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email via ${smtpConfig.smtp_host}:${smtpConfig.smtp_port}`);

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        tls: smtpConfig.use_tls,
        auth: {
          username: smtpConfig.smtp_username,
          password: smtpConfig.smtp_password,
        },
      },
    });

    // Build email options
    const fromAddress = smtpConfig.from_name 
      ? `${smtpConfig.from_name} <${smtpConfig.from_email}>`
      : smtpConfig.from_email;

    const emailContent: any = {
      from: fromAddress,
      to: to,
      subject: subject,
    };

    if (cc && cc.length > 0) {
      emailContent.cc = cc;
    }

    if (bcc && bcc.length > 0) {
      emailContent.bcc = bcc;
    }

    if (is_html) {
      emailContent.html = body;
    } else {
      emailContent.content = body;
    }

    // Send email
    await client.send(emailContent);
    await client.close();

    console.log("Email sent successfully");

    // Save to sent_emails table
    const { error: insertError } = await supabaseAdmin
      .from("sent_emails")
      .insert({
        user_id: user.id,
        smtp_config_id: smtp_config_id,
        to_emails: to,
        cc_emails: cc || null,
        bcc_emails: bcc || null,
        subject: subject,
        body: body,
        is_html: is_html,
        status: "sent",
      });

    if (insertError) {
      console.error("Error saving sent email:", insertError);
      // Don't fail the request, email was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error sending email:", error);

    // Try to save failed email to database
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } }
        });
        
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (user) {
          const body = await req.clone().json();
          await supabaseAdmin
            .from("sent_emails")
            .insert({
              user_id: user.id,
              smtp_config_id: body.smtp_config_id,
              to_emails: body.to,
              cc_emails: body.cc || null,
              bcc_emails: body.bcc || null,
              subject: body.subject,
              body: body.body,
              is_html: body.is_html || false,
              status: "failed",
              error_message: error.message,
            });
        }
      }
    } catch (saveError) {
      console.error("Error saving failed email:", saveError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
