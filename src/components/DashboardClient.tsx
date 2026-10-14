"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Pencil,
  Trash2,
  UserPlus,
  RefreshCw,
  FileText,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AlertModal from "@/components/AlertModal";
import ConfirmModal from "@/components/ConfirmModal";
import { authHeaders, getSessionUser, isLoggedIn } from "@/lib/session";
import { getRecentInvoices } from "@/lib/idb";
import type { AlertState, AppUser, DeliveryOrder, InvoiceStatus } from "@/lib/types";

const STATUSES: InvoiceStatus[] = ["In Transit", "Delivered", "Cancelled"];

export default function DashboardClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [history, setHistory] = useState<DeliveryOrder[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<DeliveryOrder | null>(null);
  const [statusValue, setStatusValue] = useState<InvoiceStatus>("In Transit");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userForm, setUserForm] = useState({
    full_name: "",
    username: "",
    password: "",
    role: "user",
    is_active: true,
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
      return;
    }
    const u = getSessionUser();
    setIsAdmin(u?.role === "admin");
    setReady(true);
    loadHistory();
    if (u?.role === "admin") loadUsers();
  }, [router]);

  async function loadHistory() {
    const items = await getRecentInvoices();
    setHistory(items);
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users", { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
      else console.error("Failed to load users:", data.error);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  }

  async function updateStatus() {
    if (!statusTarget) return;
    try {
      const res = await fetch(`/api/invoices/${statusTarget.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: statusValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          isOpen: true,
          title: "Failed",
          message:
            data.error ||
            "Failed to update status in database. Please check your connection.",
          type: "error",
        });
        return;
      }
      setAlert({
        isOpen: true,
        title: "Success",
        message: "Successfully updated status in Supabase",
        type: "success",
      });
      setStatusTarget(null);
      loadHistory();
    } catch (e) {
      console.error("Failed to update Supabase status:", e);
      setAlert({
        isOpen: true,
        title: "Failed",
        message: "Failed to update status in database.",
        type: "error",
      });
    }
  }

  async function saveUser(e: FormEvent) {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            full_name: userForm.full_name,
            role: userForm.role,
            is_active: userForm.is_active,
            ...(userForm.password ? { password: userForm.password } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAlert({
            isOpen: true,
            title: "Failed",
            message: data.error || "Failed to update user",
            type: "error",
          });
          return;
        }
        setAlert({
          isOpen: true,
          title: "Success",
          message: "User updated successfully",
          type: "success",
        });
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) {
          setAlert({
            isOpen: true,
            title: "Failed",
            message: data.error || "Failed to create user",
            type: "error",
          });
          return;
        }
        setAlert({
          isOpen: true,
          title: "Success",
          message: "User created successfully",
          type: "success",
        });
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({
        full_name: "",
        username: "",
        password: "",
        role: "user",
        is_active: true,
      });
      loadUsers();
    } catch (err) {
      setAlert({
        isOpen: true,
        title: "Failed",
        message: String(err),
        type: "error",
      });
    }
  }

  async function deleteUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          isOpen: true,
          title: "Failed",
          message: data.error || "Failed to delete user",
          type: "error",
        });
        return;
      }
      setAlert({
        isOpen: true,
        title: "Success",
        message: "User deleted successfully",
        type: "success",
      });
      setConfirmDelete(null);
      loadUsers();
    } catch (e) {
      setAlert({
        isOpen: true,
        title: "Failed",
        message: "Failed to delete user: " + String(e),
        type: "error",
      });
    }
  }

  function reopenInvoice(order: DeliveryOrder) {
    sessionStorage.setItem("currentOrder", JSON.stringify(order));
    router.push(`/order/edit?id=${order.id}`);
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-cairo">
      <AppHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History */}
          <section className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#204978]">
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-bold">History</h2>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Recent 5 Downloaded Invoices
            </p>

            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No invoices downloaded yet. Downloaded invoices will be saved
                here (max 5).
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((inv) => (
                  <div
                    key={inv.id + inv.createdAt}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          Invoice #: #{inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(inv.createdAt).toLocaleString()}
                        </p>
                        {inv.status && (
                          <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                            {inv.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => reopenInvoice(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#204978] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Open / Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTarget(inv);
                            setStatusValue(inv.status || "In Transit");
                          }}
                          className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick actions / Users */}
          <section className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#204978]">
              Quick Actions
            </h2>
            <button
              type="button"
              onClick={() => router.push("/order/new")}
              className="mb-6 w-full rounded-xl bg-[#204978] py-3 text-sm font-bold text-white hover:bg-[#18365a]"
            >
              Create New Invoice
            </button>

            {isAdmin && (
              <>
                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-slate-800">User Management</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({
                        full_name: "",
                        username: "",
                        password: "",
                        role: "user",
                        is_active: true,
                      });
                      setShowUserForm(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-800"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add User
                  </button>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-auto">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-lg border border-gray-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {u.full_name || u.username}
                          </p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                          <div className="mt-1 flex gap-1">
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                              {u.role}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                u.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setUserForm({
                                full_name: u.full_name || "",
                                username: u.username,
                                password: "",
                                role: u.role,
                                is_active: u.is_active,
                              });
                              setShowUserForm(true);
                            }}
                            className="rounded-lg bg-gray-100 p-1.5 text-gray-700 hover:bg-gray-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(u.id)}
                            className="rounded-lg bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Status modal */}
      {statusTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">Update Invoice Status</h3>
            <p className="mt-1 text-sm text-slate-500">
              Invoice #: #{statusTarget.invoiceNumber}
            </p>
            <select
              value={statusValue || "In Transit"}
              onChange={(e) =>
                setStatusValue(e.target.value as InvoiceStatus)
              }
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {STATUSES.map((s) => (
                <option key={s!} value={s!}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateStatus}
                className="rounded-lg bg-[#204978] px-4 py-2 text-sm font-semibold text-white"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User form modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveUser}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-3"
          >
            <h3 className="text-lg font-bold">
              {editingUser ? "Update User" : "Add New User"}
            </h3>
            <input
              placeholder="Full Name *"
              required
              value={userForm.full_name}
              onChange={(e) =>
                setUserForm({ ...userForm, full_name: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {!editingUser && (
              <input
                placeholder="Username *"
                required
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({ ...userForm, username: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            )}
            <input
              type="password"
              placeholder={
                editingUser
                  ? "New Password (leave empty to keep current)"
                  : "Password *"
              }
              required={!editingUser}
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={userForm.is_active}
                onChange={(e) =>
                  setUserForm({ ...userForm, is_active: e.target.checked })
                }
              />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUserForm(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#204978] px-4 py-2 text-sm font-semibold text-white"
              >
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title="Delete user"
        message="Are you sure you want to delete this user?"
        confirmText="Delete"
        danger
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteUser(confirmDelete)}
      />
    </div>
  );
}
