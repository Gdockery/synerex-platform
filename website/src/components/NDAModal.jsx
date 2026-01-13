import { useState } from "react";
export default function NDAModal({ open, onClose }){
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  async function createNDA(payload){
    const targets = [
      "http://localhost:3001/api/docusign/createNDA",
      "/api/docusign/createNDA"
    ];
    for (const url of targets){
      try { 
        const r = await fetch(url, { 
          method: "POST", 
          headers: { 
            "content-type":"application/json",
            "Accept": "application/json"
          }, 
          body: JSON.stringify(payload) 
        }); 
        if (r.ok) return await r.json();
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${r.status}: ${r.statusText}`);
      } catch (error) {
        // Connection failed, will try next URL
        if (url === targets[targets.length - 1]) throw error;
      }
    }
    throw new Error("No NDA endpoint available");
  }
  async function handleSubmit(e){
    e.preventDefault(); setError(""); setSubmitting(true);
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    try { await createNDA({ counterpartyName: d.name, counterpartyEmail: d.email, company: d.company||"", message: d.message||"" }); setSubmitted(true); }
    catch(e){ setError(e.message||"Failed"); } finally { setSubmitting(false); }
  }
  if(!open) return null;
  return (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
    <div className="w-full max-w-lg rounded-xl bg-gray-800 dark:bg-gray-900 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <img 
          src="/images/synerex_logo.PNG" 
          alt="Synerex" 
          className="h-9 w-auto opacity-80 brightness-0 invert"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <span style={{display: 'none'}} className="text-lg font-bold text-purple-400">SYNEREX</span>
        <div className="text-xl font-bold text-gray-100">Request NDA</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" placeholder="Full Name" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500"/>
        <input name="email" placeholder="Work Email" type="email" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500"/>
        <input name="company" placeholder="Company (optional)" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500"/>
        <textarea name="message" rows="3" placeholder="Notes (optional)" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500"></textarea>
        <div className="text-sm text-red-400">{error}</div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700">Close</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-400 text-white">{submitted ? "Sent" : (submitting ? "Sending…" : "Send NDA Request")}</button>
        </div>
      </form>
    </div>
  </div>);
}