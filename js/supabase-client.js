/* ==========================================================================
   Shining Stars Pre School & Academy — Supabase Client Initialization
   ========================================================================== */

(function initShiningStarsSupabase() {
  const SUPABASE_URL = 'https://ctrdlxdipgynkptvwhdu.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hSdpdbr4YNhKjo99TFTgew_Cpanymhh';

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.shiningStarsSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  } else {
    window.shiningStarsSupabase = null;
  }
})();
