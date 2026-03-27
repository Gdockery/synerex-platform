import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Header(){
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownTimeoutRef = useRef(null);
  const [jwtToken, setJwtToken] = useState(null);
  const jwtFetchedRef = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL;
  const EMV_URL = import.meta.env.VITE_EMV_URL;
  const TRACKING_URL = import.meta.env.VITE_TRACKING_PROGRAM_URL;

  useEffect(() => {
    if (isAdminPage) return;
    // Fetch session (role) and JWT in parallel
    Promise.all([
      fetch(`${LICENSE_SERVICE_URL}/auth/api/check-session`, { credentials: "include" }),
      fetch(`${LICENSE_SERVICE_URL}/auth/api/jwt`, { credentials: "include" }),
    ])
      .then(([sessionResp, jwtResp]) => {
        if (sessionResp.ok) {
          setIsLoggedIn(true);
          sessionResp.json().then((data) => {
            if (data?.role) setUserRole(data.role);
          }).catch(() => {});
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
        if (jwtResp.ok) {
          jwtResp.json().then((data) => data?.token && setJwtToken(data.token)).catch(() => {});
        }
      })
      .catch(() => { setIsLoggedIn(false); setUserRole(null); });
  }, [LICENSE_SERVICE_URL]);

  const withJwt = (url) => {
    if (!jwtToken) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(jwtToken)}`;
  };

  const fetchJwtLazy = () => {
    if (isAdminPage || jwtFetchedRef.current) return;
    jwtFetchedRef.current = true;
    fetch(`${LICENSE_SERVICE_URL}/auth/api/jwt`, { credentials: "include" })
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => data?.token && setJwtToken(data.token))
      .catch(() => {});
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/images/synerex_logo.PNG"
            alt="Synerex Laboratories, LLC" 
            className="h-12 w-auto brightness-0 invert"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div style={{display: 'none'}} className="text-xl font-bold text-white">SYNEREX</div>
        </Link>
        <div className="hidden md:flex gap-6 text-sm text-white">
          <Link to="/" className="hover:text-purple-300 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-purple-300 transition-colors">About Us</Link>
          <Link to="/hardware" className="hover:text-purple-300 transition-colors">Hardware</Link>
          <Link to="/software" className="hover:text-purple-300 transition-colors">Software</Link>
          <Link to="/licensing" className="hover:text-purple-300 transition-colors">Licensing</Link>
          <Link to="/oem" className="hover:text-purple-300 transition-colors">OEM/ODM</Link>
          <Link to="/custom-engineering" className="hover:text-purple-300 transition-colors">Custom Eng.</Link>
          <Link to="/downloads" className="hover:text-purple-300 transition-colors">Downloads</Link>
          
          {/* Authentication Links */}
          <a 
            href={`${LICENSE_SERVICE_URL}/register/`}
            className="hover:text-purple-300 transition-colors"
          >
            Register
          </a>
          {isLoggedIn && userRole !== "customer_viewer" ? (
            <Link to="/my-account" className="hover:text-purple-300 transition-colors">
              My Account
            </Link>
          ) : !isLoggedIn ? (
            <a
              href={`${LICENSE_SERVICE_URL}/auth/login?return_url=${encodeURIComponent(window.location.origin + '/my-account')}`}
              className="hover:text-purple-300 transition-colors"
            >
              Login
            </a>
          ) : null}
          
          {/* Admin Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => {
              if (adminDropdownTimeoutRef.current) {
                clearTimeout(adminDropdownTimeoutRef.current);
                adminDropdownTimeoutRef.current = null;
              }
              fetchJwtLazy();
              setAdminDropdownOpen(true);
            }}
            onMouseLeave={() => {
              // Add a small delay before closing to allow moving to dropdown
              adminDropdownTimeoutRef.current = setTimeout(() => {
                setAdminDropdownOpen(false);
                adminDropdownTimeoutRef.current = null;
              }, 200); // 200ms delay
            }}
          >
            <button className="hover:text-purple-300 transition-colors flex items-center gap-1">
              Admin
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {adminDropdownOpen && (
              <div 
                className="absolute top-full right-0 mt-1 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
                onMouseEnter={() => {
                  // Clear any pending close timeout when entering dropdown
                  if (adminDropdownTimeoutRef.current) {
                    clearTimeout(adminDropdownTimeoutRef.current);
                    adminDropdownTimeoutRef.current = null;
                  }
                  setAdminDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  // Close when leaving dropdown
                  adminDropdownTimeoutRef.current = setTimeout(() => {
                    setAdminDropdownOpen(false);
                    adminDropdownTimeoutRef.current = null;
                  }, 200);
                }}
              >
                <a
                  href="/license/admin"
                  target="_self"
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-300 transition-colors border-b border-gray-700 cursor-pointer no-underline"
                >
                  <div className="font-semibold">Admin Dashboard</div>
                  <div className="text-xs text-gray-500 mt-1">Platform management & service controls</div>
                </a>
                <a
                  href="/license/admin"
                  target="_self"
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-300 transition-colors cursor-pointer no-underline"
                >
                  <div className="font-semibold">License Management</div>
                  <div className="text-xs text-gray-500 mt-1">Manage licenses, organizations, billing</div>
                </a>
                <a
                  href={withJwt(`${EMV_URL}/sso`)}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-300 transition-colors border-t border-gray-700 cursor-pointer no-underline"
                >
                  <div className="font-semibold">EM&V Admin Panel</div>
                  <div className="text-xs text-gray-500 mt-1">Manage EM&V program settings</div>
                </a>
                <a
                  href="/tracking/login"
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-300 transition-colors border-t border-gray-700 cursor-pointer no-underline"
                >
                  <div className="font-semibold">Tracking Admin Portal</div>
                  <div className="text-xs text-gray-500 mt-1">Admin access to Tracking program</div>
                </a>
              </div>
            )}
          </div>
          
          <Link to="/contact" className="hover:text-purple-300 transition-colors">Contact</Link>
        </div>
      </nav>
    </header>
  );
}