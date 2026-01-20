"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PinPad from "../../../components/PinPad";
import { birthstone, cherryBomb } from "../../fonts";

const NAME_MAP: Record<string, string> = {
  eben: "Eben Copple",
  steph: "Stephanie Berry",
  lindy: "Lindy McKinnon",
  michael: "Michael Berry",
};

type PhoneType = "iphone" | "other";

type UserSettingsRow = {
  person: string;
  phone_type: PhoneType;
  notif_email: string | null;
};

export default function SettingsPage() {
  const params = useParams<{ person: string }>();
  const person = params.person as string;

  const fullName = useMemo(() => NAME_MAP[person], [person]);
  const firstName = useMemo(
    () => (fullName ? fullName.split(" ")[0] : ""),
    [fullName]
  );

  // If someone types a random /[person]/settings
  if (!fullName) {
    return (
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-semibold">Not found</h1>
        <a className="underline text-sm" href="/">
          Back
        </a>
      </main>
    );
  }

  // PIN gate
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinChecking, setPinChecking] = useState(false);

  // Settings state
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [phoneType, setPhoneType] = useState<PhoneType>("iphone");
  const [notifEmail, setNotifEmail] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  // Change PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinSaveMsg, setPinSaveMsg] = useState("");
  const [pinSaveErr, setPinSaveErr] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  const loadSettings = async () => {
    setLoadingSettings(true);
    setSaveMsg("");
    setSaveErr("");

    const { data, error } = await supabase
      .from("user_settings")
      .select("person, phone_type, notif_email")
      .eq("person", person)
      .maybeSingle();

    if (!error && data) {
      const row = data as UserSettingsRow;
      setPhoneType(row.phone_type ?? "iphone");
      setNotifEmail(row.notif_email ?? "");
    } else {
      // If no row exists yet, keep defaults and create on save
      setPhoneType("iphone");
      setNotifEmail("");
    }

    setLoadingSettings(false);
  };

  useEffect(() => {
    if (unlocked) loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  const unlock = async () => {
    if (pinInput.length !== 4) return;

    setPinChecking(true);
    setPinError("");

    const { data, error } = await supabase
      .from("pins")
      .select("pin")
      .eq("person", person)
      .single();

    if (!error && data && data.pin === pinInput) {
      setUnlocked(true);
      setPinInput("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }

    setPinChecking(false);
  };

  const saveSettings = async () => {
    setSaveMsg("");
    setSaveErr("");

    if (phoneType === "other" && !notifEmail.trim()) {
      setSaveErr("Notification email is required for non-iPhone.");
      return;
    }

    const { error } = await supabase.from("user_settings").upsert({
      person,
      phone_type: phoneType,
      notif_email: phoneType === "other" ? notifEmail.trim() : null,
      onboarding_complete: true,
    });

    if (error) {
      console.error(error);
      setSaveErr("Could not save settings. Try again.");
      return;
    }

    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(""), 1200);
  };

  const changePin = async () => {
    setPinSaveMsg("");
    setPinSaveErr("");

    if (currentPin.length !== 4 || newPin.length !== 4) {
      setPinSaveErr("Current PIN and New PIN must be 4 digits.");
      return;
    }

    setPinSaving(true);

    // verify current pin
    const { data, error } = await supabase
      .from("pins")
      .select("pin")
      .eq("person", person)
      .single();

    if (error || !data || data.pin !== currentPin) {
      setPinSaveErr("Current PIN is incorrect.");
      setPinSaving(false);
      return;
    }

    // set new pin
    const { error: upErr } = await supabase
      .from("pins")
      .upsert({ person, pin: newPin });

    if (upErr) {
      console.error(upErr);
      setPinSaveErr("Could not update PIN. Try again.");
      setPinSaving(false);
      return;
    }

    setPinSaveMsg("PIN updated!");
    setCurrentPin("");
    setNewPin("");
    setTimeout(() => setPinSaveMsg(""), 1500);
    setPinSaving(false);
  };

  // Locked view
  if (!unlocked) {
    return (
      <main className="p-6 max-w-xl mx-auto flex flex-col items-center gap-4">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          {firstName ? `Hi ${firstName}!` : "Hi!"}
        </h1>

        <p className="text-sm text-gray-700 text-center">
          Enter your 4-digit PIN to access settings.
        </p>

        <PinPad value={pinInput} onChange={setPinInput} />

        <button
          className="mt-2 w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
          onClick={unlock}
          disabled={pinInput.length !== 4 || pinChecking}
        >
          {pinChecking ? "Checking..." : "Unlock"}
        </button>

        {pinError && (
          <p className="text-sm text-red-500 text-center">{pinError}</p>
        )}

        <a href={`/${person}`} className="text-xs underline mt-2">
          Back
        </a>
      </main>
    );
  }

  // Unlocked view
  return (
    <main className="p-6 max-w-xl mx-auto">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black text-center`}
        >
          {firstName ? `Hi ${firstName}!` : "Settings"}
        </h1>
        <a className="text-sm underline" href={`/${person}`}>
          Back
        </a>
      </div>

      {/* Notifications */}
      <h2
        className={`${cherryBomb.className} text-xl md:text-2xl mb-3 text-black`}
      >
        Notifications
      </h2>

      {loadingSettings ? (
        <div className="text-sm text-gray-600">Loading settings...</div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border">
          <label className="text-sm font-semibold block mb-2">
            What type of phone do you have?
          </label>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="phoneType"
                value="iphone"
                checked={phoneType === "iphone"}
                onChange={() => setPhoneType("iphone")}
              />
              iPhone
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="phoneType"
                value="other"
                checked={phoneType === "other"}
                onChange={() => setPhoneType("other")}
              />
              Other
            </label>
          </div>

          {phoneType === "iphone" ? (
            <p className="text-sm text-gray-700 mt-3">
              You will receive push notifications from the app when you have a
              new question or answer. Please add the program to your home screen
              as a web app so it can work properly.
            </p>
          ) : (
            <div className="mt-3">
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

          {saveErr && <p className="text-sm text-red-500 mt-2">{saveErr}</p>}
          {saveMsg && <p className="text-sm text-green-600 mt-2">{saveMsg}</p>}

          <button
            className="mt-4 w-full rounded-xl bg-black text-white px-4 py-3 text-base"
            onClick={saveSettings}
          >
            Save Settings
          </button>
        </div>
      )}

      {/* Change PIN */}
      <h2
        className={`${cherryBomb.className} text-xl md:text-2xl mt-8 mb-3 text-black`}
      >
        Change PIN
      </h2>

      <div className="bg-white rounded-2xl p-4 border">
        <p className="text-sm text-gray-700 mb-3">
          Enter your current PIN and your new 4-digit PIN.
        </p>

        <div className="mb-4">
          <p className="text-sm font-semibold mb-1">Current PIN</p>
          <PinPad value={currentPin} onChange={setCurrentPin} />
        </div>

        <div className="mb-2">
          <p className="text-sm font-semibold mb-1">New PIN</p>
          <PinPad value={newPin} onChange={setNewPin} />
        </div>

        {pinSaveErr && (
          <p className="text-sm text-red-500 mt-2">{pinSaveErr}</p>
        )}
        {pinSaveMsg && (
          <p className="text-sm text-green-600 mt-2">{pinSaveMsg}</p>
        )}

        <button
          className="mt-4 w-full rounded-xl bg-black text-white px-4 py-3 text-base disabled:opacity-60"
          onClick={changePin}
          disabled={pinSaving}
        >
          {pinSaving ? "Saving..." : "Save New PIN"}
        </button>
      </div>
    </main>
  );
}
