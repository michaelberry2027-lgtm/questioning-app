"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Modal from "../../components/Modal";
import QuestionCard from "../../components/QuestionCard";

type Q = {
  id: string;
  assigned_to: "eben" | "steph";
  title: string;
  description: string;
  status: "pending" | "answered";
  answer_text: string | null;
};

export default function Michael() {
  const submitted_by = "michael";

  const [questions, setQuestions] = useState<Q[]>([]);
  const [showAsk, setShowAsk] = useState(false);
  const [active, setActive] = useState<Q | null>(null);

  const [form, setForm] = useState({
    assigned_to: "eben" as "eben" | "steph",
    title: "",
    description: "",
  });

  const load = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,assigned_to,title,description,status,answer_text")
      .eq("submitted_by", submitted_by)
      .eq("archived_by_submitter", false)
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;

    await supabase.from("questions").insert({
      assigned_to: form.assigned_to,
      submitted_by,
      title: form.title.trim(),
      description: form.description.trim(),
    });

    setShowAsk(false);
    setForm({ assigned_to: "eben", title: "", description: "" });
    load();
  };

  const archive = async (id: string) => {
    await supabase
      .from("questions")
      .update({ archived_by_submitter: true })
      .eq("id", id);

    setActive(null);
    load();
  };

  const unanswered = questions.filter((q) => q.status === "pending");
  const answered = questions.filter((q) => q.status === "answered");

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Michael</h1>
        <a className="text-sm underline" href="/">
          Home
        </a>
      </div>

      <button
        className="w-full rounded-xl bg-black text-white px-4 py-3 text-base"
        onClick={() => setShowAsk(true)}
      >
        Ask a Question
      </button>

      <h2 className="text-lg font-semibold mt-6 mb-2">Unanswered</h2>
      {unanswered.length === 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-700">
          No unanswered questions.
        </div>
      ) : null}
      {unanswered.map((q) => (
        <QuestionCard
          key={q.id}
          title={q.title}
          description={`${q.description}\n\nAssigned to: ${q.assigned_to}`}
        />
      ))}

      <h2 className="text-lg font-semibold mt-6 mb-2">Answered</h2>
      {answered.length === 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-700">
          No answered questions yet.
        </div>
      ) : null}
      {answered.map((q) => (
        <QuestionCard
          key={q.id}
          title={q.title}
          description={`Assigned to: ${q.assigned_to}`}
          footer={
            <button
              className="w-full rounded-xl bg-black text-white px-4 py-3 text-base"
              onClick={() => setActive(q)}
            >
              View response
            </button>
          }
        />
      ))}

      <div className="mt-6">
        <a href="/michael/archived">
          <button className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base">
            Archived
          </button>
        </a>
      </div>

      {showAsk ? (
        <Modal onClose={() => setShowAsk(false)}>
          <h3 className="text-lg font-semibold mb-3">Ask a question</h3>

          <label className="text-sm font-semibold">Assigned to</label>
          <select
            className="w-full border rounded-xl p-3 mt-1"
            value={form.assigned_to}
            onChange={(e) =>
              setForm({ ...form, assigned_to: e.target.value as "eben" | "steph" })
            }
          >
            <option value="eben">Eben</option>
            <option value="steph">Steph</option>
          </select>

          <label className="text-sm font-semibold mt-3 block">Question title</label>
          <input
            className="w-full border rounded-xl p-3 mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
          />

          <label className="text-sm font-semibold mt-3 block">
            Question description
          </label>
          <textarea
            className="w-full border rounded-xl p-3 mt-1 min-h-[120px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
          />

          <button
            className="mt-3 w-full rounded-xl bg-black text-white px-4 py-3 text-base"
            onClick={submit}
          >
            Submit
          </button>
        </Modal>
      ) : null}

      {active ? (
        <Modal onClose={() => setActive(null)}>
          <h3 className="text-lg font-semibold mb-2">Response</h3>
          <div className="text-sm text-gray-700 mb-3">
            <div className="font-semibold">{active.title}</div>
          </div>

          <div className="bg-gray-100 rounded-xl p-3 whitespace-pre-wrap">
            {active.answer_text ?? ""}
          </div>

          <button
            className="mt-3 w-full rounded-xl bg-black text-white px-4 py-3 text-base"
            onClick={() => archive(active.id)}
          >
            Archive
          </button>
        </Modal>
      ) : null}
    </main>
  );
}
