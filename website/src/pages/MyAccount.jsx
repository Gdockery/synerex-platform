import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function MyAccount() {
  const [licenseSerial, setLicenseSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [licenseData, setLicenseData] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL || "http://localhost:8000";
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      const response = await fetch(`${LICENSE_SERVICE_URL}/auth/api/check-session`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setIsAuthenticated(true);
        setUserInfo(userData);
        // If user has a license_id, auto-load it
        if (userData.license_id) {
          setLicenseSerial(userData.license_id);
          // Auto-trigger lookup
          setTimeout(() => {
            const form = document.querySelector('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
          }, 100);
        }
      } else {
        setIsAuthenticated(false);
        // Redirect to login
        window.location.href = `${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(window.location.href)}`;
      }
    } catch (err) {
      setIsAuthenticated(false);
      window.location.href = `${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(window.location.href)}`;
    } finally {
      setCheckingAuth(false);
    }
  };
  
  const handleLookup = async (e) => {
    e.preventDefault();
    setError(null);
    setLicenseData(null);
    setLicenseStatus(null);
    setLoading(true);
    
    if (!licenseSerial.trim()) {
      setError("Please enter a License Serial Number");
      setLoading(false);
      return;
    }
    
    try {
      // First, get license details
      const licenseResponse = await fetch(
        `${LICENSE_SERVICE_URL}/api/licenses/${licenseSerial.trim()}`,
        { method: "GET" }
      );
      
      if (!licenseResponse.ok) {
        if (licenseResponse.status === 404) {
          setError("License not found. Please check your Serial Number and try again.");
        } else {
          setError("Unable to retrieve license information. Please try again.");
        }
        setLoading(false);
        return;
      }
      
      const licensePayload = await licenseResponse.json();
      setLicenseData(licensePayload);
      
      // Then, get license status
      try {
        const statusResponse = await fetch(
          `${LICENSE_SERVICE_URL}/api/licenses/${licenseSerial.trim()}/status`,
          { method: "GET" }
        );
        
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          // Convert status format to match our component expectations
          const isActive = status.status === "active";
          setLicenseStatus({
            valid: isActive,
            reason: isActive ? null : status.status,
            status: status.status,
            expires_at: status.expires_at,
            revoked: status.revoked,
            suspended: status.suspended
          });
        }
      } catch (statusErr) {
        // Status endpoint failed, but we still have license data
        console.warn("Could not fetch license status:", statusErr);
      }
      
    } catch (err) {
      console.error("Error looking up license:", err);
      setError("Unable to connect to license service. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const getAccessUrl = (program) => {
    if (!licenseSerial.trim()) return "#";
    return `${LICENSE_SERVICE_URL}/access/${program}?license_id=${licenseSerial.trim()}`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    } catch {
      return dateString;
    }
  };
  
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusType = status.status || status.reason;
    const isActive = statusType === "active" || status.valid === true;
    const isExpired = statusType === "expired";
    const isRevoked = statusType === "revoked" || status.revoked;
    const isSuspended = statusType === "suspended" || status.suspended;
    const notYetActive = statusType === "not_yet_active";
    
    if (isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-900/30 text-green-400 border border-green-700">
          ✓ Active
        </span>
      );
    } else if (isExpired) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-900/30 text-yellow-400 border border-yellow-700">
          ⚠ Expired
        </span>
      );
    } else if (isRevoked) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-900/30 text-red-400 border border-red-700">
          ✗ Revoked
        </span>
      );
    } else if (isSuspended) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-900/30 text-orange-400 border border-orange-700">
          ⚠ Suspended
        </span>
      );
    } else if (notYetActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-900/30 text-blue-400 border border-blue-700">
          ⏳ Not Yet Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-800 text-gray-400 border border-gray-700">
          {statusType || "Unknown"}
        </span>
      );
    }
  };
  
  if (checkingAuth) {
    return (
      <div className="min-h-screen text-gray-100 font-sans pt-16 flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientMove 15s ease infinite'
      }}>
        <div className="text-center">
          <div className="text-purple-400 text-xl mb-4">Checking authentication...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="min-h-screen text-gray-100 font-sans pt-16" style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientMove 15s ease infinite'
    }}>
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
        <h1 className="text-4xl font-bold mb-4 text-center">My Account</h1>
        {userInfo && (
          <p className="text-xl text-gray-300 mb-2 text-center max-w-4xl mx-auto">
            Welcome, {userInfo.username || userInfo.email}!
          </p>
        )}
        <p className="text-xl text-gray-300 mb-8 text-center max-w-4xl mx-auto">
          Manage your Synerex licenses, access your programs, and view important account information.
        </p>
        
        {/* Welcome/Overview Section */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 mb-8 border border-purple-700/50">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Welcome to Your Account</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">What You Can Do Here</h3>
              <ul className="space-y-2 text-sm">
                <li>• View your license details and status</li>
                <li>• Access your licensed programs (EM&V, etc.)</li>
                <li>• Check license expiration dates</li>
                <li>• Get support and contact information</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>• <a href="/emv-program" className="text-purple-400 hover:text-purple-300">Learn about EM&V Program</a></li>
                <li>• <a href="/downloads" className="text-purple-400 hover:text-purple-300">Download Resources</a></li>
                <li>• <a href="/contact" className="text-purple-400 hover:text-purple-300">Contact Support</a></li>
                <li>• <a href="/licensing" className="text-purple-400 hover:text-purple-300">License Information</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Professional Engineer Status Section */}
        {userInfo && userInfo.user_type === "licensed_pe" && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 mb-8 border border-blue-700/50">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Professional Engineer Status</h2>
            
            <div className="grid md:grid-cols-2 gap-6 text-gray-300 mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">PE Name</div>
                <div className="text-lg font-semibold">
                  {userInfo.pe_first_name} {userInfo.pe_last_name}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">License Number</div>
                <div className="text-lg font-mono">{userInfo.pe_license_number}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">State of License</div>
                <div className="text-lg">{userInfo.pe_state}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Company</div>
                <div className="text-lg">{userInfo.pe_company || "Not specified"}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Approval Status</div>
                <div className={`text-lg font-semibold ${
                  userInfo.pe_approval_status === "approved" ? "text-green-400" :
                  userInfo.pe_approval_status === "pending" ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {userInfo.pe_approval_status === "approved" ? "✓ Approved" :
                   userInfo.pe_approval_status === "pending" ? "⏳ Pending Review" :
                   "✗ Rejected"}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">License Verified</div>
                <div className={`text-lg ${userInfo.pe_verified ? "text-green-400" : "text-yellow-400"}`}>
                  {userInfo.pe_verified ? "✓ Verified" : "⚠ Not Verified"}
                </div>
              </div>
            </div>
            
            {/* Workflow Explanation */}
            <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-300 mb-2">How It Works</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Licensees run reports in the EM&V program</li>
                <li>• Reports are submitted to you for review</li>
                <li>• You review and approve reports in the PE Portal</li>
                <li>• You do not have direct access to the EM&V program</li>
              </ul>
            </div>
            
            {/* Status Messages */}
            {userInfo.pe_approval_status === "pending" && (
              <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-yellow-300">
                  <strong>Pending Approval:</strong> Your Licensed PE registration is pending admin approval. 
                  You will be notified once your registration is reviewed.
                </p>
              </div>
            )}
            
            {userInfo.pe_approval_status === "approved" && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-green-300 mb-3">
                  <strong>✓ Approved:</strong> Your Licensed PE registration has been approved. 
                  You can now review Utility Submissions in the PE Portal. Reports are created by 
                  Licensees in the EM&V program and submitted to you for review.
                </p>
                <a 
                  href="http://localhost:8082/pe-dashboard" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Access PE Portal →
                </a>
              </div>
            )}
            
            {userInfo.pe_approval_status === "rejected" && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300">
                  <strong>Registration Rejected:</strong> Your Licensed PE registration was not approved. 
                  Please contact support for more information.
                </p>
              </div>
            )}
            
            {/* Linked Organization */}
            {userInfo.pe_linked_org_id && (
              <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Linked Organization</div>
                <div className="text-gray-300 font-mono">{userInfo.pe_linked_org_id}</div>
              </div>
            )}
          </div>
        )}
        
        {/* Lookup Form */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Lookup License</h2>
          <p className="text-gray-300 mb-6">
            Enter your License Serial Number to view your license information and access your programs. 
            Your License Serial Number can be found in your license receipt email.
          </p>
          
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label htmlFor="licenseSerial" className="block mb-2 font-semibold text-gray-300">
                License Serial Number
              </label>
              <input
                type="text"
                id="licenseSerial"
                value={licenseSerial}
                onChange={(e) => setLicenseSerial(e.target.value)}
                placeholder="SYX-LIC-2025-XXXXXXXXXX"
                className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
              <p className="text-sm text-gray-400 mt-2">
                You can find your License Serial Number in your license receipt email.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-400 disabled:bg-gray-600 text-white font-semibold rounded-lg shadow transition-colors"
            >
              {loading ? "Looking up..." : "Lookup License"}
            </button>
          </form>
        </div>
        
        {/* License Information */}
        {licenseData && (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-400">License Information</h2>
              {getStatusBadge(licenseStatus)}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">License Serial Number</div>
                <div className="text-lg font-mono text-purple-300">{licenseData.license_id || licenseSerial}</div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Program</div>
                <div className="text-lg font-semibold text-gray-100">
                  {licenseData.program?.program_id?.toUpperCase() || "N/A"}
                </div>
              </div>
              
              {licenseData.org && (
                <>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Organization</div>
                    <div className="text-lg font-semibold text-gray-100">{licenseData.org.org_name || "N/A"}</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Organization ID</div>
                    <div className="text-sm font-mono text-gray-300">{licenseData.org.org_id || "N/A"}</div>
                  </div>
                </>
              )}
              
              {licenseData.term && (
                <>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Start Date</div>
                    <div className="text-lg text-gray-100">{formatDate(licenseData.term.term_start)}</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Expiration Date</div>
                    <div className="text-lg text-gray-100">{formatDate(licenseData.term.term_end)}</div>
                  </div>
                </>
              )}
            </div>
            
            {/* Access Button */}
            {licenseStatus?.valid && (
              <div className="mt-6">
                <a
                  href={getAccessUrl("emv")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-purple-600 hover:bg-purple-400 rounded-lg text-center transition-colors"
                >
                  <div className="text-xl font-bold mb-2">Access EM&V Program</div>
                  <div className="text-sm text-purple-500">Click to open the Energy Measurement & Verification program</div>
                </a>
              </div>
            )}
            
            {licenseStatus && !licenseStatus.valid && licenseStatus.status !== "active" && (
              <div className="mt-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-400">
                <strong>Note:</strong> This license is not currently active. Status: {licenseStatus.status || "Unknown"}
                {licenseStatus.expires_at && (
                  <span className="block mt-2 text-sm">
                    Expires: {formatDate(licenseStatus.expires_at)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* License Benefits Section */}
        {licenseData && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-purple-400">Your License Includes</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div className="flex items-start">
                <span className="text-purple-400 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Access to Licensed Programs</div>
                  <div className="text-sm text-gray-400">Full access to EM&V and other licensed software programs</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-400 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Technical Support</div>
                  <div className="text-sm text-gray-400">Ongoing support for your licensed programs</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-400 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Software Updates</div>
                  <div className="text-sm text-gray-400">Receive updates and improvements during your license term</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-400 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Documentation & Resources</div>
                  <div className="text-sm text-gray-400">Access to technical documentation and training materials</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-purple-400">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Common Questions</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Can't find your License Serial Number? Check your license receipt email.</li>
                <li>• License expired? <a href="/contact" className="text-purple-400 hover:text-purple-300">Contact us to renew</a></li>
                <li>• Having trouble accessing the program? <a href="/contact" className="text-purple-400 hover:text-purple-300">Contact Support</a></li>
                <li>• Need to upgrade your license? <a href="/licensing" className="text-purple-400 hover:text-purple-300">View licensing options</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Resources & Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <a href="/downloads" className="text-purple-400 hover:text-purple-300">Download Documentation</a></li>
                <li>• <a href="/emv-program" className="text-purple-400 hover:text-purple-300">EM&V Program Guide</a></li>
                <li>• <a href="/contact" className="text-purple-400 hover:text-purple-300">Technical Support</a></li>
                <li>• <a href="/licensing" className="text-purple-400 hover:text-purple-300">License Management</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
