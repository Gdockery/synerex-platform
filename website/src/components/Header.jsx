import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Header(){
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownTimeoutRef = useRef(null);
  
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL || "http://localhost:8000";
  const EMV_URL = "http://localhost:8082";
  
  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (adminDropdownTimeoutRef.current) {
        clearTimeout(adminDropdownTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
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
          <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-purple-600 transition-colors">About Us</Link>
          <Link to="/hardware" className="hover:text-purple-600 transition-colors">Hardware</Link>
          <Link to="/software" className="hover:text-purple-600 transition-colors">Software</Link>
          <Link to="/licensing" className="hover:text-purple-600 transition-colors">Licensing</Link>
          <Link to="/oem" className="hover:text-purple-600 transition-colors">OEM/ODM</Link>
          <Link to="/custom-engineering" className="hover:text-purple-600 transition-colors">Custom Eng.</Link>
          <Link to="/downloads" className="hover:text-purple-600 transition-colors">Downloads</Link>
          
          {/* Authentication Links */}
          <a 
            href={`${LICENSE_SERVICE_URL}/register`}
            className="hover:text-purple-600 transition-colors"
          >
            Register
          </a>
          <Link to="/my-account" className="hover:text-purple-600 transition-colors">
            My Account
          </Link>
          
          {/* Admin Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => {
              // Clear any pending close timeout
              if (adminDropdownTimeoutRef.current) {
                clearTimeout(adminDropdownTimeoutRef.current);
                adminDropdownTimeoutRef.current = null;
              }
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
            <button className="hover:text-purple-600 transition-colors flex items-center gap-1">
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
                <Link
                  to="/admin"
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-600 transition-colors border-b border-gray-700 cursor-pointer no-underline"
                >
                  <div className="font-semibold">Admin Dashboard</div>
                  <div className="text-xs text-gray-500 mt-1">Platform management & service controls</div>
                </Link>
                <a
                  href={`${LICENSE_SERVICE_URL}/admin`}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-600 transition-colors cursor-pointer no-underline"
                >
                  <div className="font-semibold">License Management</div>
                  <div className="text-xs text-gray-500 mt-1">Manage licenses, organizations, billing</div>
                </a>
                <a
                  href={`${EMV_URL}/admin-panel`}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-purple-600 transition-colors border-t border-gray-700 cursor-pointer no-underline"
                >
                  <div className="font-semibold">EM&V Admin Panel</div>
                  <div className="text-xs text-gray-500 mt-1">Manage EM&V program settings</div>
                </a>
              </div>
            )}
          </div>
          
          <Link to="/contact" className="hover:text-purple-600 transition-colors">Contact</Link>
        </div>
      </nav>
    </header>
  );
}