const BASE = import.meta.env.PROD
  ? "https://backend-jqy8.onrender.com/api"
  : "http://localhost:3001/api";

const token = () => localStorage.getItem("samadhan_jwt");

async function call(path, opts = {}) {
  const t = token();
  const res = await fetch(BASE + path, {
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    ...opts,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login:   (username, password) => call("/auth/login", { method: "POST", body: { username, password } }),
  getData: ()                   => call("/data"),

  clients: {
    create: (d)     => call("/clients",      { method: "POST",   body: d }),
    update: (id, d) => call(`/clients/${id}`,{ method: "PUT",    body: d }),
    delete: (id)    => call(`/clients/${id}`,{ method: "DELETE" }),
  },
  income: {
    create: (d)     => call("/income",       { method: "POST",   body: d }),
    update: (id, d) => call(`/income/${id}`, { method: "PUT",    body: d }),
    delete: (id)    => call(`/income/${id}`, { method: "DELETE" }),
  },
  expenses: {
    create: (d)     => call("/expenses",        { method: "POST",   body: d }),
    update: (id, d) => call(`/expenses/${id}`,  { method: "PUT",    body: d }),
    delete: (id)    => call(`/expenses/${id}`,  { method: "DELETE" }),
  },
  team: {
    create: (d)     => call("/team",         { method: "POST",   body: d }),
    update: (id, d) => call(`/team/${id}`,   { method: "PUT",    body: d }),
    delete: (id)    => call(`/team/${id}`,   { method: "DELETE" }),
  },
  users: {
    list:   ()      => call("/users"),
    create: (d)     => call("/users",        { method: "POST",   body: d }),
    update: (id, d) => call(`/users/${id}`,  { method: "PUT",    body: d }),
    delete: (id)    => call(`/users/${id}`,  { method: "DELETE" }),
  },
};
