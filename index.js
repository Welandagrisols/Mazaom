import { registerRootComponent } from "expo";

import App from "@/App";

// Inject environment variables to window for client-side access
if (typeof window !== 'undefined') {
  window.__SUPABASE_URL__ = process.env.SUPABASE_URL;
  window.__SUPABASE_ANON_KEY__ = process.env.SUPABASE_ANON_KEY;
  window.__OPENAI_API_KEY__ = process.env.OPENAI_API_KEY;
}

registerRootComponent(App);
