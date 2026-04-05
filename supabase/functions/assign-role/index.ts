import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

const ADMIN_SECRET_CODE = "BOOKSTORE_ADMIN_2024";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, role, secret_code } = await req.json();

    if (!user_id || !role || !secret_code) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (secret_code !== ADMIN_SECRET_CODE) {
      return new Response(JSON.stringify({ error: "Invalid admin secret code" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["admin", "publisher"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role. Must be 'admin' or 'publisher'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("user_roles").insert({
      user_id,
      role,
    });

    if (error) {
      if (error.code === "23505") {
        return new Response(JSON.stringify({ error: "User already has this role" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, message: `${role} role assigned successfully` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
