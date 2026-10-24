import { getSupabase } from "./supabase";
import { INVOICE_TTL_MS } from "./types";

/** Delete Supabase invoices older than the TTL (5 days). No-op if not configured. */
export async function purgeExpiredSupabaseInvoices(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const cutoff = new Date(Date.now() - INVOICE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("invoices")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("Failed to purge expired invoices:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}
