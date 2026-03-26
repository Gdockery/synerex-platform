import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function LicenseSuccess() {
  const [searchParams] = useSearchParams();
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL || '/license';
  const orderId = searchParams.get("order_id");
  const licenseId = searchParams.get("license_id");
  const registered = searchParams.get("registered");
  
  useEffect(() => {
    if (registered === "true") {
      // Brand new account created — no license yet, just show account creation success
      setIsNewRegistration(true);
      setLoading(false);
    } else if (orderId || licenseId) {
      // Returning from a payment/license flow
      setLicenseData({
        licenseId: licenseId || "N/A",
        orderId: orderId || "N/A"
      });
      setLoading(false);
    } else {
      setError("No license information provided");
      setLoading(false);
    }
  }, [orderId, licenseId, registered]);
  
  const getAccessUrl = (program) => {
    if (!licenseData?.licenseId || licenseData.licenseId === "N/A") return "#";
    return `${LICENSE_SERVICE_URL}/access/${program}?license_id=${licenseData.licenseId}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-purple-200 text-xl mb-4">Loading license information...</div>
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
          <a href="/" className="mt-6 inline-block px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-300">
            Return Home
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pt-16">
      <style>{`
50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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

          {isNewRegistration ? (
            /* ── New account created — no license yet ── */
            <>
              <h1 className="text-3xl font-bold text-green-400 mb-4">✓ Account Created Successfully!</h1>
              <p className="text-gray-300 mb-6">
                Your account has been created. A confirmation email has been sent to you with your login credentials.
              </p>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 mb-6">
                <p className="text-gray-300 font-semibold mb-2">Next Steps:</p>
                <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                  <li>Check your email for your login credentials</li>
                  <li>Log in to your account using the button below</li>
                  <li>From <strong className="text-purple-200">My Account</strong>, select and purchase a license for the program you need</li>
                </ol>
              </div>
              <a
                href={`${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(window.location.origin + '/my-account')}`}
                className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-300 text-white font-semibold rounded-lg transition-colors"
              >
                Log In to My Account
              </a>
            </>
          ) : (
            /* ── Existing / paying user — license issued ── */
            <>
              <h1 className="text-3xl font-bold text-green-400 mb-4">✓ License Registration Successful!</h1>
              <p className="text-gray-300 mb-6">
                Your license has been issued successfully. Your license details have been sent to your email address.
              </p>

              {licenseData && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <div className="text-sm text-gray-400 mb-2">License ID:</div>
                  <div className="text-lg font-mono text-purple-200">{licenseData.licenseId}</div>
                  {licenseData.orderId && licenseData.orderId !== "N/A" && (
                    <>
                      <div className="text-sm text-gray-400 mb-2 mt-4">Order ID:</div>
                      <div className="text-sm font-mono text-gray-300">{licenseData.orderId}</div>
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 text-sm text-gray-400">
                <p className="mb-4">
                  <strong className="text-purple-200">Next Steps:</strong> Log in to your account to access your licensed programs.
                </p>
                <a
                  href={`${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(window.location.origin + '/my-account')}`}
                  className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-300 text-white font-semibold rounded-lg transition-colors"
                >
                  Log In to My Account
                </a>
              </div>
            </>
          )}

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
