import { useState } from "react";

export default function ProtectedDownload({ href, className="", children }){
  const [busy, setBusy] = useState(false);
  
  // Access code
  const ACCESS_CODE = "SYNEREX2026";
  
  async function go(){
    const code = window.prompt("Enter access code");
    if (!code) return;
    
    // Validate access code
    if (code !== ACCESS_CODE) {
      alert("Invalid access code. Please try again.");
      return;
    }
    
    setBusy(true);
    try {
      // For files in /docs/ or /public/, use window.open or direct navigation
      // This works better than link.download for public folder files
      if (href.endsWith('.pdf')) {
        // Open PDF in new tab - browser will handle download/view
        window.open(href, '_blank');
      } else if (href.endsWith('.html')) {
        // For HTML files, navigate directly
        window.open(href, '_blank');
      } else {
        // Fallback: try to fetch and download
        const response = await fetch(href);
        if (!response.ok) throw new Error('File not found');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = href.split('/').pop() || 'download.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(href, '_blank');
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