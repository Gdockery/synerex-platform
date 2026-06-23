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
  const [jwtToken, setJwtToken] = useState(null);
  const [deployedMeterCount, setDeployedMeterCount] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [addSeatsOpen, setAddSeatsOpen] = useState(false);
  const [addSeatsQty, setAddSeatsQty] = useState(1);
  const [addSeatsLoading, setAddSeatsLoading] = useState(false);
  const [addSeatsResult, setAddSeatsResult] = useState(null);
  const [addSeatsError, setAddSeatsError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null); // { orderId }
  const navigate = useNavigate();
  
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL;
  const TRACKING_URL = import.meta.env.VITE_TRACKING_PROGRAM_URL;
  const TRACKING_PROXY_URL = (import.meta.env.VITE_WEBSITE_FRONTEND_URL || '') + '/tracking';
  const EMV_URL = import.meta.env.VITE_EMV_URL;
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const handleSelectPlan = async (program, plan) => {
    if (!userInfo?.org_id) return;
    try {
      // Fetch live meter count from Tracking program for accurate billing
      let meterCount = 0;
      if (program === "tracking") {
        try {
          const meterResp = await fetch(`${TRACKING_URL}/api/meters/count`, {
            credentials: "include",
          });
          if (meterResp.ok) {
            const meterData = await meterResp.json();
            meterCount = meterData.meter_count || 0;
          }
        } catch (e) {
          // Non-fatal: proceed with 0 meters if Tracking program is unreachable
        }
      }

      const formData = new FormData();
      formData.append("org_id", userInfo.org_id);
      formData.append("program_id", program);
      formData.append("new_plan", plan);
      formData.append("meter_count", String(meterCount));
      formData.append("return_url", window.location.href);
      const resp = await fetch(`${LICENSE_SERVICE_URL}/register/api/upgrade`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(`Could not create order: ${err.detail || resp.statusText}`);
        return;
      }
      const data = await resp.json();
      window.location.href = data.payment_url;
    } catch (e) {
      alert("Failed to initiate plan selection. Please try again.");
    }
  };

  const handleAddSeats = async (paymentMethod) => {
    if (!userInfo?.org_id || addSeatsQty < 1) return;
    setAddSeatsLoading(true);
    setAddSeatsError(null);
    setAddSeatsResult(null);
    try {
      const formData = new FormData();
      formData.append("org_id", userInfo.org_id);
      formData.append("quantity", String(addSeatsQty));
      formData.append("payment_method", paymentMethod);
      formData.append("program_id", "tracking");
      const resp = await fetch(`${LICENSE_SERVICE_URL}/register/api/add-seats`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAddSeatsError(data.detail || "Failed to add seats. Please try again.");
      } else {
        setAddSeatsResult(data);
        // Update subscription state immediately for demo payments
        if (data.payment_status === "completed" && subscriptionData) {
          setSubscriptionData(prev => ({
            ...prev,
            seat_limit: data.new_seat_limit,
            seats_available: Math.max(0, data.new_seat_limit - (prev?.seats_used || 0)),
          }));
        }
      }
    } catch (e) {
      setAddSeatsError("Network error. Please try again.");
    } finally {
      setAddSeatsLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const paymentParam = urlParams.get('payment');
      const orderIdParam = urlParams.get('order_id');
      if (urlToken) {
        setJwtToken(urlToken);
      }
      if (paymentParam === 'success' && orderIdParam) {
        setPaymentSuccess({ orderId: orderIdParam });
      }
      if (urlToken || paymentParam) {
        // Clean payment/token params from URL bar
        const clean = new URL(window.location.href);
        clean.searchParams.delete('token');
        clean.searchParams.delete('payment');
        clean.searchParams.delete('order_id');
        window.history.replaceState({}, document.title, clean.pathname + (clean.search || ''));
      }
      // Fetch check-session and JWT in parallel to reduce load time
      const [sessionResp, jwtResp] = await Promise.all([
        fetch(`${LICENSE_SERVICE_URL}/auth/api/check-session`, { credentials: 'include' }),
        fetch(`${LICENSE_SERVICE_URL}/auth/api/jwt`, { credentials: 'include' })
      ]);
      if (sessionResp.ok) {
        const userData = await sessionResp.json();
        setIsAuthenticated(true);
        setUserInfo(userData);
        if (jwtResp.ok) {
          try {
            const jwtData = await jwtResp.json();
            if (jwtData?.token) setJwtToken(jwtData.token);
          } catch (e) {
            if (urlToken) setJwtToken(urlToken);
          }
        } else if (urlToken) {
          setJwtToken(urlToken);
        }
        // Fetch deployed meter count for eligible client orgs
        if (userData.org_type !== "oem" && userData.user_type !== "admin") {
          try {
            const mResp = await fetch(`${TRACKING_URL}/api/meters/count`, { credentials: "include" });
            if (mResp.ok) {
              const mData = await mResp.json();
              setDeployedMeterCount(mData.meter_count ?? null);
            }
          } catch (e) { /* non-fatal */ }
          // Fetch subscription/seat data
          if (userData.org_id) {
            try {
              const subResp = await fetch(
                `${LICENSE_SERVICE_URL}/register/api/subscription?org_id=${encodeURIComponent(userData.org_id)}&program_id=tracking`,
                { credentials: "include" }
              );
              if (subResp.ok) {
                const subData = await subResp.json();
                setSubscriptionData(subData);
              }
            } catch (e) { /* non-fatal */ }
          }
        }
        if (userData.license_id) {
          setLicenseSerial(userData.license_id);
          setTimeout(() => {
            const form = document.querySelector('form');
            if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }, 100);
        }
      } else {
        setIsAuthenticated(false);
        // Redirect to login - use clean return URL (strip token params to avoid duplication)
        const cleanReturnUrl = window.location.origin + window.location.pathname;
        window.location.href = `${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(cleanReturnUrl)}`;
      }
    } catch (err) {
      setIsAuthenticated(false);
      const cleanReturnUrl = window.location.origin + window.location.pathname;
      window.location.href = `${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(cleanReturnUrl)}`;
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
    if (jwtToken) {
      return `${LICENSE_SERVICE_URL}/access/${program}?token=${encodeURIComponent(jwtToken)}`;
    }
    if (!licenseSerial.trim()) return "#";
    return `${LICENSE_SERVICE_URL}/access/${program}?license_id=${licenseSerial.trim()}`;
  };

  const handleClientLogout = async () => {
    // Unified SSO logout: redirect to logout-all to clear license, EMV, and tracking
    window.location.href = `${LICENSE_SERVICE_URL}/auth/logout-all`;
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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)'
      }}>
        <div className="text-center">
          <div className="text-purple-200 text-xl mb-4">Checking authentication...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="min-h-screen text-gray-100 font-sans pt-16" style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)'
    }}>
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

      {/* Payment success banner */}
      {paymentSuccess && (
        <div style={{
          background: 'linear-gradient(90deg, #1a5c1a 0%, #1e7d1e 100%)',
          borderBottom: '3px solid #4caf50',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>Payment Successful — Your license has been activated!</div>
              <div style={{ fontSize: '13px', color: '#a5d6a7', marginTop: '2px' }}>Order ID: {paymentSuccess.orderId}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={`${LICENSE_SERVICE_URL}/register/success?order_id=${paymentSuccess.orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#fff',
                color: '#1a5c1a',
                fontWeight: '700',
                padding: '8px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              📄 View Receipt
            </a>
            <button
              onClick={() => setPaymentSuccess(null)}
              style={{ background: 'transparent', border: 'none', color: '#a5d6a7', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
              title="Dismiss"
            >×</button>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <h1 className="text-4xl font-bold mb-4 text-center">My Account</h1>
        {userInfo && (
          <p className="text-xl text-gray-300 mb-2 text-center max-w-4xl mx-auto">
            Welcome, {userInfo.org_name || userInfo.username || userInfo.email}!
          </p>
        )}
        <div className="flex justify-center gap-3 mb-6">
          <a
            href={`${LICENSE_SERVICE_URL}/auth/change-password`}
            className="px-4 py-2 text-sm font-semibold bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-md transition-colors"
          >
            Change Password
          </a>
          <button
            type="button"
            onClick={handleClientLogout}
            className="px-4 py-2 text-sm font-semibold bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-4xl mx-auto">
          Manage your Synerex licenses, access your programs, and view important account information.
        </p>
        
        {/* Account Summary Card */}
        {userInfo && userInfo.org_type !== "oem" && userInfo.user_type !== "admin" && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-purple-700/50 grid sm:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Organization</div>
              <div className="text-base font-semibold text-gray-100 truncate">{userInfo.org_name || "—"}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Email</div>
              <div className="text-base text-gray-100 truncate">{userInfo.email || "—"}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">License Serial</div>
              <div className="text-base font-mono text-purple-300 truncate">{licenseSerial || userInfo.license_id || "—"}</div>
            </div>
          </div>
        )}

        {/* Welcome/Overview Section */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 mb-8 border border-purple-700/50">
          <h2 className="text-2xl font-bold mb-4 text-purple-200">Welcome to Your Account</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-purple-200 mb-2">What You Can Do Here</h3>
              <ul className="space-y-2 text-sm">
                <li>• View your license details and status</li>
                {userInfo?.org_type !== "customer" && (
                  <li>• Access your licensed programs (EM&amp;V, etc.)</li>
                )}
                {userInfo?.org_type === "customer" && (
                  <li>• Access the Tracking Portal for your organization</li>
                )}
                <li>• Check license expiration dates</li>
                <li>• Get support and contact information</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-200 mb-2">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {userInfo?.org_type !== "customer" && (
                  <li>• <a href="/emv-program" className="text-purple-200 hover:text-purple-200">Learn about EM&amp;V Program</a></li>
                )}

                <li>• <a href="/downloads" className="text-purple-200 hover:text-purple-200">Download Resources</a></li>
                <li>• <a href="/contact" className="text-purple-200 hover:text-purple-200">Contact Support</a></li>
                {userInfo?.org_type !== "customer" && (
                  <li>• <a href="/licensing" className="text-purple-200 hover:text-purple-200">License Information</a></li>
                )}
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
                  href={`${EMV_URL}/pe-dashboard`}
                  
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
        
        {/* Admin Access - EMV/Tracking links for platform admins */}
        {userInfo && userInfo.user_type === "admin" && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 mb-8 border border-purple-700/50">
            <h2 className="text-2xl font-bold mb-4 text-purple-200">Admin Access</h2>
            <p className="text-gray-300 mb-6">
              As a platform administrator, you can access the EM&V and Tracking admin panels.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href={getAccessUrl("emv")}
                rel="noopener noreferrer"
                className="block p-6 bg-purple-500 hover:bg-purple-500 rounded-lg text-center transition-colors border border-purple-400"
              >
                <div className="text-xl font-bold mb-2 text-white">EM&V Program</div>
                <div className="text-sm text-purple-200">Energy Measurement & Verification</div>
              </a>
              <a
                href={`${TRACKING_PROXY_URL}/login`}
                rel="noopener noreferrer"
                className="block p-6 bg-green-600 hover:bg-green-500 rounded-lg text-center transition-colors border border-green-500"
              >
                <div className="text-xl font-bold mb-2 text-white">Tracking Admin Portal</div>
                <div className="text-sm text-green-200">Equipment & Meter Tracking</div>
              </a>
            </div>
          </div>
        )}
        
        {/* Client Admin Portal - visible to customer_admin role users */}
        {userInfo && userInfo.role === "customer_admin" && (
          <div className="bg-gradient-to-r from-sky-900/30 to-blue-900/30 rounded-xl p-8 mb-8 border border-sky-700/50">
            <h2 className="text-2xl font-bold mb-4 text-sky-200">Your Portal Access</h2>
            <p className="text-gray-300 mb-6">
              Access the Tracking program, manage your users, and update your account settings.
            </p>

            {/* License expired / suspended banner */}
            {userInfo.license_active === false && userInfo.license_id && (
              <div className="bg-red-900/40 border border-red-600 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-red-300">&#9888; Subscription Expired</div>
                  <div className="text-sm text-red-200 mt-0.5">
                    Your ECBS Intelligence Platform subscription has expired. Renew to restore access for your team.
                    {userInfo.license_expires_at && (
                      <span className="ml-1">Expired: {new Date(userInfo.license_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    )}
                  </div>
                </div>
                <a
                  href={`${LICENSE_SERVICE_URL}/register/renew?org_id=${userInfo.org_id}`}
                  className="shrink-0 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Renew Now &rarr;
                </a>
              </div>
            )}

            {/* No license yet banner */}
            {userInfo.license_active === false && !userInfo.license_id && (
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
                <div className="font-semibold text-yellow-300">&#9203; Account Pending Activation</div>
                <div className="text-sm text-yellow-200 mt-0.5">Your subscription is being set up. You will receive an email once access is ready. Contact your administrator if this takes longer than expected.</div>
              </div>
            )}

            {/* Prominent Tracking Portal button */}
            <a
              href={userInfo.license_active !== false ? getAccessUrl("tracking") : "#"}
              rel="noopener noreferrer"
              className={`block p-6 rounded-lg text-center transition-colors border mb-6 ${
                userInfo.license_active !== false
                  ? "bg-green-700 hover:bg-green-600 border-green-500 cursor-pointer"
                  : "bg-gray-700/50 border-gray-600 cursor-not-allowed opacity-60"
              }`}
              onClick={userInfo.license_active === false ? (e) => e.preventDefault() : undefined}
            >
              <div className="text-xl font-bold mb-1 text-white">Open Tracking Portal</div>
              <div className={`text-sm ${userInfo.license_active !== false ? "text-green-200" : "text-gray-400"}`}>
                {userInfo.license_active !== false ? "Equipment & Meter Tracking program" : "Subscription required to access"}
              </div>
            </a>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href={`${LICENSE_SERVICE_URL}/auth/client-portal`}
                className="block p-4 bg-gray-800/70 hover:bg-gray-700/80 rounded-lg border border-gray-600 transition-colors"
              >
                <div className="text-base font-bold mb-1 text-white">Manage Client Users</div>
                <div className="text-sm text-gray-400">Add or remove users, copy your branded login link</div>
              </a>
              <a
                href={`${LICENSE_SERVICE_URL}/auth/change-password`}
                className="block p-4 bg-gray-800/70 hover:bg-gray-700/80 rounded-lg border border-gray-600 transition-colors"
              >
                <div className="text-base font-bold mb-1 text-white">Change Password</div>
                <div className="text-sm text-gray-400">Update your account password</div>
              </a>
              {userInfo.license_id && userInfo.license_active !== false && (
                <a
                  href={`${LICENSE_SERVICE_URL}/register/renew?org_id=${userInfo.org_id}`}
                  className="block p-4 bg-gray-800/70 hover:bg-gray-700/80 rounded-lg border border-gray-600 transition-colors"
                >
                  <div className="text-base font-bold mb-1 text-white">Renew Subscription</div>
                  <div className="text-sm text-gray-400">
                    {userInfo.license_expires_at
                      ? `Expires ${new Date(userInfo.license_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
                      : "Manage your annual subscription"}
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* OEM Access - Direct links for OEM org users (no prices) */}
        {userInfo && userInfo.org_type === "oem" && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 mb-8 border border-purple-700/50">
            <h2 className="text-2xl font-bold mb-4 text-purple-200">OEM Access</h2>
            <p className="text-gray-300 mb-6">
              As an OEM partner, you have access to Synerex programs. Click below to open each application.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href={getAccessUrl("emv")}
                rel="noopener noreferrer"
                className="block p-6 bg-purple-500 hover:bg-purple-500 rounded-lg text-center transition-colors border border-purple-400"
              >
                <div className="text-xl font-bold mb-2 text-white">EM&V Program</div>
                <div className="text-sm text-purple-200">Energy Measurement & Verification</div>
              </a>
              <a
                href={getAccessUrl("tracking")}
                rel="noopener noreferrer"
                className="block p-6 bg-green-600 hover:bg-green-500 rounded-lg text-center transition-colors border border-green-500"
              >
                <div className="text-xl font-bold mb-2 text-white">ECBS Intelligence Platform</div>
                <div className="text-sm text-green-200">Equipment & Meter Tracking</div>
              </a>
            </div>
            {userInfo.role === "oem_admin" && (
            <div className="mt-6 pt-6 border-t border-purple-700/40">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">Account Management</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href={`${LICENSE_SERVICE_URL}/oem-admin/profile`}
                  className="block p-4 bg-gray-800/70 hover:bg-gray-700/80 rounded-lg border border-gray-600 transition-colors"
                >
                  <div className="text-base font-bold mb-1 text-white">Company Profile</div>
                  <div className="text-sm text-gray-400">Edit your company details, address, and contact information</div>
                </a>
                <a
                  href={`${LICENSE_SERVICE_URL}/oem-admin`}
                  className="block p-4 bg-gray-800/70 hover:bg-gray-700/80 rounded-lg border border-gray-600 transition-colors"
                >
                  <div className="text-base font-bold mb-1 text-white">Customer Management</div>
                  <div className="text-sm text-gray-400">View and manage your sponsored customers</div>
                </a>
              </div>
            </div>
            )}
          </div>
        )}
        
        {/* License Selection Section - visible for non-OEM, non-admin, non-customer users */}
        {userInfo && userInfo.org_type !== "oem" && userInfo.user_type !== "admin" && userInfo.org_type !== "customer" && (
          <div id="license-plans" className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 mb-8 border border-purple-700/50">
            <h2 className="text-2xl font-bold mb-2 text-purple-200">
              {licenseData ? "Purchase or Upgrade a License" : "Select a License"}
            </h2>
            <p className="text-gray-300 mb-2">
              {licenseData
                ? "Purchase an additional license or upgrade your existing plan. After purchase, you'll receive a new License Serial Number via email."
                : "Choose a license plan to get started with Synerex programs. After purchase, you'll receive your License Serial Number via email."}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Browse the full catalog on our <a href="/licensing" className="text-purple-300 hover:text-purple-200 underline">Licensing page</a>.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* EM&V Plans */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-blue-400">EM&V Program</h3>
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded-lg p-4 hover:border-purple-400 transition-colors cursor-pointer">
                    <div className="font-semibold text-white mb-2">Single Report License</div>
                    <div className="text-2xl font-bold text-purple-200 mb-2">$4,200</div>
                    <div className="text-sm text-gray-400 mb-3">One-time payment</div>
                    <button 
                      onClick={() => handleSelectPlan("emv", "single_report")}
                      className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-500 text-white rounded transition-colors"
                    >
                      Select Plan
                    </button>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4 hover:border-purple-400 transition-colors cursor-pointer">
                    <div className="font-semibold text-white mb-2">Annual License</div>
                    <div className="text-2xl font-bold text-purple-200 mb-2">$53,000</div>
                    <div className="text-sm text-gray-400 mb-3">Per year, unlimited reports</div>
                    <button 
                      onClick={() => handleSelectPlan("emv", "annual")}
                      className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-500 text-white rounded transition-colors"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Tracking Plans */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-green-400">ECBS Intelligence Platform</h3>
                {deployedMeterCount !== null && (
                  <div className="mb-4 px-3 py-2 bg-gray-700/60 rounded-lg text-sm text-gray-300">
                    Your account has <span className="font-semibold text-green-400">{deployedMeterCount} meter{deployedMeterCount !== 1 ? "s" : ""}</span> deployed.
                    Billing will include <span className="font-semibold text-green-400">${(deployedMeterCount * 750).toLocaleString()}/year</span> in meter fees.
                  </div>
                )}
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer">
                    <div className="font-semibold text-white mb-2">Basic Plan</div>
                    <div className="text-2xl font-bold text-green-400 mb-2">$495</div>
                    <div className="text-sm text-gray-400 mb-1">+ $750/meter/year</div>
                    <div className="text-sm text-gray-400 mb-3">5 Users, Read Only</div>
                    <button 
                      onClick={() => handleSelectPlan("tracking", "basic")}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                    >
                      Select Plan
                    </button>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer">
                    <div className="font-semibold text-white mb-2">Pro Plan</div>
                    <div className="text-2xl font-bold text-green-400 mb-2">$950</div>
                    <div className="text-sm text-gray-400 mb-1">+ $750/meter/year</div>
                    <div className="text-sm text-gray-400 mb-3">15 Users, Equipment Scheduling</div>
                    <button 
                      onClick={() => handleSelectPlan("tracking", "pro")}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                    >
                      Select Plan
                    </button>
                  </div>
                  <div className="border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer">
                    <div className="font-semibold text-white mb-2">Enterprise Plan</div>
                    <div className="text-2xl font-bold text-green-400 mb-2">$1,495</div>
                    <div className="text-sm text-gray-400 mb-1">+ $750/meter/year</div>
                    <div className="text-sm text-gray-400 mb-3">Unlimited Users, Full Features</div>
                    <button 
                      onClick={() => handleSelectPlan("tracking", "enterprise")}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Lookup Form - hidden for OEM and admin users */}
        {userInfo?.org_type !== "oem" && userInfo?.user_type !== "admin" && (
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-purple-200">Lookup License</h2>
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
                className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-400"
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
              className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-300 disabled:bg-gray-600 text-white font-semibold rounded-lg shadow transition-colors"
            >
              {loading ? "Looking up..." : "Lookup License"}
            </button>
          </form>
        </div>
        )}
        
        {/* License Information */}
        {licenseData && (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-200">License Information</h2>
              {getStatusBadge(licenseStatus)}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">License Serial Number</div>
                <div className="text-lg font-mono text-purple-200">{licenseData.license_id || licenseSerial}</div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Program</div>
                <div className="text-lg font-semibold text-gray-100">
                  {licenseData.program?.program_id?.toUpperCase() || "N/A"}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Account Email</div>
                <div className="text-lg text-gray-100">{userInfo?.email || "N/A"}</div>
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
                    <div className="text-lg text-gray-100">{formatDate(licenseData.term.start)}</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Expiration Date</div>
                    <div className="text-lg text-gray-100">{formatDate(licenseData.term.end)}</div>
                  </div>
                </>
              )}
            </div>
            
            {/* Access Button - show program-specific button based on license */}
            {licenseStatus?.valid && licenseData?.program?.program_id && (
              <div className="mt-6">
                {licenseData.program.program_id === "emv" && userInfo?.org_type !== "customer" && (
                  <a
                    href={getAccessUrl("emv")}
                    
                    rel="noopener noreferrer"
                    className="block p-6 bg-purple-500 hover:bg-purple-300 rounded-lg text-center transition-colors"
                  >
                    <div className="text-xl font-bold mb-2">Access EM&V Program</div>
                    <div className="text-sm text-purple-500">Click to open the Energy Measurement &amp; Verification program</div>
                  </a>
                )}
                {licenseData.program.program_id === "tracking" && (
                  <a
                    href={getAccessUrl("tracking")}
                    
                    rel="noopener noreferrer"
                    className="block p-6 bg-green-600 hover:bg-green-400 rounded-lg text-center transition-colors"
                  >
                    <div className="text-xl font-bold mb-2">Access ECBS Intelligence Platform</div>
                    <div className="text-sm text-green-500">Click to open the Tracking program</div>
                  </a>
                )}
              </div>
            )}

            {/* Seat Management — Tracking only */}
            {licenseData?.program?.program_id === "tracking" && subscriptionData && (
              <div className="mt-6 bg-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-green-400">User Seats</h3>
                
                {/* Seat usage bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">
                      {subscriptionData.seats_used ?? 0} of {subscriptionData.seat_limit ?? 0} seats used
                    </span>
                    <span className="text-sm font-semibold text-green-400">
                      {subscriptionData.seats_available ?? 0} available
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        (subscriptionData.seats_available ?? 1) === 0 ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{
                        width: `${subscriptionData.seat_limit > 0
                          ? Math.min(100, ((subscriptionData.seats_used ?? 0) / subscriptionData.seat_limit) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Add seats button — shown when all seats used */}
                {(subscriptionData.seats_available ?? 1) === 0 && !addSeatsOpen && !addSeatsResult && (
                  <button
                    onClick={() => { setAddSeatsOpen(true); setAddSeatsQty(1); setAddSeatsError(null); setAddSeatsResult(null); }}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    + Add Additional Seats
                  </button>
                )}

                {/* Add seats panel */}
                {addSeatsOpen && !addSeatsResult && (
                  <div className="mt-4 p-5 bg-gray-800 rounded-xl border border-green-700">
                    <h4 className="font-bold text-green-400 mb-3">Purchase Additional Seats</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Additional seats are billed at <span className="text-white font-semibold">$99/seat/year</span>, prorated
                      to your current license renewal date.
                    </p>

                    {/* Quantity input */}
                    <div className="flex items-center gap-3 mb-4">
                      <label className="text-sm text-gray-300 whitespace-nowrap">Number of seats:</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={addSeatsQty}
                        onChange={e => setAddSeatsQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center"
                      />
                    </div>

                    {/* Cost preview */}
                    {licenseData?.term?.end && (() => {
                      const daysLeft = Math.max(1, Math.ceil((new Date(licenseData.term.end) - new Date()) / 86400000));
                      const prorated = ((99 * addSeatsQty * daysLeft) / 365).toFixed(2);
                      return (
                        <div className="mb-4 p-3 bg-gray-700/60 rounded-lg text-sm">
                          <div className="flex justify-between text-gray-300 mb-1">
                            <span>{addSeatsQty} seat{addSeatsQty !== 1 ? "s" : ""} × $99/year</span>
                            <span>${(99 * addSeatsQty).toFixed(2)}/yr</span>
                          </div>
                          <div className="flex justify-between text-gray-400 mb-1">
                            <span>Prorated ({daysLeft} days remaining)</span>
                            <span>× {(daysLeft / 365).toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-green-400 border-t border-gray-600 pt-2 mt-2">
                            <span>Due today</span>
                            <span>${prorated}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {addSeatsError && (
                      <div className="mb-3 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
                        {addSeatsError}
                      </div>
                    )}

                    {/* Payment buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAddSeats("demo")}
                        disabled={addSeatsLoading}
                        className="py-2 px-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        {addSeatsLoading ? "Processing…" : "Pay Now (Demo)"}
                      </button>
                      <button
                        onClick={() => handleAddSeats("eft")}
                        disabled={addSeatsLoading}
                        className="py-2 px-4 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        Pay by EFT
                      </button>
                    </div>
                    <button
                      onClick={() => { setAddSeatsOpen(false); setAddSeatsError(null); }}
                      className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Success receipt */}
                {addSeatsResult && (
                  <div className="mt-4 p-5 bg-green-900/30 border border-green-600 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <h4 className="font-bold text-green-400">
                        {addSeatsResult.payment_status === "completed" ? "Seats Added Successfully" : "Order Received"}
                      </h4>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      {addSeatsResult.payment_status === "completed" ? (
                        <>
                          <div className="flex justify-between"><span className="text-gray-400">Seats added:</span><span className="font-semibold text-green-400">+{addSeatsResult.seats_added}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">New seat limit:</span><span>{addSeatsResult.new_seat_limit}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Amount charged:</span><span className="font-semibold">${addSeatsResult.amount_charged}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Receipt ref:</span><span className="font-mono text-xs">{addSeatsResult.receipt_ref}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between"><span className="text-gray-400">Order ID:</span><span className="font-mono text-xs">{addSeatsResult.order_id}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Amount due:</span><span className="font-semibold">${addSeatsResult.amount_charged}</span></div>
                          <p className="mt-2 text-yellow-300 text-xs">Your EFT payment is pending. Seats will be activated once payment is confirmed. A confirmation will be sent to your email.</p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => { setAddSeatsResult(null); setAddSeatsOpen(false); }}
                      className="mt-4 w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
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
            <h3 className="text-lg font-bold mb-4 text-purple-200">Your License Includes</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div className="flex items-start">
                <span className="text-purple-200 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Access to Licensed Programs</div>
                  <div className="text-sm text-gray-400">Full access to EM&V and other licensed software programs</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-200 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Technical Support</div>
                  <div className="text-sm text-gray-400">Ongoing support for your licensed programs</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-200 mr-2">✓</span>
                <div>
                  <div className="font-semibold">Software Updates</div>
                  <div className="text-sm text-gray-400">Receive updates and improvements during your license term</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-200 mr-2">✓</span>
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
          <h3 className="text-lg font-bold mb-4 text-purple-200">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-purple-200 mb-2">Common Questions</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Can't find your License Serial Number? Check your license receipt email.</li>
                <li>• License expired? <a href="/contact" className="text-purple-200 hover:text-purple-200">Contact us to renew</a></li>
                <li>• Having trouble accessing the program? <a href="/contact" className="text-purple-200 hover:text-purple-200">Contact Support</a></li>
                {userInfo?.org_type !== "oem" && userInfo?.user_type !== "admin" && (
                  <li>• Need to upgrade your license? <a href="#license-plans" onClick={(e) => { e.preventDefault(); document.getElementById('license-plans')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-purple-200 hover:text-purple-200 cursor-pointer">View licensing options</a></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-200 mb-2">Resources & Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <a href="/downloads" className="text-purple-200 hover:text-purple-200">Download Documentation</a></li>
                <li>• <a href="/emv-program" className="text-purple-200 hover:text-purple-200">EM&V Program Guide</a></li>
                <li>• <a href="/contact" className="text-purple-200 hover:text-purple-200">Technical Support</a></li>
                <li>• <a href="/licensing" className="text-purple-200 hover:text-purple-200">License Management</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
