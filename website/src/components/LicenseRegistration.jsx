import { useState } from "react";

export default function LicenseRegistration({ program = "emv", plan = "annual" }) {
  const [redirecting, setRedirecting] = useState(false);
  
  // License Service URL - should be in environment variable
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL || "http://localhost:8000";
  
  const handleRegister = () => {
    setRedirecting(true);
    // Redirect to License Service registration with return URL
    const returnUrl = encodeURIComponent(`${window.location.origin}/license-success`);
    window.location.href = `${LICENSE_SERVICE_URL}/register?program=${program}&plan=${plan}&return_url=${returnUrl}`;
  };
  
  const programNames = {
    emv: "EM&V (Energy Measurement & Verification)",
    tracking: "Tracking"
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-xl font-bold text-purple-400 mb-4">Get Started</h3>
      <p className="text-gray-300 mb-6">
        Register for a license to access the {programNames[program] || program.toUpperCase()} program.
      </p>
      <button
        onClick={handleRegister}
        disabled={redirecting}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-400 disabled:bg-gray-600 text-white font-semibold rounded-lg shadow transition-colors"
      >
        {redirecting ? "Redirecting..." : "Register for License"}
      </button>
    </div>
  );
}
