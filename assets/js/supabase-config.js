// Supabase Configuration — CERAP Éditions
const SUPABASE_URL = 'https://yalltyqddkiafnvlapeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbGx0eXFkZGtpYWZudmxhcGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODgyOTgsImV4cCI6MjA5NDE2NDI5OH0.H1j0YRN5VK_Ip1j5CGbZDbjGNZCao414CsEceV2VZ5Y';

// Le CDN expose l'objet global "supabase" avec la méthode createClient
// On vérifie que window.supabase existe avant de tenter l'initialisation (Bug #1 Fix)
if (window.supabase) {
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
} else {
    console.error("ERREUR CRITIQUE: Le SDK Supabase (supabase.js) n'est pas accessible au moment de l'initialisation.");
}

