import { useEffect } from "react";

export default function NDAModal({ open, onClose }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-gray-800 dark:bg-gray-900 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <img
            src="/images/synerex_logo.PNG"
            alt="Synerex"
            className="h-9 w-auto opacity-80 brightness-0 invert"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="text-xl font-bold text-gray-100">Request an NDA</div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">
          To request a Mutual Non-Disclosure Agreement, please email our legal team directly:
        </p>

        <a
          href="mailto:legal@synerexlabs.com?subject=NDA%20Request&body=Please%20include%20your%20full%20name%2C%20company%2C%20and%20a%20brief%20description%20of%20the%20engagement."
          className="flex items-center gap-2 w-full justify-center px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          legal@synerexlabs.com
        </a>

        <p className="text-gray-500 text-xs">
          Please include your full name, company name, and a brief description of the engagement.
          Our team typically responds within one business day.
        </p>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
