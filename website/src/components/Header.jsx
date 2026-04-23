import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Header(){
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL;

  useEffect(() => {
    if (isAdminPage) return;
    fetch(`${LICENSE_SERVICE_URL}/auth/api/check-session`, { credentials: "include" })
      .then((resp) => {
        if (resp.ok) {
          setIsLoggedIn(true);
          resp.json().then((data) => {
            if (data?.role) setUserRole(data.role);
          }).catch(() => {});
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      })
      .catch(() => { setIsLoggedIn(false); setUserRole(null); });
  }, [LICENSE_SERVICE_URL]);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/web-images/synerex_logo.PNG"
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
          
          <Link to="/contact" className="hover:text-purple-300 transition-colors">Contact</Link>
        </div>
      </nav>
    </header>
  );
}