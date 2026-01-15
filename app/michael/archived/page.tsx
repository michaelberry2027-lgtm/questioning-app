"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import QuestionCard from "../../../components/QuestionCard";

type Q = {
  id: string;
  assigned_to: "eben" | "steph";
  title: string;
  description: string;
  status: "pending" | "answered";
  answer_text: string | null;
};

export default function MichaelArchived() {
  const submitted_by = "michael";
  const [questions, setQuestions] = useState<Q[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,assigned_to,title,description,status,answer_text")
      .eq("submitted_by", submitted_by)
      .eq("archived_by_submitter", true)
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Michael</h1>
        <a className="text-sm underline" href="/michael">
          Back
        </a>
      </div>

      <h2 className="text-lg font-semibold mb-2">Archived</h2>

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-700">
          No archived questions.
        </div>
      ) : null}

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          title={q.title}
          description={`Assigned to: ${q.assigned_to}\n\nQuestion:\n${q.description}\n\nAnswer:\n${
            q.answer_text ?? ""
          }`}
        />
      ))}
    </main>
  );
}
