"use client";

export default function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md">
        {children}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-black text-white px-4 py-3 text-base"
        >
          Close
        </button>
      </div>
    </div>
  );
}
