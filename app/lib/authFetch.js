import { supabase } from "./supabase";

// Adjunta el JWT de Supabase como Bearer token en cada request
export async function authFetch(url, opts = {}) {
  const { data: { session: s } } = await supabase.auth.getSession();
  const token = s?.access_token;
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });
}
