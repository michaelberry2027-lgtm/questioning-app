"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Modal from "../../components/Modal";
import QuestionCard from "../../components/QuestionCard";

type Q = {
  id: string;
  title: string;
  description: string;
  submitted_by: "lindy" | "michael";
};

export default function StephPending() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [active, setActive] = useState<Q | null>(null);
  const [answer, setAnswer] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,title,description,submitted_by")
      .eq("assigned_to", "steph")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  useEffect(() => {
    load();
  }, []);

  const submitAnswer = async () => {
    if (!active) return;
    if (!answer.trim()) return;

    await supabase
      .from("questions")
      .update({
        answer_text: answer.trim(),
        status: "answered",
        answered_at: new Date().toISOString(),
      })
      .eq("id", active.id);

    setActive(null);
    setAnswer("");
    load();
  };

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Steph</h1>
        <a className="text-sm underline" href="/">
          Home
        </a>
      </div>

      <h2 className="text-lg font-semibold mb-2">Pending Questions</h2>

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-700">
          No pending questions. You’re all caught up!
        </div>
      ) : null}

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          title={q.title}
          description={`${q.description}\n\nSubmitted by: ${q.submitted_by}`}
          footer={
            <button
              className="w-full rounded-xl bg-black text-white px-4 py-3 text-base"
              onClick={() => setActive(q)}
            >
              Answer
            </button>
          }
        />
      ))}

      <div className="mt-4">
        <a href="/steph/answered">
          <button className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base">
            Answered Questions
          </button>
        </a>
      </div>

      {active ? (
        <Modal onClose={() => setActive(null)}>
          <h3 className="text-lg font-semibold mb-3">Answer</h3>

          <div className="text-sm text-gray-700 mb-3">
            <div className="font-semibold">{active.title}</div>
            <div className="whitespace-pre-wrap mt-1">{active.description}</div>
          </div>

          <textarea
            className="w-full border rounded-xl p-3 min-h-[120px]"
            placeholder="Type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <button
            className="mt-3 w-full rounded-xl bg-black text-white px-4 py-3 text-base"
            onClick={submitAnswer}
          >
            Submit
          </button>
        </Modal>
      ) : null}
    </main>
  );
}
