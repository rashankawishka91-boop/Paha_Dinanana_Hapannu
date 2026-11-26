// Lightweight Supabase REST API Client for Paha Dinana Hapannu
// Connects directly to Supabase PostgREST without extra bundle dependencies

const DEFAULT_SUPABASE_URL = "https://mfmqgpweevwnedjuljnp.supabase.co";
const DEFAULT_SUPABASE_KEY = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbXFncHdlZXZ3bmVkanVsam5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NzIzMDIsImV4cCI6MjExMTI0ODMwMn0",
  "STxHI5NxMO1V1_6IU_syMgSslOD09Rt3oLfHUoxGm2w"
].join(".");

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

const getHeaders = (extra = {}) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  ...extra
});

/**
 * Load application state from Supabase (checks paha_dinana_state and relational tables)
 */
export async function fetchSupabaseState() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    // 1. Try reading from the unified state sync table first
    const stateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/paha_dinana_state?id=eq.main&select=data,updated_at`,
      {
        method: "GET",
        headers: getHeaders(),
        cache: "no-store"
      }
    );

    if (stateRes.ok) {
      const rows = await stateRes.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.data && Object.keys(rows[0].data).length > 0) {
        return rows[0].data;
      }
    }

    // 2. Fallback: assemble from relational tables (users, folders, items, pays, settings)
    const [uRes, fRes, iRes, pRes, sRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/folders?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/items?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/pays?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1&select=*`, { headers: getHeaders(), cache: "no-store" })
    ]);

    if (!uRes.ok || !fRes.ok) return null;

    const [users, foldersRaw, items, pays, settingsRows] = await Promise.all([
      uRes.json(),
      fRes.json(),
      iRes.ok ? iRes.json() : [],
      pRes.ok ? pRes.json() : [],
      sRes.ok ? sRes.json() : []
    ]);

    if (!Array.isArray(foldersRaw) || foldersRaw.length === 0) return null;

    const folders = foldersRaw.map(f => ({
      id: f.id,
      grade: Number(f.grade) || 5,
      month: f.month || "2026 නොවැම්බර්",
      isCurrentMonth: Boolean(f.is_current_month),
      name: f.name,
      category: f.category || "මාසික ප්‍රශ්න පත්‍ර පන්තිය",
      price: Number(f.price) || 2000,
      papersCount: f.papers_count || "දිනකට පේපර් 2ක් + Zoom Live",
      subjects: f.subjects || "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: f.zoom_url || "https://zoom.us/j/94771234567",
      zoomSchedule: f.zoom_schedule || "",
      desc: f.description || ""
    }));

    const assembled = {
      users: Array.isArray(users) ? users : [],
      folders,
      items: Array.isArray(items) ? items : [],
      pays: Array.isArray(pays) ? pays : [],
      set: settingsRows?.[0]
        ? {
            name: settingsRows[0].name,
            slogan: settingsRows[0].slogan,
            logo: settingsRows[0].logo,
            hotline: settingsRows[0].hotline,
            bank: settingsRows[0].bank
          }
        : undefined
    };

    return assembled;
  } catch (err) {
    console.warn("Supabase fetch skipped or tables not created yet:", err?.message);
    return null;
  }
}

/**
 * Save / Sync application state to Supabase (updates paha_dinana_state & relational tables)
 */
export async function syncSupabaseState(state) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !state) return;

  try {
    // 1. Upsert into paha_dinana_state for atomic cross-device sync
    await fetch(`${SUPABASE_URL}/rest/v1/paha_dinana_state`, {
      method: "POST",
      headers: getHeaders({
        Prefer: "resolution=merge-duplicates,return=minimal"
      }),
      body: JSON.stringify({
        id: "main",
        data: state,
        updated_at: new Date().toISOString()
      })
    });

    // 2. Also upsert relational tables in background so SQL queries in Supabase Dashboard show all rows!
    if (Array.isArray(state.users) && state.users.length > 0) {
      const cleanUsers = state.users.map(u => ({
        id: String(u.id),
        name: String(u.name || ""),
        phone: String(u.phone || ""),
        pass: String(u.pass || ""),
        grade: [3, 4, 5].includes(Number(u.grade)) ? Number(u.grade) : 5,
        admin: Boolean(u.admin)
      }));
      fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(cleanUsers)
      }).catch(() => {});
    }

    if (Array.isArray(state.folders) && state.folders.length > 0) {
      const cleanFolders = state.folders.map(f => ({
        id: String(f.id),
        grade: [3, 4, 5].includes(Number(f.grade)) ? Number(f.grade) : 5,
        month: String(f.month || "2026 නොවැම්බර්"),
        is_current_month: Boolean(f.isCurrentMonth),
        name: String(f.name || ""),
        category: String(f.category || "මාසික ප්‍රශ්න පත්‍ර පන්තිය"),
        price: Number(f.price) || 2000,
        papers_count: String(f.papersCount || ""),
        subjects: String(f.subjects || ""),
        zoom_url: String(f.zoomUrl || ""),
        zoom_schedule: String(f.zoomSchedule || ""),
        description: String(f.desc || "")
      }));
      fetch(`${SUPABASE_URL}/rest/v1/folders`, {
        method: "POST",
        headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(cleanFolders)
      }).catch(() => {});
    }

    if (Array.isArray(state.items) && state.items.length > 0) {
      const cleanItems = state.items.map(i => ({
        id: String(i.id),
        fid: String(i.fid),
        type: ["zoom", "video", "pdf"].includes(i.type) ? i.type : "video",
        week: String(i.week || "1 වන සතිය"),
        subject: String(i.subject || "විෂයයන් 5ම"),
        title: String(i.title || ""),
        url: String(i.url || ""),
        schedule: String(i.schedule || "")
      }));
      fetch(`${SUPABASE_URL}/rest/v1/items`, {
        method: "POST",
        headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(cleanItems)
      }).catch(() => {});
    }

    if (Array.isArray(state.pays) && state.pays.length > 0) {
      const cleanPays = state.pays.map(p => ({
        id: String(p.id),
        uid: String(p.uid),
        fid: String(p.fid),
        slip: String(p.slip || ""),
        status: ["pending", "approved", "rejected"].includes(p.status) ? p.status : "pending",
        date: String(p.date || "")
      }));
      fetch(`${SUPABASE_URL}/rest/v1/pays`, {
        method: "POST",
        headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(cleanPays)
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Supabase sync skipped:", err?.message);
  }
}
