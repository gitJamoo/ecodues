import { createClient } from "@supabase/supabase-js";

// Service-role client for cron route ONLY — never import in page code
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
