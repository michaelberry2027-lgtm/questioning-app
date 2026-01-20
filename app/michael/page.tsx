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

const PERSON = "michael";

export default function Michael() {
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

  // Follow-up state
  const [followUpText, setFollowUpText] = useState("");
  const [followUpError, setFollowUpError] = useState("");
  const [followUpSaving, setFollowUpSaving] = useState(false);

  // Account information modal state
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [accountInfoLoading, setAccountInfoLoading] = useState(false);
  const [phoneType, setPhoneType] = useState<"iphone" | "other">("iphone");
  const [notifEmail, setNotifEmail] = useState("");
  const [accountSaveError, setAccountSaveError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  // Load questions
  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("id,assigned_to,title,description,status,answer_text")
      .eq("submitted_by", submitted_by)
      .eq("archived_by_submitter", false)
      .order("created_at", { ascending: false });

    if (!error && data) setQuestions(data as Q[]);
  };

  // After unlock: load account info + questions
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
        // no settings row yet → show account info modal
        setPhoneType("iphone");
        setNotifEmail("");
        setShowAccountInfo(true);
      }

      setAccountInfoLoading(false);

      // load questions after we checked settings
      await loadQuestions();
    };

    initAfterUnlock();
  }, [unlocked]);

  // Submit new question
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
    loadQuestions();
  };

  // Archive question (for answered modal)
  const archive = async (id: string) => {
    await supabase
      .from("questions")
      .update({ archived_by_submitter: true })
      .eq("id", id);

    setActive(null);
    setFollowUpText("");
    setFollowUpError("");
    loadQuestions();
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

  // Follow-up handler (auto copy + archive original)
  const handleSendFollowUp = async () => {
    if (!active) return;

    if (!followUpText.trim()) {
      setFollowUpError("Please type your follow-up before sending.");
      return;
    }

    setFollowUpError("");
    setFollowUpSaving(true);

    const followUpTitle = `Follow Up: ${active.title}`;

    // 1) insert new follow-up question
    const { error: insertError } = await supabase.from("questions").insert({
      assigned_to: active.assigned_to,
      submitted_by,
      title: followUpTitle,
      description: followUpText.trim(),
    });

    if (insertError) {
      console.error(insertError);
      setFollowUpError("Could not send follow-up. Please try again.");
      setFollowUpSaving(false);
      return;
    }

    // 2) archive the original question
    const { error: archiveError } = await supabase
      .from("questions")
      .update({ archived_by_submitter: true })
      .eq("id", active.id);

    if (archiveError) {
      console.error(archiveError);
      setFollowUpError(
        "Follow-up sent, but could not archive the original yet."
      );
      // We still continue; the new question exists.
    }

    setActive(null);
    setFollowUpText("");
    setFollowUpSaving(false);
    loadQuestions();
  };

  // Save Account Information (one-time modal)
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
      setAccountSaveError("Could not save account information. Please try again.");
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
          Hi Michael!
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
          Hi Michael!
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
              onClick={() => {
                setActive(q);
                setFollowUpText("");
                setFollowUpError("");
              }}
            >
              View response / Follow up
            </button>
          }
        />
      ))}

      <div className="mt-6 flex flex-col gap-2">
        <a href="/michael/archived">
          <button className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base">
            Archived
          </button>
        </a>

        <a href="/michael/settings" className="text-xs underline self-end">
          Manage Settings
        </a>
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
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
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

      {/* View response / follow-up / archive modal */}
      {active ? (
        <Modal
          onClose={() => {
            setActive(null);
            setFollowUpText("");
            setFollowUpError("");
          }}
        >
          <h3 className="text-lg font-semibold mb-2">Response</h3>

          <div className="text-sm text-gray-700 mb-3">
            <div className="font-semibold">{active.title}</div>
          </div>

          <div className="bg-gray-100 rounded-xl p-3 whitespace-pre-wrap mb-3">
            {active.answer_text ?? ""}
          </div>

          <label className="text-sm font-semibold block mb-1">
            Follow-up question (optional)
          </label>
          <textarea
            className="w-full border rounded-xl p-3 min-h-[100px]"
            placeholder="Type your follow-up here..."
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
          />

          {followUpError && (
            <p className="text-sm text-red-500 mt-2">{followUpError}</p>
          )}

          <div className="mt-3 flex flex-col gap-2">
            <button
              className="w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
              onClick={handleSendFollowUp}
              disabled={followUpSaving}
            >
              {followUpSaving ? "Sending..." : "Send Follow-Up (and archive)"}
            </button>

            <button
              className="w-full rounded-xl bg-white text-black border border-black px-4 py-3 text-base"
              onClick={() => archive(active.id)}
            >
              Archive without follow-up
            </button>
          </div>
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
