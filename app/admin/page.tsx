"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import PinPad from "../../components/PinPad";

const ADMIN_PASSWORD = "Charlie1201!";

type PinRow = {
  person: string;
  pin: string;
};

type AccountRequest = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  how_heard: string | null;
  handled: boolean;
  created_at: string;
};

const NAME_MAP: Record<string, string> = {
  eben: "Eben Copple",
  steph: "Stephanie Berry",
  lindy: "Lindy McKinnon",
  michael: "Michael Berry",
};

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [pins, setPins] = useState<PinRow[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);

  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");

  const unlock = () => {
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setError("");
      loadData();
    } else {
      setError("Incorrect admin password.");
    }
  };

  const loadData = async () => {
    const { data: pinData } = await supabase.from("pins").select("*");
    const { data: reqData } = await supabase
      .from("account_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (pinData) setPins(pinData as PinRow[]);
    if (reqData) setRequests(reqData as AccountRequest[]);
  };

  const resetPin = async () => {
    if (!resetTarget || newPin.length !== 4) return;

    await supabase
      .from("pins")
      .upsert({ person: resetTarget, pin: newPin });

    setResetTarget(null);
    setNewPin("");
    loadData();
  };

  const markHandled = async (id: string) => {
    await supabase
      .from("account_requests")
      .update({ handled: true })
      .eq("id", id);

    loadData();
  };

  /* 🔒 LOCK SCREEN */
  if (!unlocked) {
    return (
      <main className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Admin Access</h1>
        <p className="text-sm mb-4">Enter the admin password to continue.</p>

        <input
          type="password"
          className="w-full border rounded-xl p-3 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-black text-white rounded-xl py-3"
          onClick={unlock}
        >
          Unlock
        </button>

        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

        <a href="/" className="block text-xs underline mt-4 text-center">
          Back
        </a>
      </main>
    );
  }

  /* 👑 ADMIN DASHBOARD */
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>

      {/* USERS */}
      <section>
        <h2 className="text-xl font-semibold mb-3">User Accounts</h2>

        <div className="space-y-2">
          {pins.map((p) => (
            <div
              key={p.person}
              className="border rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">{NAME_MAP[p.person]}</div>
                <div className="text-sm text-gray-600">
                  Username: {p.person} · PIN: <strong>{p.pin}</strong>
                </div>
              </div>

              <button
                className="text-sm underline"
                onClick={() => setResetTarget(p.person)}
              >
                Reset PIN
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ACCOUNT REQUESTS */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Account Requests</h2>

        {requests.length === 0 && (
          <p className="text-sm text-gray-600">No requests yet.</p>
        )}

        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className={`border rounded-xl p-3 ${
                r.handled ? "opacity-50" : ""
              }`}
            >
              <div className="font-semibold">
                {r.first_name} {r.last_name}
              </div>
              <div className="text-sm">
                Email: {r.email}
                <br />
                Phone: {r.phone || "—"}
                <br />
                Heard from: {r.how_heard || "—"}
              </div>

              {!r.handled && (
                <button
                  className="mt-2 text-sm underline"
                  onClick={() => markHandled(r.id)}
                >
                  Mark as Handled
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* RESET PIN MODAL */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-2">
              Reset PIN for {NAME_MAP[resetTarget]}
            </h3>

            <PinPad value={newPin} onChange={setNewPin} />

            <button
              className="w-full bg-black text-white rounded-xl py-3 mt-3"
              onClick={resetPin}
            >
              Save New PIN
            </button>

            <button
              className="text-sm underline mt-2 w-full"
              onClick={() => setResetTarget(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
