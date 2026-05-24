import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const waitlistSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  building_type: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional().or(z.literal("")),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistResult = { ok: boolean; alreadyJoined?: boolean; error?: string };

export async function submitWaitlist(input: WaitlistInput): Promise<WaitlistResult> {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { ok: false, error: first ?? "Invalid input" };
  }
  const { email, name, building_type, notes, source } = parsed.data;

  const { error } = await supabase.from("waitlist_signups").insert({
    email,
    name: name || null,
    building_type: building_type || null,
    notes: notes || null,
    source: source || "homepage",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
  });

  if (error) {
    // Unique violation (already on list) — treat as success
    if (error.code === "23505") {
      return { ok: true, alreadyJoined: true };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, alreadyJoined: false };
}
