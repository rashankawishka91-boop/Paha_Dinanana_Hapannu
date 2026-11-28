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
 * Load application state from Supabase (merges relational tables & paha_dinana_state)
 */
export async function fetchSupabaseState() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const [stateRes, uRes, fRes, iRes, pRes, sRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/paha_dinana_state?id=eq.main&select=data,updated_at`, {
        headers: getHeaders(),
        cache: "no-store"
      }),
      fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/folders?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/items?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/pays?select=*`, { headers: getHeaders(), cache: "no-store" }),
      fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1&select=*`, { headers: getHeaders(), cache: "no-store" })
    ]);

    let stateBlob = null;
    if (stateRes.ok) {
      const rows = await stateRes.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.data && Object.keys(rows[0].data).length > 0) {
        stateBlob = rows[0].data;
      }
    }

    const [usersTable, foldersRaw, itemsTable, paysTable, settingsRows] = await Promise.all([
      uRes.ok ? uRes.json() : [],
      fRes.ok ? fRes.json() : [],
      iRes.ok ? iRes.json() : [],
      pRes.ok ? pRes.json() : [],
      sRes.ok ? sRes.json() : []
    ]);

    // Merge users from both stateBlob and usersTable so no user is ever lost
    const userMap = new Map();
    if (Array.isArray(usersTable)) {
      usersTable.forEach(u => {
        if (u && u.id) {
          userMap.set(String(u.id), {
            id: String(u.id),
            name: u.name,
            phone: u.phone,
            pass: u.pass,
            grade: Number(u.grade) || 5,
            admin: Boolean(u.admin)
          });
        }
      });
    }
    if (Array.isArray(stateBlob?.users)) {
      stateBlob.users.forEach(u => {
        if (u && u.id) {
          userMap.set(String(u.id), {
            id: String(u.id),
            name: u.name,
            phone: u.phone,
            pass: u.pass,
            grade: Number(u.grade) || 5,
            admin: Boolean(u.admin)
          });
        }
      });
    }

    const mappedFoldersFromTable = Array.isArray(foldersRaw)
      ? foldersRaw.map(f => ({
          id: f.id,
          grade: Number(f.grade) || 5,
          month: f.month || "2026 නොවැම්බර්",
          isCurrentMonth: Boolean(f.is_current_month),
          name: f.name,
          category: f.category || "මාසික පේපර් පන්තිය",
          price: Number(f.price) || (Number(f.grade) === 3 ? 800 : 1000),
          papersCount: f.papers_count || "දිනකට පේපර් 2ක් + Zoom Live",
          subjects: f.subjects || "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
          zoomUrl: f.zoom_url || "https://zoom.us/j/94771234567",
          zoomSchedule: f.zoom_schedule || "",
          desc: f.description || ""
        }))
      : [];

    const finalUsers = Array.from(userMap.values());
    const finalFolders =
      Array.isArray(stateBlob?.folders) && stateBlob.folders.length > 0
        ? stateBlob.folders
        : mappedFoldersFromTable;
    const finalItems =
      Array.isArray(stateBlob?.items) && stateBlob.items.length > 0
        ? stateBlob.items
        : Array.isArray(itemsTable)
        ? itemsTable
        : [];
    const finalPays =
      Array.isArray(stateBlob?.pays) && stateBlob.pays.length > 0
        ? stateBlob.pays
        : Array.isArray(paysTable)
        ? paysTable
        : [];

    if (finalUsers.length === 0 && finalFolders.length === 0) {
      return null;
    }

    return {
      users: finalUsers,
      folders: finalFolders,
      items: finalItems,
      pays: finalPays,
      attendance: stateBlob?.attendance || undefined,
      gradeDetails: Array.isArray(stateBlob?.gradeDetails) ? stateBlob.gradeDetails : undefined,
      set: stateBlob?.set || (settingsRows?.[0]
        ? {
            name: settingsRows[0].name,
            slogan: settingsRows[0].slogan,
            logo: settingsRows[0].logo,
            hotline: settingsRows[0].hotline,
            bank: settingsRows[0].bank
          }
        : undefined)
    };
  } catch (err) {
    console.warn("Supabase fetch error:", err?.message);
    return null;
  }
}

/**
 * Save / Sync application state to Supabase (updates relational tables & paha_dinana_state in parallel)
 */
export async function syncSupabaseState(state) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !state) return;

  try {
    const tasks = [];

    // 1. Upsert into paha_dinana_state
    tasks.push(
      fetch(`${SUPABASE_URL}/rest/v1/paha_dinana_state?on_conflict=id`, {
        method: "POST",
        headers: getHeaders({
          Prefer: "resolution=merge-duplicates,return=minimal"
        }),
        body: JSON.stringify({
          id: "main",
          data: state,
          updated_at: new Date().toISOString()
        })
      }).catch(e => console.warn("paha_dinana_state sync err:", e))
    );

    // 2. Upsert users table directly
    if (Array.isArray(state.users) && state.users.length > 0) {
      const cleanUsers = state.users.map(u => ({
        id: String(u.id),
        name: String(u.name || ""),
        phone: String(u.phone || ""),
        pass: String(u.pass || ""),
        grade: [3, 4, 5].includes(Number(u.grade)) ? Number(u.grade) : 5,
        admin: Boolean(u.admin)
      }));

      tasks.push(
        fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=id`, {
          method: "POST",
          headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
          body: JSON.stringify(cleanUsers)
        }).catch(e => console.warn("users sync err:", e))
      );
    }

    // 3. Upsert folders table
    if (Array.isArray(state.folders) && state.folders.length > 0) {
      const cleanFolders = state.folders.map(f => ({
        id: String(f.id),
        grade: [3, 4, 5].includes(Number(f.grade)) ? Number(f.grade) : 5,
        month: String(f.month || "2026 නොවැම්බර්"),
        is_current_month: Boolean(f.isCurrentMonth),
        name: String(f.name || ""),
        category: String(f.category || "මාසික පේපර් පන්තිය"),
        price: Number(f.price) || (Number(f.grade) === 3 ? 800 : 1000),
        papers_count: String(f.papersCount || ""),
        subjects: String(f.subjects || ""),
        zoom_url: String(f.zoomUrl || ""),
        zoom_schedule: String(f.zoomSchedule || ""),
        description: String(f.desc || "")
      }));

      tasks.push(
        fetch(`${SUPABASE_URL}/rest/v1/folders?on_conflict=id`, {
          method: "POST",
          headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
          body: JSON.stringify(cleanFolders)
        }).catch(e => console.warn("folders sync err:", e))
      );
    }

    // 4. Upsert items table
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

      tasks.push(
        fetch(`${SUPABASE_URL}/rest/v1/items?on_conflict=id`, {
          method: "POST",
          headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
          body: JSON.stringify(cleanItems)
        }).catch(e => console.warn("items sync err:", e))
      );
    }

    // 5. Upsert pays table
    if (Array.isArray(state.pays) && state.pays.length > 0) {
      const cleanPays = state.pays.map(p => ({
        id: String(p.id),
        uid: String(p.uid),
        fid: String(p.fid),
        slip: String(p.slip || ""),
        status: ["pending", "approved", "rejected"].includes(p.status) ? p.status : "pending",
        date: String(p.date || "")
      }));

      tasks.push(
        fetch(`${SUPABASE_URL}/rest/v1/pays?on_conflict=id`, {
          method: "POST",
          headers: getHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
          body: JSON.stringify(cleanPays)
        }).catch(e => console.warn("pays sync err:", e))
      );
    }

    await Promise.all(tasks);
  } catch (err) {
    console.warn("Supabase sync skipped:", err?.message);
  }
}
