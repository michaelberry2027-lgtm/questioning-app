"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import QuestionCard from "../../../components/QuestionCard";

type Q = {
  id: string;
  title: string;
  description: string;
  submitted_by: "lindy" | "michael";
  answer_text: string | null;
};

export default function EbenAnswered() {
  const [questions, setQuestions] = useState<Q[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,title,description,submitted_by,answer_text")
      .eq("assigned_to", "eben")
      .eq("status", "answered")
      .order("answered_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Eben</h1>
        <a className="text-sm underline" href="/eben">
          Back
        </a>
      </div>

      <h2 className="text-lg font-semibold mb-2">Answered Questions</h2>

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-700">
          No answered questions yet.
        </div>
      ) : null}

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          title={q.title}
          description={`Submitted by: ${q.submitted_by}\n\nQuestion:\n${q.description}\n\nAnswer:\n${
            q.answer_text ?? ""
          }`}
        />
      ))}
    </main>
  );
}
