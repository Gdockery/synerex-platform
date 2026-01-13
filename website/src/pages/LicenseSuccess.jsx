import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function LicenseSuccess() {
  const [searchParams] = useSearchParams();
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL || "http://localhost:8000";
  const orderId = searchParams.get("order_id");
  const licenseId = searchParams.get("license_id");
  
  useEffect(() => {
    // If we have license info from URL params, use it directly
    if (orderId || licenseId) {
      setLicenseData({
        licenseId: licenseId || "N/A",
        orderId: orderId || "N/A"
      });
      setLoading(false);
      
      // After successful registration, the user should log in
      // Show a message encouraging them to log in
      // The session will be created when they log in with their username/password
    } else {
      setError("No license information provided");
      setLoading(false);
    }
  }, [orderId, licenseId]);
  
  const getAccessUrl = (program) => {
    if (!licenseData?.licenseId || licenseData.licenseId === "N/A") return "#";
    return `${LICENSE_SERVICE_URL}/access/${program}?license_id=${licenseData.licenseId}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-purple-400 text-xl mb-4">Loading license information...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-3">
          <div className="text-red-400 text-xl mb-4">Error</div>
          <div className="text-gray-300">{error}</div>
          <a href="/" className="mt-6 inline-block px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-400">
            Return Home
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient {
          background-size: 400% 400%;
          animation: gradientMove 15s ease infinite;
        }
        .fade-in {
          opacity: 0;
          transform: translateY(15px);
          animation: fadeIn 1.5s ease forwards;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .logo-glow {
          filter: brightness(0) invert(1) drop-shadow(0 0 8px rgba(126,34,206,0.6)) drop-shadow(0 0 16px rgba(59,130,246,0.4));
        }
      `}</style>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-4">✓ License Registration Successful!</h1>
          <p className="text-gray-300 mb-6">
            Your license has been issued successfully. You can now access the licensed programs.
          </p>
          
          {licenseData && (
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-400 mb-2">License ID:</div>
              <div className="text-lg font-mono text-purple-300">{licenseData.licenseId}</div>
              {licenseData.orderId && licenseData.orderId !== "N/A" && (
                <>
                  <div className="text-sm text-gray-400 mb-2 mt-4">Order ID:</div>
                  <div className="text-sm font-mono text-gray-300">{licenseData.orderId}</div>
                </>
              )}
            </div>
          )}
          
          <div className="mt-6">
            <a
              href={getAccessUrl("emv")}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-purple-600 hover:bg-purple-400 rounded-lg text-center transition-colors max-w-md mx-auto"
            >
              <div className="text-xl font-bold mb-2">Access EM&V Program</div>
              <div className="text-sm text-purple-500">Click to open the Energy Measurement & Verification program</div>
            </a>
          </div>
          
          <div className="mt-6 text-sm text-gray-400">
            <p className="mb-4">Your license details have been sent to your email address.</p>
            <p className="mb-4">
              <strong className="text-purple-400">Next Steps:</strong> You can now log in to your account using the username and password you created during registration.
            </p>
            <div className="mt-4">
              <a
                href={`${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(window.location.origin + '/my-account')}`}
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
              >
                Log In to My Account
              </a>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 justify-center">
          <a href="/" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
            Return Home
          </a>
          <a href="/downloads" className="px-6 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded-lg">
            View Downloads
          </a>
        </div>
      </section>
    </div>
  );
}
