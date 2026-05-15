import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { record } = body;
    
    // Webhook triggered by insert in 'contacts' table
    if (!record || !record.email) {
      return new Response(JSON.stringify({ error: "No email provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, subject } = record;

    // TODO: Configure your email provider here (Resend, SendGrid, etc.)
    // Example with Resend API:
    /*
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CERAP Éditions <editions@cerap-inades.org>",
        to: email,
        subject: `Accusé de réception : ${subject}`,
        html: `
          <h3>Bonjour ${name},</h3>
          <p>Nous avons bien reçu votre demande concernant : <strong>${subject}</strong>.</p>
          <p>Notre équipe la traitera dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe CERAP Éditions</p>
        `,
      }),
    });
    const data = await res.json();
    */

    // Mock response for local development
    console.log(`Simulating email sent to ${email} for subject: ${subject}`);
    
    return new Response(
      JSON.stringify({ message: `Confirmation email simulation sent to ${email}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
