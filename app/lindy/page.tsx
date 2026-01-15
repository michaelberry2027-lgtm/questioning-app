"use client";

import { birthstone, cherryBomb } from "../fonts";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Modal from "../../components/Modal";
import QuestionCard from "../../components/QuestionCard";
import PinPad from "../../components/PinPad";

type Q = {
  id: string;
  assigned_to: "eben" | "steph";
  title: string;
  description: string;
  status: "pending" | "answered";
  answer_text: string | null;
};

const PERSON = "lindy";

export default function Lindy() {
  const submitted_by = PERSON;

  const [questions, setQuestions] = useState<Q[]>([]);
  const [showAsk, setShowAsk] = useState(false);
  const [active, setActive] = useState<Q | null>(null);

  const [form, setForm] = useState({
    assigned_to: "eben" as "eben" | "steph",
    title: "",
    description: "",
  });

  // PIN lock state
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinChecking, setPinChecking] = useState(false);

  // Change PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinChangeError, setPinChangeError] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,assigned_to,title,description,status,answer_text")
      .eq("submitted_by", submitted_by)
      .eq("archived_by_submitter", false)
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  // Only load questions after unlock
  useEffect(() => {
    if (unlocked) {
      load();
    }
  }, [unlocked]);

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

  // Check entered PIN
  const handleUnlock = async () => {
    if (pinInput.length !== 4) return;

    setPinChecking(true);
    setPinError("");

    const { data, error } = await supabase
      .from("pins")
      .select("pin")
      .eq("person", PERSON)
      .single();

    if (!error && data && data.pin === pinInput) {
      setUnlocked(true);
      setPinInput("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }

    setPinChecking(false);
  };

  // Change PIN handler
  const handleChangePin = async () => {
    if (
      currentPin.length !== 4 ||
      newPin.length !== 4 ||
      confirmPin.length !== 4
    ) {
      setPinChangeError("All PIN fields must be 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeError("New PIN entries do not match.");
      return;
    }

    setPinChangeError("");
    setPinSaving(true);

    const { data, error } = await supabase
      .from("pins")
      .select("pin")
      .eq("person", PERSON)
      .single();

    if (error || !data || data.pin !== currentPin) {
      setPinChangeError("Current PIN is incorrect.");
      setPinSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("pins")
      .upsert({ person: PERSON, pin: newPin });

    if (updateError) {
      setPinChangeError("Could not update PIN. Please try again.");
    } else {
      setShowPinModal(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    }

    setPinSaving(false);
  };

  // Locked view
  if (!unlocked) {
    return (
      <main className="p-6 max-w-xl mx-auto flex flex-col items-center gap-4">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          Hi Lindy!
        </h1>

        <p className="text-sm text-gray-700 text-center">
          Enter your 4-digit PIN to continue.
        </p>

        <PinPad value={pinInput} onChange={setPinInput} />

        <button
          className="mt-3 w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
          onClick={handleUnlock}
          disabled={pinInput.length !== 4 || pinChecking}
        >
          {pinChecking ? "Checking..." : "Unlock"}
        </button>

        {pinError && (
          <p className="text-sm text-red-500 mt-1 text-center">{pinError}</p>
        )}

        <a href="/" className="mt-3 text-xs underline">
          Back
        </a>
      </main>
    );
  }

  // Unlocked view
  return (
    <main className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          Hi Lindy!
        </h1>

        <a className="text-sm underline" href="/">
          Home
        </a>
      </div>

      {/* Ask button */}
      <button
        className="w-full rounded-xl bg-black text-white px-4 py-3 text-base"
        onClick={() => setShowAsk(true)}
      >
        Ask a Question
      </button>

      {/* Unanswered */}
      <h2
        className={`${cherryBomb.className} text-xl md:text-2xl mt-6 mb-2 text-black`}
      >
        Unanswered
      </h2>
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

      {/* Answered */}
      <h2
        className={`${cherryBomb.className} text-xl md:text-2xl mt-6 mb-2 text-black`}
      >
        Answered
      </h2>
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

      <div className="mt-6 flex flex-col gap-2">
        <a href="/lindy/archived">
          <button className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base">
            Archived
          </button>
        </a>

        {/* Change PIN button */}
        <button
          className="text-xs underline self-end"
          onClick={() => {
            setShowPinModal(true);
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
            setPinChangeError("");
          }}
        >
          Change PIN
        </button>
      </div>

      {/* Ask modal */}
      {showAsk ? (
        <Modal onClose={() => setShowAsk(false)}>
          <h3 className="text-lg font-semibold mb-3">Ask a question</h3>

          <label className="text-sm font-semibold">Assigned to</label>
          <select
            className="w-full border rounded-xl p-3 mt-1"
            value={form.assigned_to}
            onChange={(e) =>
              setForm({
                ...form,
                assigned_to: e.target.value as "eben" | "steph",
              })
            }
          >
            <option value="eben">Eben</option>
            <option value="steph">Steph</option>
          </select>

          <label className="text-sm font-semibold mt-3 block">
            Question title
          </label>
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

      {/* View response / archive modal */}
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

      {/* Change PIN modal */}
      {showPinModal ? (
        <Modal onClose={() => setShowPinModal(false)}>
          <h3
            className={`${cherryBomb.className} text-xl mb-3 text-black text-center`}
          >
            Change PIN
          </h3>

          <p className="text-sm text-gray-700 mb-2">
            Enter your current PIN and your new 4-digit PIN twice.
          </p>

          <div className="mb-4">
            <p className="text-sm font-semibold mb-1">Current PIN</p>
            <PinPad value={currentPin} onChange={setCurrentPin} />
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold mb-1">New PIN</p>
            <PinPad value={newPin} onChange={setNewPin} />
          </div>

        

          {pinChangeError && (
            <p className="text-sm text-red-500 mb-2">{pinChangeError}</p>
          )}

          <button
            className="mt-1 w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
            onClick={handleChangePin}
            disabled={pinSaving}
          >
            {pinSaving ? "Saving..." : "Save PIN"}
          </button>
        </Modal>
      ) : null}
    </main>
  );
}
