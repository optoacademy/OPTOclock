function requireEnv(name){ const v = process.env[name]; if(!v) throw new Error(`Missing env var ${name}`); return v; }
function supabaseUrl(p){ return `${process.env.SUPABASE_URL}/rest/v1/${p}`; }
function supabaseHeaders(){ const S = process.env.SUPABASE_SERVICE_ROLE; return { 'Content-Type':'application/json', apikey:S, Authorization:`Bearer ${S}`, Prefer:'return=representation' }; }
async function select(path, query=''){ const r = await fetch(supabaseUrl(path) + (query?`?${query}`:''), { headers: supabaseHeaders() }); const t = await r.text(); let j; try{ j=JSON.parse(t);}catch{ j=t; } if(!r.ok) throw new Error(j?.message||t); return j; }
async function insert(path, rows, extraHeaders={}){ const r = await fetch(supabaseUrl(path), { method:'POST', headers:{...supabaseHeaders(), ...extraHeaders}, body: JSON.stringify(rows) }); const t = await r.text(); let j; try{ j=JSON.parse(t);}catch{ j=t; } if(!r.ok) throw new Error(j?.message||t); return j; }
module.exports = { select, insert };