import { useState } from "react";

export default function ProtectedDownload({ href, className="", children }){
  const [busy, setBusy] = useState(false);

  const ACCESS_CODE = "SYNEREX2026";

  async function go(){
    const code = window.prompt("Enter access code");
    if (!code) return;

    if (code !== ACCESS_CODE) {
      alert("Invalid access code. Please try again.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error('File not found');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = href.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={go}
      className={className}
      disabled={busy}
    >
      {busy ? 'Downloading...' : children}
    </button>
  );
}