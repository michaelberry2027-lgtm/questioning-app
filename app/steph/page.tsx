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

const PERSON = "steph";

export default function StephPending() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [active, setActive] = useState<Q | null>(null);
  const [answer, setAnswer] = useState("");

  // PIN lock state
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinChecking, setPinChecking] = useState(false);

  // Account information modal state
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [accountInfoLoading, setAccountInfoLoading] = useState(false);
  const [phoneType, setPhoneType] = useState<"iphone" | "other">("iphone");
  const [notifEmail, setNotifEmail] = useState("");
  const [accountSaveError, setAccountSaveError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,title,description,submitted_by")
      .eq("assigned_to", PERSON)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  // After unlock: load user_settings + questions
  useEffect(() => {
    if (!unlocked) return;

    const initAfterUnlock = async () => {
      setAccountInfoLoading(true);
      setAccountSaveError("");

      const { data, error } = await supabase
        .from("user_settings")
        .select("phone_type, notification_email, onboarding_complete")
        .eq("person", PERSON)
        .maybeSingle();

      if (!error && data) {
        if (data.phone_type === "iphone" || data.phone_type === "other") {
          setPhoneType(data.phone_type);
        } else {
          setPhoneType("iphone");
        }

        setNotifEmail(data.notification_email ?? "");

        if (!data.onboarding_complete) {
          setShowAccountInfo(true);
        }
      } else {
        // No row yet → show modal
        setPhoneType("iphone");
        setNotifEmail("");
        setShowAccountInfo(true);
      }

      setAccountInfoLoading(false);

      // After settings, load questions
      await loadQuestions();
    };

    initAfterUnlock();
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
    loadQuestions();
  };

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

  // Save Account Information
  const handleSaveAccountInfo = async () => {
    if (phoneType === "other" && !notifEmail.trim()) {
      setAccountSaveError("Please enter an email for notifications.");
      return;
    }

    setAccountSaving(true);
    setAccountSaveError("");

    const { error } = await supabase.from("user_settings").upsert({
      person: PERSON,
      phone_type: phoneType,
      notification_email: phoneType === "other" ? notifEmail.trim() : null,
      onboarding_complete: true,
    });

    if (error) {
      console.error(error);
      setAccountSaveError(
        "Could not save account information. Please try again."
      );
      setAccountSaving(false);
      return;
    }

    setShowAccountInfo(false);
    setAccountSaving(false);
  };

  // Locked view
  if (!unlocked) {
    return (
      <main className="p-6 max-w-xl mx-auto flex flex-col items-center gap-4">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          Hi Steph!
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
          Hi Steph!
        </h1>

        <a className="text-sm underline" href="/">
          Home
        </a>
      </div>

      {/* Pending Questions */}
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
        <a href="/steph/answered">
          <button className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base">
            Answered Questions
          </button>
        </a>

        <a href="/steph/settings" className="text-xs underline self-end">
          Manage Settings
        </a>
      </div>

      {/* Answer modal */}
      {active ? (
        <Modal
          onClose={() => {
            setActive(null);
            setAnswer("");
          }}
        >
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

      {/* One-time Account Information modal */}
      {showAccountInfo && (
        <Modal onClose={() => setShowAccountInfo(false)}>
          <h3
            className={`${cherryBomb.className} text-xl mb-3 text-black text-center`}
          >
            Account Information
          </h3>

          <p className="text-sm text-gray-700 mb-3">
            Please answer the following questions to ensure your account is set
            up properly.
          </p>

          {accountInfoLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <>
              <label className="text-sm font-semibold block mb-2">
                What type of phone do you have?
              </label>

              <div className="flex gap-4 text-sm mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="phoneTypeInitial"
                    value="iphone"
                    checked={phoneType === "iphone"}
                    onChange={() => setPhoneType("iphone")}
                  />
                  iPhone
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="phoneTypeInitial"
                    value="other"
                    checked={phoneType === "other"}
                    onChange={() => setPhoneType("other")}
                  />
                  Other
                </label>
              </div>

              {phoneType === "iphone" ? (
                <p className="text-sm text-gray-700 mb-3">
                  You will receive push notifications from the app when you have
                  a new question or answer. Please add the program to your home
                  screen as a web app so it can work properly.
                </p>
              ) : (
                <div className="mb-3">
                  <label className="text-sm font-semibold block">
                    What email would you like to receive notifications?
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded-xl p-3 mt-1"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              )}

              {accountSaveError && (
                <p className="text-sm text-red-500 mt-2">
                  {accountSaveError}
                </p>
              )}

              <button
                className="mt-4 w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
                onClick={handleSaveAccountInfo}
                disabled={accountSaving}
              >
                {accountSaving ? "Saving..." : "Save and Continue"}
              </button>
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
