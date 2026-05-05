"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; full_name: string; email: string; status: string; paid: boolean; created_at: string };

export default function StudentsPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false });
    if (error) console.error("Load error:", error);
    setStudents(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setError("");
    setActionId(id);
    try {
      const res = await fetch("/api/auth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Failed: ${data.error || res.status}`);
      } else {
        await load();
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
    setActionId(null);
  };

  const filtered = students.filter(s => filter === "all" ? true : s.status === filter);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Students</h1>
      <p className="text-gray-500 mb-6">Manage student access to your course.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-brand text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-brand"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No students found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-800">{s.full_name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{s.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.paid ? "Paid" : "Free"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${s.status === "approved" ? "bg-green-100 text-green-700" : s.status === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {s.status !== "approved" && (
                        <button onClick={() => handleAction(s.id, "approved")} disabled={actionId === s.id}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          {actionId === s.id ? "..." : "Approve"}
                        </button>
                      )}
                      {s.status !== "rejected" && (
                        <button onClick={() => handleAction(s.id, "rejected")} disabled={actionId === s.id}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          {actionId === s.id ? "..." : "Reject"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
