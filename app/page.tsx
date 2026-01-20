"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";

type RequestForm = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  how_heard: string;
};

const people = [
  { id: "eben", label: "Eben Copple" },
  { id: "steph", label: "Stephanie Berry" },
  { id: "lindy", label: "Lindy McKinnon" },
  { id: "michael", label: "Michael Berry" },
];

export default function Home() {
  const [showRequest, setShowRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<RequestForm>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    how_heard: "",
  });

  const onChange = (field: keyof RequestForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitRequest = async () => {
    setError("");
    setSuccess("");

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("account_requests").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim(),
      how_heard: form.how_heard.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
      return;
    }

    setSuccess("Your request has been submitted. Thank you!");
    // Clear form
    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      how_heard: "",
    });

    // Close modal after a short moment
    setTimeout(() => {
      setShowRequest(false);
      setSuccess("");
    }, 1000);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-semibold">Who are you?</h1>
          <p className="text-sm text-gray-600">
            Select your profile to view or answer questions.
          </p>
        </div>

        {/* People buttons */}
        <div className="flex flex-col gap-3">
          {people.map((p) => (
            <a
              key={p.id}
              href={`/${p.id}`}
              className="rounded-xl bg-black text-white px-4 py-3 text-lg text-center"
            >
              {p.label}
            </a>
          ))}
        </div>

        {/* Request an Account */}
        <div className="pt-2 border-t mt-4">
          <button
            className="mt-3 w-full rounded-xl bg-white border border-black text-black px-4 py-3 text-base"
            onClick={() => {
              setShowRequest(true);
              setError("");
              setSuccess("");
            }}
          >
            Request an Account
          </button>
        </div>

        {/* Version / Admin link */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <button
            className="underline"
            onClick={() => {
              window.location.href = "/admin";
            }}
          >
            Version 3.0 · Updated 1/19/2026
          </button>
        </div>
      </div>

      {/* Request Account Modal */}
      {showRequest && (
        <Modal onClose={() => setShowRequest(false)}>
          <h2 className="text-lg font-semibold mb-1">
            New Account Request Form
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Thank you for your interest in my program! Please complete the
            following form so I may build your profile and reach out for further
            information.
          </p>

          {/* First Name */}
          <label className="text-sm font-semibold block mt-2">
            First Name
          </label>
          <input
            className="w-full border rounded-xl p-3 mt-1"
            value={form.first_name}
            onChange={(e) => onChange("first_name", e.target.value)}
          />

          {/* Last Name */}
          <label className="text-sm font-semibold block mt-3">
            Last Name
          </label>
          <input
            className="w-full border rounded-xl p-3 mt-1"
            value={form.last_name}
            onChange={(e) => onChange("last_name", e.target.value)}
          />

          {/* Phone */}
          <label className="text-sm font-semibold block mt-3">
            Phone Number
          </label>
          <input
            className="w-full border rounded-xl p-3 mt-1"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />

          {/* Email */}
          <label className="text-sm font-semibold block mt-3">
            Email Address
          </label>
          <input
            type="email"
            className="w-full border rounded-xl p-3 mt-1"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />

          {/* How did you hear about us? */}
          <label className="text-sm font-semibold block mt-3">
            How did you hear about us?
          </label>
          <textarea
            className="w-full border rounded-xl p-3 mt-1 min-h-[80px]"
            value={form.how_heard}
            onChange={(e) => onChange("how_heard", e.target.value)}
          />

          {/* Error / success */}
          {error && (
            <p className="text-sm text-red-500 mt-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 mt-2">
              {success}
            </p>
          )}

          {/* Submit button */}
          <button
            className="mt-4 w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
            onClick={submitRequest}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </Modal>
      )}
    </main>
  );
}
