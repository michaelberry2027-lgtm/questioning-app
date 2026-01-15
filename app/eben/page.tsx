"use client";

import { birthstone, cherryBomb } from "../fonts";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Modal from "../../components/Modal";
import QuestionCard from "../../components/QuestionCard";
import PinPad from "../../components/PinPad";

type Q = {
  id: string;
  title: string;
  description: string;
  submitted_by: "lindy" | "michael";
};

const PERSON = "eben";

export default function EbenPending() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [active, setActive] = useState<Q | null>(null);
  const [answer, setAnswer] = useState("");

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
      .select("id,title,description,submitted_by")
      .eq("assigned_to", PERSON)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  // Only load questions after unlock
  useEffect(() => {
    if (unlocked) {
      load();
    }
  }, [unlocked]);

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

  // Check entered PIN against Supabase
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

  // If locked, show PIN screen instead of questions
  if (!unlocked) {
    return (
      <main className="p-6 max-w-xl mx-auto flex flex-col items-center gap-4">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          Hi Eben!
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

  // Unlocked UI
  return (
    <main className="p-6 max-w-xl mx-auto">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          Hi Eben!
        </h1>

        <a className="text-sm underline" href="/">
          Home
        </a>
      </div>

      <h2
        className={`${cherryBomb.className} text-xl md:text-2xl mb-3 text-black`}
      >
        Pending Questions
      </h2>

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

      <div className="mt-4 flex flex-col gap-2">
        <a href="/eben/answered">
          <button className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base">
            Answered Questions
          </button>
        </a>

        {/* Small Change PIN button at bottom */}
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

      {/* Answer modal */}
      {active ? (
        <Modal onClose={() => setActive(null)}>
          <h3 className="text-lg font-semibold mb-3">Answer</h3>

          <div className="text-sm text-gray-700 mb-3">
            <div className="font-semibold">{active.title}</div>
            <div className="whitespace-pre-wrap mt-1">
              {active.description}
            </div>
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
