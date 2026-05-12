// Supabase Configuration — CERAP Éditions
const SUPABASE_URL = 'https://yalltyqddkiafnvlapeh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mz-PwPqfz2YdaGXkjeqa2Q_sC8IEAaC';

// Le CDN expose l'objet global "supabase" avec la méthode createClient
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// On expose sous le nom "supabase" pour que le reste du code fonctionne
window.supabase = supabaseClient;
