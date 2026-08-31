"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRole, useAdminUsername } from "@/components/admin/AdminProvider";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const role = useAdminRole();
  const me = useAdminUsername();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("intake");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load staff accounts.");
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load staff accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, password, role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create user.");
      setUsername("");
      setName("");
      setPassword("");
      setNewRole("intake");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Update failed.");
    }
  }

  async function resetPassword(u: UserRow) {
    const pw = prompt(`New password for "${u.username}" (min 8 chars):`);
    if (!pw) return;
    if (pw.length < 8) return alert("Password must be at least 8 characters.");
    await patchUser(u.id, { password: pw });
    alert("Password updated.");
  }

  async function removeUser(u: UserRow) {
    if (!confirm(`Delete staff account "${u.username}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Delete failed.");
  }

  if (role !== "manager") {
    return (
      <AdminShell>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
          Only managers can manage staff accounts.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <ShieldCheck className="h-5 w-5 text-[#001f97]" /> Staff Accounts
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Create the four role logins. Each staffer sees only the parts of the CRM their role owns.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Create form */}
      <form
        onSubmit={createUser}
        className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
          <UserPlus className="h-4 w-4 text-[#001f97]" /> Add staff login
        </h2>
        {formError ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97]"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97]"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97]"
            placeholder="Password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#001f97]"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-[#001f97] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </form>

      {/* List */}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No staff accounts yet. Create the first one above.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.username}
                    {u.username === me ? (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        you
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.name}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={u.role}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => patchUser(u.id, { active: !u.active })}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {u.active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => resetPassword(u)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Reset password
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        disabled={u.username === me}
                        className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                        title={u.username === me ? "You can't delete your own account" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
