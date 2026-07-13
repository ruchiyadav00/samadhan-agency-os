import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, TrendingUp, TrendingDown, UserCog,
  Plus, Trash2, X, CheckCircle2, Clock, Wallet, Repeat,
  ArrowUpRight, ArrowDownRight, Briefcase, Pencil,
  Users, LogOut, Shield, Eye, EyeOff, RefreshCw, Percent
} from "lucide-react";
import { api } from "./api";

// ── Helpers ───────────────────────────────────────────────────
const fmtINR     = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const todayISO   = () => new Date().toISOString().slice(0, 10);
const monthKey   = (d) => (d || "").slice(0, 7);
const curMonth   = () => new Date().toISOString().slice(0, 7);
const monthLabel = (m) => {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return new Date(y, mo - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
};
const ordinal = (n) => {
  n = Number(n); if (!n) return "";
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const SOURCES      = ["Referral", "Social Media", "Cold Outreach", "Other"];
const SOURCE_COLORS = { Referral:"#C9A24B","Social Media":"#5B8DEF","Cold Outreach":"#7AB87A",Other:"#9aa3b2" };

// ══════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const attempt = async () => {
    if (!username || !password) { setError("Enter username and password."); return; }
    setLoading(true); setError("");
    try {
      const { token, user } = await api.login(username.trim(), password);
      localStorage.setItem("samadhan_jwt",     token);
      localStorage.setItem("samadhan_session", JSON.stringify(user));
      onLogin(user);
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <style>{CSS}</style>
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">S</div>
          <div><div className="brand-name">Samadhan</div><div className="brand-sub">Agency OS</div></div>
        </div>
        <h2 className="login-title">Welcome back</h2>
        <p  className="login-sub">Sign in to your workspace</p>
        {error && <div className="login-error">{error}</div>}
        <div className="login-fields">
          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username" onKeyDown={(e) => e.key==="Enter" && attempt()} autoFocus/>
          </label>
          <label className="field pw-field">
            <span>Password</span>
            <div className="pw-wrap">
              <input type={showPw?"text":"password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" onKeyDown={(e) => e.key==="Enter" && attempt()}/>
              <button className="pw-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </label>
        </div>
        <button className="btn primary login-btn" onClick={attempt} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="login-hint">Default: <b>admin</b> / <b>admin123</b></p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  USERS PANEL  (admin only)
// ══════════════════════════════════════════════════════════════
function UsersPanel({ team }) {
  const [users,  setUsers]  = useState([]);
  const [modal,  setModal]  = useState(null);
  const [err,    setErr]    = useState("");

  const load = useCallback(async () => {
    try { setUsers(await api.users.list()); }
    catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (vals) => {
    try {
      if (modal.item) await api.users.update(modal.item.id, vals);
      else            await api.users.create(vals);
      await load(); setModal(null);
    } catch (e) { setErr(e.message); }
  };

  const handleDelete = async (id) => {
    try { await api.users.delete(id); await load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div className="stack">
      {err && <div className="login-error">{err}</div>}
      <Toolbar count={users.length} noun="user" onAdd={() => setModal({ item: null })} addLabel="Add user"/>
      {users.length === 0 ? <Empty text="No users found."/> : (
        <div className="panel nopad">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Username</th><th>Designation</th><th>Role</th><th>Team link</th><th></th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id}>
                <td className="strong">{u.name}</td>
                <td className="muted">{u.username}</td>
                <td>{u.designation || "—"}</td>
                <td>{u.isAdmin
                  ? <span className="role-pill admin-pill"><Shield size={11}/> Admin</span>
                  : <span className="role-pill staff-pill">Staff</span>}</td>
                <td>{u.teamMemberId
                  ? <span className="pos">{team.find(t=>t.id===u.teamMemberId)?.name || "Linked"}</span>
                  : <span className="muted">—</span>}</td>
                <td><div className="row-actions">
                  <button className="icon-btn edit" onClick={()=>setModal({item:u})} title="Edit"><Pencil size={15}/></button>
                  {u.id!=="admin_root" && <button className="icon-btn" onClick={()=>handleDelete(u.id)} title="Delete"><Trash2 size={15}/></button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <UserForm team={team} initial={modal.item} allUsers={users} onSave={handleSave}/>
        </Modal>
      )}
    </div>
  );
}

const MODULES = [
  { id:"clients",  label:"Clients — view & edit client details, assign team" },
  { id:"income",   label:"Income — add income entries" },
  { id:"expenses", label:"Expenses — add expense entries" },
  { id:"team",      label:"Team — add/edit team members" },
  { id:"users",     label:"Users — manage logins (admin-like)" },
  { id:"incentive", label:"Incentive — view team incentive payouts" },
];

function UserForm({ team, initial, allUsers, onSave }) {
  const [f, setF] = useState({
    name: initial?.name||"", designation: initial?.designation||"",
    username: initial?.username||"", password: "",
    isAdmin: initial?.isAdmin??false, teamMemberId: initial?.teamMemberId||"",
    permissions: initial?.permissions||[], canSeeMoney: initial?.canSeeMoney??false,
  });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({...f,[k]:e.target.value});
  const togglePerm = (id) => setF(s=>({...s,permissions:s.permissions.includes(id)?s.permissions.filter(x=>x!==id):[...s.permissions,id]}));

  const handleSave = () => {
    if (!f.name||!f.username) { setErr("Name and username are required."); return; }
    if (!initial && !f.password) { setErr("Password is required."); return; }
    const taken = allUsers.find(u=>u.username===f.username.trim() && u.id!==initial?.id);
    if (taken) { setErr("Username already taken."); return; }
    const payload = { ...f, username: f.username.trim(), isAdmin: f.isAdmin===true||f.isAdmin==="true" };
    if (!f.password) delete payload.password;
    onSave(payload);
  };

  const isAdminBool = f.isAdmin===true||f.isAdmin==="true";

  return (
    <FormShell title={initial?"Edit user":"Add user"} onSave={handleSave}>
      {err && <div className="login-error" style={{margin:0}}>{err}</div>}
      <div className="row2">
        <Field label="Full name"><input value={f.name} onChange={set("name")} placeholder="e.g. Ruchi Yadav"/></Field>
        <Field label="Designation"><input value={f.designation} onChange={set("designation")} placeholder="e.g. Graphic Designer"/></Field>
      </div>
      <div className="row2">
        <Field label="Username"><input value={f.username} onChange={set("username")} placeholder="e.g. ruchi"/></Field>
        <Field label={initial?"New password (leave blank to keep)":"Password"}>
          <input type="password" value={f.password} onChange={(e)=>setF({...f,password:e.target.value})} placeholder="Set password"/>
        </Field>
      </div>
      <Field label="Role / Access level">
        <select value={f.isAdmin?"true":"false"} onChange={(e)=>setF({...f,isAdmin:e.target.value==="true"})}>
          <option value="false">Staff — pick modules below</option>
          <option value="true">Admin — full access to everything</option>
        </select>
      </Field>
      {!isAdminBool && (
        <>
          <Field label="Modules this user can access">
            <CheckList options={MODULES} selected={f.permissions} onToggle={togglePerm} empty="No modules."/>
          </Field>
          <label className="checkbox-row">
            <input type="checkbox" checked={f.canSeeMoney} onChange={e=>setF({...f,canSeeMoney:e.target.checked})}/>
            <span>Can see money figures — income totals, expenses, salaries, net profit. Leave unchecked to hide all amounts (e.g. for Sales or Project Manager roles).</span>
          </label>
        </>
      )}
      <Field label="Link to team member (optional)">
        <select value={f.teamMemberId} onChange={set("teamMemberId")}>
          <option value="">— Not linked —</option>
          {team.map(t=><option key={t.id} value={t.id}>{t.name}{t.role?` · ${t.role}`:""}</option>)}
        </select>
      </Field>
      <p className="hint">Linking lets this user see only their assigned clients when logged in.</p>
    </FormShell>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [session,     setSession]     = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data,        setData]        = useState({ clients:[], income:[], expenses:[], team:[] });
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState("");
  const [view,        setView]        = useState("dashboard");
  const [month,       setMonth]       = useState(curMonth());
  const [modal,       setModal]       = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Check stored session
  useEffect(() => {
    try {
      const s = localStorage.getItem("samadhan_session");
      if (s) setSession(JSON.parse(s));
    } catch {}
    setAuthChecked(true);
  }, []);

  // Fetch all data from backend
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getData();
      setData(d);
    } catch (e) {
      if (e.message.includes("401") || e.message.includes("Unauthorized")) logout();
      else showToast("Error loading data: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (session) refreshData(); }, [session]);

  // ── Generic wrappers ──
  const apiOp = async (fn, successMsg) => {
    try { await fn(); await refreshData(); if (successMsg) showToast(successMsg); }
    catch (e) { showToast("Error: " + e.message); }
  };

  // ── CRUD ──
  const add = (collection, item) =>
    apiOp(() => api[collection].create({ id: uid(), ...item }));

  const del = (collection, id) =>
    apiOp(() => api[collection].delete(id));

  const patch = (collection, id, fields) => {
    const existing = data[collection]?.find(x => x.id === id);
    return apiOp(() => api[collection].update(id, { ...existing, ...fields }));
  };

  const saveSimple = async (key, values) => {
    if (modal?.item) await patch(key, modal.item.id, values);
    else             await add(key, values);
    setModal(null);
  };

  const saveTeam = async (values) => {
    const { clientIds = [], ...member } = values;
    let memberId;
    try {
      if (modal?.item) {
        memberId = modal.item.id;
        await api.team.update(memberId, member);
      } else {
        memberId = uid();
        await api.team.create({ id: memberId, ...member });
      }
      // Update client team assignments
      const affected = data.clients.filter(c =>
        (c.teamIds||[]).includes(memberId) || clientIds.includes(c.id)
      );
      for (const c of affected) {
        const has    = (c.teamIds||[]).includes(memberId);
        const should = clientIds.includes(c.id);
        if (has !== should) {
          const newIds = should
            ? [...(c.teamIds||[]), memberId]
            : (c.teamIds||[]).filter(x => x !== memberId);
          await api.clients.update(c.id, { ...c, teamIds: newIds });
        }
      }
      await refreshData();
      setModal(null);
    } catch (e) { showToast("Error: " + e.message); }
  };

  const deleteTeam = (id) =>
    apiOp(() => api.team.delete(id));

  // ── Billing ──
  const periodOf   = (c) => c.billingType === "project" ? monthKey(c.dueDate) : month;
  const isReceived = (c) => !!(c.paid && c.paid[periodOf(c)]);

  const markReceived = async (c) => {
    const p      = periodOf(c);
    const newPaid = { ...(c.paid||{}), [p]: true };
    try {
      await api.clients.update(c.id, { ...c, paid: newPaid });
      await api.income.create({
        id: uid(),
        type: c.billingType==="retainer" ? "Retainer" : "Project Payment",
        label: `${c.name} · ${p}`,
        amount: Number(c.amount),
        date: todayISO(),
        clientId: c.id,
        period: p,
      });
      await refreshData();
    } catch (e) { showToast("Error: " + e.message); }
  };

  // ── Computed ──
  const isAdmin    = !!session?.isAdmin;
  const myTeamId   = session?.teamMemberId || "";
  const perms      = isAdmin ? ["clients","income","expenses","team","users","incentive"] : (session?.permissions || []);
  const canSeeMoney = isAdmin || !!session?.canSeeMoney;
  const can         = (mod) => isAdmin || perms.includes(mod);

  const visibleClients = useMemo(() => {
    if (isAdmin || !myTeamId) return data.clients;
    return data.clients.filter(
      c => (c.teamIds||[]).includes(myTeamId) || c.projectManagerId === myTeamId
    );
  }, [data.clients, isAdmin, myTeamId]);

  const dues = useMemo(() => visibleClients.filter(c => {
    if (c.billingType==="project")
      return c.dueDate && monthKey(c.dueDate) <= month && !(c.paid && c.paid[monthKey(c.dueDate)]);
    return c.active!==false && !(c.paid && c.paid[month]);
  }), [visibleClients, month]);

  const pendingTotal      = useMemo(() => dues.reduce((s,c) => s+Number(c.amount||0),0),[dues]);
  const incomeThisMonth   = useMemo(() => data.income.filter(i=>monthKey(i.date)===month).reduce((s,i)=>s+Number(i.amount||0),0),[data.income,month]);
  const expensesThisMonth = useMemo(() => data.expenses.filter(e=>monthKey(e.date)===month).reduce((s,e)=>s+Number(e.amount||0),0),[data.expenses,month]);
  const salaries          = useMemo(() => data.team.reduce((s,m)=>s+Number(m.salary||0),0),[data.team]);
  const mrr               = useMemo(() => data.clients.filter(c=>c.billingType==="retainer"&&c.active!==false).reduce((s,c)=>s+Number(c.amount||0),0),[data.clients]);
  const totalSpend        = salaries + expensesThisMonth;
  const net               = incomeThisMonth - totalSpend;
  const teamName          = (id) => data.team.find(t=>t.id===id)?.name || "—";

  const NAV = [
    { id:"dashboard", label:"Dashboard", icon:LayoutDashboard },
    ...(can("clients")  ? [{ id:"clients",  label:"Clients",  icon:Briefcase }]   : []),
    ...(can("income")   ? [{ id:"income",   label:"Income",   icon:TrendingUp }]  : []),
    ...(can("expenses") ? [{ id:"expenses", label:"Expenses", icon:TrendingDown }]: []),
    ...(can("team")      ? [{ id:"team",  label:"Team",  icon:UserCog }]          : []),
    ...(can("users")    ? [{ id:"users", label:"Users", icon:Users }]            : []),
    ...(can("incentive") ? [{ id:"incentive", label:"Incentive", icon:Percent }] : []),
  ];

  const logout = () => {
    localStorage.removeItem("samadhan_jwt");
    localStorage.removeItem("samadhan_session");
    setSession(null);
    setData({ clients:[], income:[], expenses:[], team:[] });
    setView("dashboard");
  };

  if (!authChecked) return null;
  if (!session)     return <LoginScreen onLogin={(u) => setSession(u)}/>;

  return (
    <div className="aos">
      <style>{CSS}</style>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Loading bar */}
      {loading && <div className="loading-bar"/>}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div><div className="brand-name">Samadhan</div><div className="brand-sub">Agency OS</div></div>
        </div>
        <nav>
          {NAV.map(n => {
            const I = n.icon;
            return (
              <button key={n.id} className={"nav-item"+(view===n.id?" active":"")} onClick={()=>setView(n.id)}>
                <I size={18} strokeWidth={1.8}/><span>{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="user-chip">
            <div className="user-av">{(session.name||"?").slice(0,1).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{session.name}</div>
              <div className="user-desig">
                {session.isAdmin ? <><Shield size={10}/> Admin</> : session.designation||"Staff"}
              </div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out"><LogOut size={15}/></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{NAV.find(n=>n.id===view)?.label||"Dashboard"}</h1>
            <p className="crumb">Samadhan Digitech · {monthLabel(month)}</p>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button className="refresh-btn" onClick={refreshData} title="Refresh data">
              <RefreshCw size={15}/>
            </button>
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="month-pick"/>
          </div>
        </header>

        <div className="content">
          {view==="dashboard" && (
            <Dashboard {...{ incomeThisMonth, salaries, expensesThisMonth, totalSpend, net,
              pendingTotal, mrr, dues, data:{...data,clients:visibleClients}, month, isAdmin: canSeeMoney }}/>
          )}
          {view==="clients" && (
            <Clients data={{...data,clients:visibleClients}} del={del}
              markReceived={markReceived} received={isReceived}
              teamName={teamName} month={month} isAdmin={can("clients")}
              onAdd={()=>setModal({type:"client",item:null})}
              onEdit={c=>setModal({type:"client",item:c})}/>
          )}
          {view==="income" && can("income") && (
            <Ledger title="Income" kind="income" rows={data.income} month={month} del={del}
              onAdd={()=>setModal({type:"income",item:null})}
              onEdit={r=>setModal({type:"income",item:r})} canEdit={isAdmin}/>
          )}
          {view==="expenses" && can("expenses") && (
            <Ledger title="Expenses" kind="expenses" rows={data.expenses} month={month} del={del}
              onAdd={()=>setModal({type:"expense",item:null})}
              onEdit={r=>setModal({type:"expense",item:r})} canEdit={isAdmin}/>
          )}
          {view==="team" && (
            <Team data={data} onDelete={deleteTeam} isAdmin={can("team")} canSeeMoney={canSeeMoney}
              onAdd={()=>setModal({type:"team",item:null})}
              onEdit={m=>setModal({type:"team",item:m})}/>
          )}
          {view==="users" && can("users") && <UsersPanel team={data.team}/>}
          {view==="incentive" && can("incentive") && <Incentive data={data}/>}
        </div>
      </main>

      {/* Modals */}
      {modal && (
        <Modal onClose={()=>setModal(null)}>
          {modal.type==="client" && (
            <ClientForm team={data.team} initial={modal.item} onSave={v=>saveSimple("clients",v)}/>
          )}
          {modal.type==="income" && (
            <IncomeForm initial={modal.item} onSave={v=>saveSimple("income",v)}/>
          )}
          {modal.type==="expense" && (
            <ExpenseForm initial={modal.item} onSave={v=>saveSimple("expenses",v)}/>
          )}
          {modal.type==="team" && (
            <TeamForm initial={modal.item} clients={data.clients} isAdmin={isAdmin}
              initialClientIds={modal.item ? data.clients.filter(c=>(c.teamIds||[]).includes(modal.item.id)).map(c=>c.id) : []}
              onSave={saveTeam}/>
          )}
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({ incomeThisMonth,salaries,expensesThisMonth,totalSpend,net,pendingTotal,mrr,dues,data,month,isAdmin }) {
  const sourceBreak  = SOURCES.map(s=>({source:s,count:data.clients.filter(c=>c.source===s).length})).filter(x=>x.count>0);
  const totalClients = data.clients.length || 1;
  return (
    <div className="stack">
      <div className="kpi-grid">
        {isAdmin && <KPI label="Income this month" value={fmtINR(incomeThisMonth)} tone="pos" icon={ArrowUpRight} sub={`Recurring base ${fmtINR(mrr)} / mo`}/>}
        {isAdmin && <KPI label="Total spend" value={fmtINR(totalSpend)} tone="neg" icon={ArrowDownRight} sub={`Salaries ${fmtINR(salaries)} · Other ${fmtINR(expensesThisMonth)}`}/>}
        {isAdmin && <KPI label="Net profit" value={fmtINR(net)} tone={net>=0?"pos":"neg"} icon={Wallet} big/>}
        <KPI label="Pending this month" value={fmtINR(pendingTotal)} tone="warn" icon={Clock}
          sub={`${dues.length} bill${dues.length===1?"":"s"} to collect`} big={!isAdmin}/>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2 className="panel-title">To collect — pending payments</h2>
          {dues.length===0 ? <Empty text="Nothing pending. All caught up."/> : (
            <table className="tbl">
              <thead><tr><th>Client</th><th>Amount</th><th>For</th></tr></thead>
              <tbody>{dues.map(c=>(
                <tr key={c.id}>
                  <td><span className="strong">{c.name}</span> <TypeTag t={c.billingType}/></td>
                  <td>{fmtINR(c.amount)}</td>
                  <td>{c.billingType==="retainer"
                    ? <span className="pill warn">{monthLabel(month)}</span>
                    : <span className="pill warn">{c.dueDate||"—"}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </section>
        <section className="panel">
          <h2 className="panel-title">Where clients came from</h2>
          {sourceBreak.length===0 ? <Empty text="Add clients to see sources."/> : (
            <div className="stack">{sourceBreak.map(s=>(
              <div key={s.source} className="bar-row">
                <div className="bar-label"><span className="dot" style={{background:SOURCE_COLORS[s.source]}}/>{s.source}</div>
                <div className="bar-track"><div className="bar-fill" style={{width:`${(s.count/totalClients)*100}%`,background:SOURCE_COLORS[s.source]}}/></div>
                <span className="bar-count">{s.count}</span>
              </div>
            ))}</div>
          )}
        </section>
      </div>
    </div>
  );
}
function KPI({label,value,tone,icon:I,sub,big}) {
  return (
    <div className={"kpi"+(big?" kpi-big":"")}>
      <div className="kpi-top"><span className="kpi-label">{label}</span><span className={"kpi-icon "+tone}><I size={16} strokeWidth={2}/></span></div>
      <div className={"kpi-value "+tone}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CLIENTS
// ══════════════════════════════════════════════════════════════
function Clients({data,del,markReceived,received,teamName,month,isAdmin,onAdd,onEdit}) {
  const StatusCell = ({c}) => {
    if (c.billingType==="retainer" && c.active===false) return <span className="pill muted-pill">Paused</span>;
    if (c.billingType==="project" && !c.dueDate)        return <span className="muted">—</span>;
    if (received(c))   return <span className="pill pos"><CheckCircle2 size={12}/> Received</span>;
    if (isAdmin)       return <button className="link-btn" onClick={()=>markReceived(c)}>Mark received</button>;
    return <span className="pill warn"><Clock size={12}/> Pending</span>;
  };
  return (
    <div className="stack">
      {isAdmin
        ? <Toolbar count={data.clients.length} noun="client" onAdd={onAdd} addLabel="Add client"/>
        : <div className="toolbar"><span className="count">{data.clients.length} client{data.clients.length!==1?"s":""} assigned to you</span></div>}
      {data.clients.length===0 ? <Empty text={isAdmin?"No clients yet. Add your first one.":"No clients are assigned to you yet."}/> : (
        <div className="panel nopad">
          <table className="tbl">
            <thead><tr>
              <th>Client</th><th>Type</th><th>Source</th><th>Project Manager</th>
              <th>Team</th><th>Billing</th><th>Status · {monthLabel(month)}</th>
              {isAdmin && <th></th>}
            </tr></thead>
            <tbody>{data.clients.map(c=>(
              <tr key={c.id}>
                <td><div className="strong">{c.name}</div><div className="cell-sub">{c.services||"—"}</div></td>
                <td><TypeTag t={c.billingType}/></td>
                <td><span className="pill" style={{background:(SOURCE_COLORS[c.source]||"#9aa3b2")+"22",color:SOURCE_COLORS[c.source]||"#9aa3b2"}}>{c.source||"—"}</span></td>
                <td>{c.projectManagerId ? <span className="pm-name">{teamName(c.projectManagerId)}</span> : <span className="muted">— none —</span>}</td>
                <td><Avatars ids={c.teamIds||[]} team={data.team}/></td>
                <td>{c.billingType==="retainer"
                  ? <><div className="strong">{fmtINR(c.amount)} <span className="cell-sub-inline">/ mo</span></div><div className="cell-sub">{c.active===false?"paused":(c.dueDay?`due ${ordinal(c.dueDay)} monthly`:"monthly")}</div></>
                  : <><div className="strong">{fmtINR(c.amount)}</div><div className="cell-sub">one-time{c.dueDate?` · ${c.dueDate}`:""}</div></>}</td>
                <td><StatusCell c={c}/></td>
                {isAdmin && <td><RowActions onEdit={()=>onEdit(c)} onDelete={()=>del("clients",c.id)}/></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function Avatars({ids,team}) {
  const members = ids.map(id=>team.find(t=>t.id===id)).filter(Boolean);
  if (!members.length) return <span className="muted">—</span>;
  return <div className="avatars">{members.map(m=><span key={m.id} className="mini-av" title={m.name}>{(m.name||"?").slice(0,1).toUpperCase()}</span>)}</div>;
}

// ══════════════════════════════════════════════════════════════
//  LEDGER
// ══════════════════════════════════════════════════════════════
function Ledger({title,kind,rows,month,del,onAdd,onEdit,canEdit=true}) {
  const filtered = rows.filter(r=>monthKey(r.date)===month);
  const total    = filtered.reduce((s,r)=>s+Number(r.amount||0),0);
  return (
    <div className="stack">
      <Toolbar count={filtered.length} noun="entry" onAdd={onAdd} addLabel={`Add ${title.toLowerCase()}`}
        right={canEdit && <span className="total-chip">{title} this month: <b>{fmtINR(total)}</b></span>}/>
      {filtered.length===0 ? <Empty text={`No ${title.toLowerCase()} recorded for this month.`}/> : (
        <div className="panel nopad">
          <table className="tbl">
            <thead><tr><th>Type</th><th>Detail</th><th>Date</th><th>Amount</th>{canEdit && <th></th>}</tr></thead>
            <tbody>{filtered.map(r=>(
              <tr key={r.id}>
                <td className="strong">{r.type}</td>
                <td className="muted">{r.label||"—"}</td>
                <td className="muted">{r.date}</td>
                <td className={kind==="income"?"pos":"neg"}>{fmtINR(r.amount)}</td>
                {canEdit && <td><RowActions onEdit={()=>onEdit(r)} onDelete={()=>del(kind,r.id)}/></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TEAM
// ══════════════════════════════════════════════════════════════
function Team({data,onDelete,onAdd,onEdit,isAdmin,canSeeMoney}) {
  const clientsOf = (id) => data.clients.filter(c=>(c.teamIds||[]).includes(id)||c.projectManagerId===id);
  return (
    <div className="stack">
      {isAdmin
        ? <Toolbar count={data.team.length} noun="member" onAdd={onAdd} addLabel="Add member"/>
        : <div className="toolbar"><span className="count">{data.team.length} team member{data.team.length!==1?"s":""}</span></div>}
      {data.team.length===0 ? <Empty text="No team members yet."/> : (
        <div className="card-grid">{data.team.map(m=>{
          const cl = clientsOf(m.id);
          return (
            <div key={m.id} className="member">
              <div className="member-head">
                <div className="avatar">{(m.name||"?").slice(0,1).toUpperCase()}</div>
                <div className="member-id"><div className="strong">{m.name}</div><div className="muted">{m.role||"—"}</div></div>
                {isAdmin && <RowActions onEdit={()=>onEdit(m)} onDelete={()=>onDelete(m.id)}/>}
              </div>
              {canSeeMoney && m.salary ? <div className="salary">{fmtINR(m.salary)}<span> / month</span></div> : null}
              {m.responsibilities && <p className="resp">{m.responsibilities}</p>}
              <div className="member-clients">
                <span className="mini-label">Working on</span>
                {cl.length===0 ? <span className="muted"> no clients assigned</span>
                  : cl.map(c=>{const isPM=c.projectManagerId===m.id; return <span key={c.id} className={"chip"+(isPM?" pm":"")} title={isPM?"Project Manager":"Team member"}>{c.name}{isPM?" · PM":""}</span>;})}
              </div>
            </div>
          );
        })}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  INCENTIVE
// ══════════════════════════════════════════════════════════════
function Incentive({data}) {
  const [viewing,setViewing] = useState(null);

  const rows = data.team.map(m=>{
    const breakdown = data.clients
      .filter(c=>c.hasIncentive && (c.incentiveSplits||{})[m.id])
      .map(c=>{
        const pool  = Number(c.amount||0) * (Number(c.incentivePercent||0)/100);
        const share = Number(c.incentiveSplits[m.id]||0);
        return { client:c, share, amount: pool * (share/100) };
      });
    const total = breakdown.reduce((s,b)=>s+b.amount,0);
    return { member:m, breakdown, total };
  }).filter(r=>r.breakdown.length>0);

  const grandTotal = rows.reduce((s,r)=>s+r.total,0);

  return (
    <div className="stack">
      <div className="toolbar"><span className="count">{rows.length} team member{rows.length!==1?"s":""} with incentive</span>
        <span className="total-chip">Total incentive: <b>{fmtINR(grandTotal)}</b></span></div>
      {rows.length===0 ? <Empty text="No incentive set up yet. Add one from a client's edit form."/> : (
        <div className="panel nopad">
          <table className="tbl">
            <thead><tr><th>Team member</th><th>Clients</th><th>Total incentive</th><th></th></tr></thead>
            <tbody>{rows.map(r=>(
              <tr key={r.member.id}>
                <td className="strong">{r.member.name}</td>
                <td className="muted">{r.breakdown.length} client{r.breakdown.length!==1?"s":""}</td>
                <td className="pos">{fmtINR(r.total)}</td>
                <td><button className="icon-btn edit" onClick={()=>setViewing(r)} title="View breakdown"><Eye size={16}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {viewing && (
        <Modal onClose={()=>setViewing(null)}>
          <div className="form">
            <h3>{viewing.member.name} — incentive breakdown</h3>
            <div className="incentive-detail" style={{marginTop:16}}>
              {viewing.breakdown.map(b=>(
                <div key={b.client.id} className="incentive-detail-row">
                  <span className="strong">{b.client.name}</span>
                  <span className="muted">{b.share}% of {b.client.incentivePercent}% incentive</span>
                  <span className="pos">{fmtINR(b.amount)}</span>
                </div>
              ))}
            </div>
            <div className="incentive-detail-row" style={{marginTop:10,background:"transparent",fontWeight:600}}>
              <span className="strong">Total</span><span/><span className="pos">{fmtINR(viewing.total)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  FORMS
// ══════════════════════════════════════════════════════════════
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function CheckList({options,selected,onToggle,empty}) {
  if (!options.length) return <div className="checklist mini-empty">{empty}</div>;
  return <div className="checklist">{options.map(o=>(
    <label key={o.id} className={"check-row"+(selected.includes(o.id)?" on":"")}>
      <input type="checkbox" checked={selected.includes(o.id)} onChange={()=>onToggle(o.id)}/><span>{o.label}</span>
    </label>
  ))}</div>;
}

function ClientForm({team,initial,onSave}) {
  const [f,setF] = useState({
    name:initial?.name||"", services:initial?.services||"", source:initial?.source||"Referral",
    billingType:initial?.billingType||"retainer", projectManagerId:initial?.projectManagerId||"",
    teamIds:initial?.teamIds||[], amount:initial?.amount!=null?String(initial.amount):"",
    dueDate:initial?.dueDate||todayISO(), dueDay:initial?.dueDay?String(initial.dueDay):"1",
    active:initial?.active??true, paid:initial?.paid||{},
    hasIncentive:initial?.hasIncentive??false,
    incentivePercent:initial?.incentivePercent!=null?String(initial.incentivePercent):"",
    incentiveSplits:initial?.incentiveSplits||{},
  });
  const set = k=>e=>setF({...f,[k]:e.target.value});
  const toggleTeam = id=>setF(s=>({...s,teamIds:s.teamIds.includes(id)?s.teamIds.filter(x=>x!==id):[...s.teamIds,id]}));
  const setSplit = (id,val)=>setF(s=>({...s,incentiveSplits:{...s.incentiveSplits,[id]:val}}));
  const isRet = f.billingType==="retainer";
  return (
    <FormShell title={initial?"Edit client":"Add client"}
      onSave={()=>{
        if (!f.name) return;
        const incentiveSplits = {};
        f.teamIds.forEach(id=>{ if(f.incentiveSplits[id]!=null && f.incentiveSplits[id]!=="") incentiveSplits[id]=Number(f.incentiveSplits[id])||0; });
        onSave({...f,amount:Number(f.amount)||0,dueDay:isRet?Number(f.dueDay)||1:"",
          incentivePercent:Number(f.incentivePercent)||0, incentiveSplits});
      }}>
      <Field label="Client name"><input value={f.name} onChange={set("name")} placeholder="e.g. Technomatic Industries"/></Field>
      <Field label="Services offered"><input value={f.services} onChange={set("services")} placeholder="Meta Ads, SEO, Social"/></Field>
      <div className="row2">
        <Field label="Billing type">
          <select value={f.billingType} onChange={set("billingType")}>
            <option value="retainer">Retainer (monthly)</option>
            <option value="project">One-time project</option>
          </select>
        </Field>
        <Field label="Source">
          <select value={f.source} onChange={set("source")}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select>
        </Field>
      </div>
      {isRet ? (
        <div className="row2">
          <Field label="Monthly fee (₹)"><input type="number" value={f.amount} onChange={set("amount")} placeholder="25000"/></Field>
          <Field label="Due day of month"><input type="number" min="1" max="28" value={f.dueDay} onChange={set("dueDay")} placeholder="5"/></Field>
        </div>
      ) : (
        <div className="row2">
          <Field label="Project fee (₹)"><input type="number" value={f.amount} onChange={set("amount")} placeholder="60000"/></Field>
          <Field label="Due date"><input type="date" value={f.dueDate} onChange={set("dueDate")}/></Field>
        </div>
      )}
      {isRet && (
        <label className="checkbox-row">
          <input type="checkbox" checked={f.active} onChange={e=>setF({...f,active:e.target.checked})}/>
          <span>Active — currently billing each month</span>
        </label>
      )}
      <div className="row2">
        <Field label="Project Manager">
          <select value={f.projectManagerId} onChange={set("projectManagerId")}>
            <option value="">— None —</option>
            {team.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field><div/>
      </div>
      <Field label="Team working on this client">
        <CheckList options={team.map(t=>({id:t.id,label:`${t.name}${t.role?" · "+t.role:""}`}))}
          selected={f.teamIds} onToggle={toggleTeam} empty="No team members yet — add them in Team tab first."/>
      </Field>
      <label className="checkbox-row">
        <input type="checkbox" checked={f.hasIncentive} onChange={e=>setF({...f,hasIncentive:e.target.checked})}/>
        <span>This client has an incentive for the team</span>
      </label>
      {f.hasIncentive && (
        <>
          <Field label="Incentive — % of client amount">
            <input type="number" min="0" max="100" value={f.incentivePercent} onChange={set("incentivePercent")} placeholder="e.g. 10"/>
          </Field>
          {f.teamIds.length>0 ? (
            <Field label="Distribute incentive among selected team (% share each)">
              <div className="incentive-grid">
                {f.teamIds.map(id=>{
                  const m = team.find(t=>t.id===id);
                  return (
                    <div key={id} className="incentive-row">
                      <span>{m?.name||"—"}</span>
                      <input type="number" min="0" max="100" value={f.incentiveSplits[id]??""}
                        onChange={e=>setSplit(id,e.target.value)} placeholder="%"/>
                    </div>
                  );
                })}
              </div>
              <p className="hint">Each box is that person's share of the incentive pool — e.g. 50 and 50 splits it evenly.</p>
            </Field>
          ) : <p className="hint">Select team members above to distribute the incentive between them.</p>}
        </>
      )}
    </FormShell>
  );
}

function IncomeForm({initial,onSave}) {
  const [f,setF] = useState({type:initial?.type||"Client Payment",label:initial?.label||"",amount:initial?.amount!=null?String(initial.amount):"",date:initial?.date||todayISO()});
  const set = k=>e=>setF({...f,[k]:e.target.value});
  return (
    <FormShell title={initial?"Edit income":"Add income"} onSave={()=>f.amount&&onSave({...f,amount:Number(f.amount)})}>
      <Field label="Type"><input value={f.type} onChange={set("type")} placeholder="Client Payment / Other"/></Field>
      <Field label="Detail / from"><input value={f.label} onChange={set("label")} placeholder="e.g. Dr. Garage retainer"/></Field>
      <div className="row2">
        <Field label="Amount (₹)"><input type="number" value={f.amount} onChange={set("amount")} placeholder="25000"/></Field>
        <Field label="Date"><input type="date" value={f.date} onChange={set("date")}/></Field>
      </div>
    </FormShell>
  );
}

function ExpenseForm({initial,onSave}) {
  const [f,setF] = useState({type:initial?.type||"Ad Spend",label:initial?.label||"",amount:initial?.amount!=null?String(initial.amount):"",date:initial?.date||todayISO()});
  const set = k=>e=>setF({...f,[k]:e.target.value});
  const presets = ["Ad Spend","Tools & Software","Office / Rent","Freelancer","Misc"];
  return (
    <FormShell title={initial?"Edit expense":"Add expense"} onSave={()=>f.amount&&onSave({...f,amount:Number(f.amount)})}>
      <Field label="Type">
        <input list="exp-presets" value={f.type} onChange={set("type")} placeholder="Type or pick"/>
        <datalist id="exp-presets">{presets.map(p=><option key={p} value={p}/>)}</datalist>
      </Field>
      <Field label="Detail"><input value={f.label} onChange={set("label")} placeholder="e.g. Canva Pro"/></Field>
      <div className="row2">
        <Field label="Amount (₹)"><input type="number" value={f.amount} onChange={set("amount")} placeholder="2000"/></Field>
        <Field label="Date"><input type="date" value={f.date} onChange={set("date")}/></Field>
      </div>
      <p className="hint">Monthly salaries are pulled automatically from the Team tab.</p>
    </FormShell>
  );
}

function TeamForm({initial,clients,initialClientIds,onSave,isAdmin=true}) {
  const [f,setF] = useState({name:initial?.name||"",role:initial?.role||"",salary:initial?.salary!=null?String(initial.salary):"",responsibilities:initial?.responsibilities||"",clientIds:initialClientIds||[]});
  const set = k=>e=>setF({...f,[k]:e.target.value});
  const toggleClient = id=>setF(s=>({...s,clientIds:s.clientIds.includes(id)?s.clientIds.filter(x=>x!==id):[...s.clientIds,id]}));
  return (
    <FormShell title={initial?"Edit team member":"Add team member"} onSave={()=>f.name&&onSave({...f,salary:Number(f.salary)||0})}>
      <div className="row2">
        <Field label="Name"><input value={f.name} onChange={set("name")} placeholder="e.g. Ranjan"/></Field>
        <Field label="Role"><input value={f.role} onChange={set("role")} placeholder="Graphic Designer"/></Field>
      </div>
      {isAdmin && <Field label="Monthly salary (₹)"><input type="number" value={f.salary} onChange={set("salary")} placeholder="30000"/></Field>}
      <Field label="Responsibilities"><textarea value={f.responsibilities} onChange={set("responsibilities")} rows={2} placeholder="Creatives, thumbnails..."/></Field>
      <Field label="Clients this member works on">
        <CheckList options={clients.map(c=>({id:c.id,label:c.name}))} selected={f.clientIds} onToggle={toggleClient} empty="No clients yet."/>
      </Field>
      <p className="hint">To set Project Manager, use the Clients tab.</p>
    </FormShell>
  );
}

function FormShell({title,children,onSave}) {
  return (
    <div className="form"><h3>{title}</h3><div className="form-body">{children}</div>
    <div className="form-actions"><button className="btn primary" onClick={onSave}>Save</button></div></div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────
function TypeTag({t}) {
  return <span className={"type-tag "+(t==="retainer"?"type-ret":"type-proj")}>{t==="retainer"?<><Repeat size={10}/> Retainer</>:"One-time"}</span>;
}
function RowActions({onEdit,onDelete}) {
  return <div className="row-actions"><button className="icon-btn edit" onClick={onEdit} title="Edit"><Pencil size={15}/></button><button className="icon-btn" onClick={onDelete} title="Delete"><Trash2 size={15}/></button></div>;
}
function Toolbar({count,noun,onAdd,addLabel,right}) {
  return <div className="toolbar"><span className="count">{count} {noun}{count===1?"":"s"}</span><div className="toolbar-right">{right}<button className="btn primary" onClick={onAdd}><Plus size={16}/> {addLabel}</button></div></div>;
}
function Empty({text}) { return <div className="empty">{text}</div>; }
function Modal({children,onClose}) {
  return <div className="overlay" onClick={onClose}><div className="sheet" onClick={e=>e.stopPropagation()}><button className="sheet-close" onClick={onClose}><X size={18}/></button>{children}</div></div>;
}

// ══════════════════════════════════════════════════════════════
//  CSS
// ══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Spline+Sans:wght@400;500;600&display=swap');
.aos *{box-sizing:border-box;margin:0;padding:0}
.aos{--navy:#0A1A33;--navy2:#13294d;--gold:#C9A24B;--gold2:#e0c074;--cream:#F6F2E9;--paper:#fffdf8;--ink:#16213a;--muted:#7c869b;--line:#e9e2d3;--pos:#2f7d5b;--neg:#b4513f;--warn:#b7822a;display:flex;min-height:100vh;font-family:'Spline Sans',sans-serif;color:var(--ink);background:var(--cream)}
.aos input,.aos select,.aos textarea,.aos button{font-family:inherit}
.login-wrap{min-height:100vh;display:grid;place-items:center;background:var(--cream,#F6F2E9);font-family:'Spline Sans',sans-serif;--navy:#0A1A33;--navy2:#13294d;--gold:#C9A24B;--gold2:#e0c074;--cream:#F6F2E9;--paper:#fffdf8;--ink:#16213a;--muted:#7c869b;--line:#e9e2d3}
.login-card{background:#fffdf8;border:1px solid #e9e2d3;border-radius:20px;padding:36px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(10,26,51,.12)}
.login-brand{display:flex;align-items:center;gap:12px;margin-bottom:28px}
.brand-mark{width:38px;height:38px;border-radius:9px;background:linear-gradient(145deg,#C9A24B,#e0c074);display:grid;place-items:center;font-family:'Fraunces',serif;font-weight:700;color:#0A1A33;font-size:21px}
.brand-name{font-family:'Fraunces',serif;font-weight:600;font-size:18px;color:#0A1A33}
.brand-sub{font-size:11px;color:#e0c074;letter-spacing:1.5px;text-transform:uppercase}
.login-title{font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:#0A1A33}
.login-sub{font-size:13.5px;color:#7c869b;margin-top:4px;margin-bottom:22px}
.login-error{background:#fdecea;border:1px solid #f5c6c2;color:#b4513f;border-radius:9px;padding:10px 14px;font-size:13px;margin-bottom:14px}
.login-fields{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
.login-btn{width:100%;justify-content:center;padding:12px}
.login-hint{text-align:center;font-size:12px;color:#7c869b;margin-top:14px}
.pw-wrap{position:relative;display:flex;align-items:center}
.pw-wrap input{width:100%;padding-right:38px}
.pw-eye{position:absolute;right:10px;background:transparent;border:0;cursor:pointer;color:#7c869b;padding:4px;display:flex;align-items:center}
.pw-eye:hover{color:#16213a}
.sidebar{width:236px;background:var(--navy);color:#fff;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:11px;padding:0 6px 26px}
.brand-name{font-family:'Fraunces',serif;font-weight:600;font-size:18px}
.brand-sub{font-size:11px;color:var(--gold2);letter-spacing:1.5px;text-transform:uppercase}
.sidebar nav{display:flex;flex-direction:column;gap:3px}
.nav-item{display:flex;align-items:center;gap:11px;padding:11px 12px;border:0;background:transparent;color:#aeb8cc;border-radius:9px;cursor:pointer;font-size:14.5px;text-align:left;transition:.15s}
.nav-item:hover{background:rgba(255,255,255,.06);color:#fff}
.nav-item.active{background:var(--gold);color:var(--navy);font-weight:600}
.side-foot{margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,.08)}
.user-chip{display:flex;align-items:center;gap:10px;padding:8px 6px}
.user-av{width:34px;height:34px;border-radius:9px;background:linear-gradient(145deg,var(--gold),var(--gold2));display:grid;place-items:center;font-family:'Fraunces',serif;font-weight:700;color:var(--navy);font-size:16px;flex-shrink:0}
.user-info{flex:1;min-width:0}
.user-name{font-size:13.5px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-desig{font-size:11px;color:var(--gold2);display:flex;align-items:center;gap:4px;margin-top:1px}
.logout-btn{border:0;background:transparent;color:#5d6b86;cursor:pointer;padding:5px;border-radius:6px;display:flex;align-items:center;flex-shrink:0}
.logout-btn:hover{color:#fff;background:rgba(255,255,255,.1)}
.role-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:600}
.admin-pill{background:linear-gradient(145deg,var(--gold),var(--gold2));color:var(--navy)}
.staff-pill{background:#eee9de;color:var(--muted)}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{display:flex;justify-content:space-between;align-items:flex-end;padding:26px 34px 20px;border-bottom:1px solid var(--line);background:var(--paper)}
.topbar h1{font-family:'Fraunces',serif;font-size:27px;font-weight:600;color:var(--navy)}
.crumb{font-size:13px;color:var(--muted);margin-top:3px}
.month-pick{border:1px solid var(--line);background:#fff;padding:9px 12px;border-radius:9px;font-size:13.5px;color:var(--ink)}
.refresh-btn{border:1px solid var(--line);background:#fff;padding:9px;border-radius:9px;cursor:pointer;color:var(--muted);display:flex;align-items:center}
.refresh-btn:hover{color:var(--navy)}
.content{padding:28px 34px 60px}
.stack{display:flex;flex-direction:column;gap:20px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.kpi{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:18px 18px 16px}
.kpi-big{background:linear-gradient(155deg,var(--navy),var(--navy2));border-color:var(--navy)}
.kpi-big .kpi-label,.kpi-big .kpi-sub{color:#9fb0cc}
.kpi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.kpi-label{font-size:12.5px;color:var(--muted)}
.kpi-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center}
.kpi-icon.pos{background:#e4f0ea;color:var(--pos)}.kpi-icon.neg{background:#f6e6e2;color:var(--neg)}.kpi-icon.warn{background:#f6eed8;color:var(--warn)}
.kpi-value{font-family:'Fraunces',serif;font-size:27px;font-weight:600;line-height:1;color:var(--navy)}
.kpi-big .kpi-value{color:#fff}.kpi-big .kpi-value.neg{color:#f0a899}
.kpi-sub{font-size:11.5px;color:var(--muted);margin-top:8px}
.two-col{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}
.panel{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:20px}
.panel.nopad{padding:0;overflow:auto}
.panel.nopad .tbl{min-width:800px}
.panel.nopad .tbl th:last-child,.panel.nopad .tbl td:last-child{position:sticky;right:0;background:var(--paper);box-shadow:-9px 0 10px -7px rgba(10,26,51,.12)}
.panel.nopad .tbl tbody tr:hover td:last-child{background:#fbf8f1}
.panel-title{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--navy);margin-bottom:14px}
.tbl{width:100%;border-collapse:collapse;font-size:13.5px}
.tbl th{text-align:left;font-weight:500;color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:.6px;padding:13px 16px;border-bottom:1px solid var(--line);white-space:nowrap}
.tbl td{padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.tbl tr:last-child td{border-bottom:0}
.tbl tbody tr:hover{background:#fbf8f1}
.strong{font-weight:600;color:var(--navy)}.muted{color:var(--muted)}
.cell-sub{font-size:12px;color:var(--muted);margin-top:2px}
.cell-sub-inline{font-size:12px;color:var(--muted);font-weight:400}
.pos{color:var(--pos);font-weight:600}.neg{color:var(--neg);font-weight:600}
.pm-name{font-weight:600;color:var(--navy)}
.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:500}
.pill.pos{background:#e4f0ea;color:var(--pos)}.pill.warn{background:#f6eed8;color:var(--warn)}
.muted-pill{background:#eee9de;color:var(--muted)}
.type-tag{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap}
.type-ret{background:linear-gradient(145deg,var(--gold),var(--gold2));color:var(--navy)}
.type-proj{background:transparent;color:var(--navy);border:1px solid var(--line)}
.link-btn{border:0;background:transparent;color:var(--gold);cursor:pointer;font-weight:600;font-size:13px;text-decoration:underline;text-underline-offset:2px}
.row-actions{display:flex;gap:2px;justify-content:flex-end}
.icon-btn{border:0;background:transparent;color:#c2b9a6;cursor:pointer;padding:5px;border-radius:6px}
.icon-btn:hover{color:var(--neg);background:#f6e6e2}
.icon-btn.edit:hover{color:var(--navy);background:#eee6d4}
.avatars{display:flex}
.mini-av{width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:600;margin-left:-6px;border:2px solid var(--paper)}
.mini-av:first-child{margin-left:0}
.bar-row{display:flex;align-items:center;gap:12px}
.bar-label{width:120px;font-size:13px;display:flex;align-items:center;gap:8px}
.dot{width:9px;height:9px;border-radius:50%}
.bar-track{flex:1;height:9px;background:#efe9da;border-radius:6px;overflow:hidden}
.bar-fill{height:100%;border-radius:6px;transition:width .4s}
.bar-count{width:24px;text-align:right;font-weight:600;color:var(--navy);font-size:13px}
.toolbar{display:flex;justify-content:space-between;align-items:center}
.count{font-size:13.5px;color:var(--muted)}
.toolbar-right{display:flex;align-items:center;gap:14px}
.total-chip{font-size:13px;color:var(--muted)}.total-chip b{color:var(--navy)}
.btn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:9px;padding:10px 15px;font-size:13.5px;font-weight:600;cursor:pointer;transition:.15s}
.btn.primary{background:var(--navy);color:#fff}.btn.primary:hover{background:var(--navy2)}
.btn:disabled{opacity:.6;cursor:not-allowed}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.member{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:18px}
.member-head{display:flex;align-items:center;gap:12px}
.avatar{width:42px;height:42px;border-radius:11px;background:linear-gradient(145deg,var(--gold),var(--gold2));display:grid;place-items:center;font-family:'Fraunces',serif;font-weight:700;color:var(--navy);font-size:19px}
.member-id{flex:1}
.salary{font-family:'Fraunces',serif;font-size:19px;font-weight:600;color:var(--navy);margin:14px 0 4px}
.salary span{font-family:'Spline Sans';font-size:12px;font-weight:400;color:var(--muted)}
.resp{font-size:13px;color:#566;line-height:1.5;margin:6px 0 12px}
.member-clients{border-top:1px solid var(--line);padding-top:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.mini-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-right:4px;width:100%}
.chip{background:var(--navy);color:#fff;font-size:11.5px;padding:3px 9px;border-radius:20px}
.chip.pm{background:linear-gradient(145deg,var(--gold),var(--gold2));color:var(--navy);font-weight:600}
.empty{padding:46px;text-align:center;color:var(--muted);background:var(--paper);border:1px dashed var(--line);border-radius:15px;font-size:14px}
.overlay{position:fixed;inset:0;background:rgba(10,26,51,.55);backdrop-filter:blur(3px);display:grid;place-items:center;padding:20px;z-index:50}
.sheet{background:var(--paper);border-radius:18px;width:100%;max-width:520px;position:relative;box-shadow:0 30px 70px rgba(10,26,51,.35);max-height:92vh;overflow-y:auto}
.sheet::-webkit-scrollbar{width:10px}
.sheet::-webkit-scrollbar-thumb{background:#e0d8c6;border-radius:8px;border:3px solid var(--paper)}
.sheet-close{position:absolute;top:16px;right:16px;width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;cursor:pointer;color:var(--muted);transition:background .15s,color .15s}
.sheet-close:hover{background:#f0e9d8;color:var(--navy)}
.form{padding:26px}
.form h3{font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:var(--navy);margin-bottom:18px}
.form-body{display:flex;flex-direction:column;gap:14px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{display:flex;flex-direction:column;gap:6px}
.field>span{font-size:12.5px;color:var(--muted);font-weight:500}
.field input,.field select,.field textarea{border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-size:14px;background:#fff;color:var(--ink);width:100%}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--gold)}
.checklist{border:1px solid var(--line);border-radius:9px;background:#fff;max-height:260px;overflow-y:auto;padding:5px;display:flex;flex-direction:column;gap:2px}
.checklist::-webkit-scrollbar{width:8px}
.checklist::-webkit-scrollbar-thumb{background:#e8e0cf;border-radius:8px;border:2px solid #fff}
.check-row{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:7px;cursor:pointer;font-size:13.5px;transition:background .12s}
.check-row:hover{background:#fbf8f1}.check-row.on{background:#f6eed8}
.check-row input{width:16px;height:16px;accent-color:var(--navy);cursor:pointer}
.checkbox-row{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--ink);background:#fbf8f1;padding:11px;border-radius:9px;cursor:pointer;line-height:1.4}
.checkbox-row input{width:16px;height:16px;margin-top:1px;accent-color:var(--navy);cursor:pointer;flex-shrink:0}
.mini-empty{padding:14px;font-size:12.5px;color:var(--muted);text-align:center}
.hint{font-size:12px;color:var(--muted);background:#f6eed8;padding:9px 11px;border-radius:8px}
.incentive-grid{display:flex;flex-direction:column;gap:8px;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff}
.incentive-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.incentive-row span:first-child{font-size:13.5px;color:var(--ink)}
.incentive-row input{width:80px;border:1px solid var(--line);border-radius:7px;padding:7px 9px;font-size:13px;text-align:right}
.incentive-toggle-row{cursor:pointer}
.incentive-toggle-row:hover td{background:#fbf8f1}
.incentive-detail{display:flex;flex-direction:column;gap:6px;padding:10px 4px 14px}
.incentive-detail-row{display:flex;align-items:center;gap:14px;font-size:13px;padding:6px 10px;background:#fbf8f1;border-radius:8px}
.incentive-detail-row span:nth-child(2){flex:1;color:var(--muted)}
.form-actions{margin-top:22px;display:flex;justify-content:flex-end}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:11px 22px;border-radius:30px;font-size:13.5px;font-weight:500;z-index:200;box-shadow:0 8px 30px rgba(10,26,51,.3);pointer-events:none;animation:fadeup .25s ease}
@keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.loading-bar{position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold2));z-index:300;animation:slide 1.2s ease-in-out infinite}
@keyframes slide{0%{left:0;right:100%}50%{left:0;right:0}100%{left:100%;right:0}}
@media(max-width:880px){.aos{flex-direction:column}.sidebar{width:100%;height:auto;position:relative;flex-direction:row;align-items:center;padding:12px 14px;overflow-x:auto}.brand{padding:0 14px 0 4px}.sidebar nav{flex-direction:row}.side-foot{display:none}.kpi-grid{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr}.content{padding:20px 16px 50px}.topbar{padding:18px 16px}}
`;
