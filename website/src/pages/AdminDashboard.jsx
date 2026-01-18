import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LicenseSeal from "../components/LicenseSeal.jsx";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    organizations: 0, api_keys: 0, api_keys_active: 0,
    authorizations: 0, authorizations_active: 0,
    licenses: 0, licenses_revoked: 0, licenses_suspended: 0,
    seat_assignments: 0, billing_orders: 0,
    billing_orders_pending: 0, billing_orders_paid: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [services, setServices] = useState({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [serviceActions, setServiceActions] = useState({}); // Track actions in progress
  const navigate = useNavigate();
  const serviceIntervalRef = useRef(null);
  
  const LICENSE_SERVICE_URL = import.meta.env.VITE_LICENSE_SERVICE_URL || "http://localhost:8000";
  const SERVICE_MANAGER_URL = "http://localhost:9000";
  const EMV_URL = "http://localhost:8082";
  
  // Map website service IDs to Service Manager service IDs
  const mapServiceId = (websiteServiceId) => {
    const mapping = {
      'emv_service_9000': 'SELF_RESTART', // Service Manager itself - uses special self-restart endpoint
      'emv_program_8082': 'main_app', // EMV Program maps to main_app
      'license_service_8000': null // License Service - not managed by Service Manager
    };
    // Check if key exists in mapping first, then return the value (even if null)
    if (websiteServiceId in mapping) {
      return mapping[websiteServiceId];
    }
    return websiteServiceId;
  };
  
  useEffect(() => {
    // Check for token in URL (from login redirect) and store in localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Debug logging
    console.log('AdminDashboard: Checking for token in URL:', token);
    console.log('AdminDashboard: Current URL:', window.location.href);
    
    if (token) {
      console.log('AdminDashboard: Token found in URL, storing in localStorage');
      localStorage.setItem('session_token', token);
      // Clean URL by removing token parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('AdminDashboard: Token stored, URL cleaned');
    }
    
    // Check for token in localStorage (either from URL or previous session)
    const tokenFromStorage = localStorage.getItem('session_token');
    console.log('AdminDashboard: Token from localStorage:', tokenFromStorage ? 'Found' : 'Not found');
    
    if (tokenFromStorage) {
      // Token exists - trust it and show page immediately (no checks, no timeouts)
      console.log('AdminDashboard: Token exists, showing dashboard');
      setIsAdmin(true);
      setIsAuthenticated(true);
      
      // Load data in background (non-blocking, no error handling needed)
      loadStats();
      loadServices();
      
      // Poll service status every 15 seconds
      serviceIntervalRef.current = setInterval(() => {
        loadServices();
      }, 15000);
    } else {
      // No token - redirect to login immediately (no checks, no timeouts)
      console.log('AdminDashboard: No token found, redirecting to login');
      const returnUrl = `${window.location.origin}/admin`;
      window.location.href = `${LICENSE_SERVICE_URL}/admin/login?return_url=${encodeURIComponent(returnUrl)}`;
    }
    
    return () => {
      if (serviceIntervalRef.current) {
        clearInterval(serviceIntervalRef.current);
      }
    };
  }, []);
  
  // REMOVED: checkAuth function - no longer needed, we trust the token
  
  const loadStats = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (increased from 5)
      
      const response = await fetch(`${LICENSE_SERVICE_URL}/api/stats`, {
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Set default stats on error so page doesn't show "Loading..." forever
        setStats({
          organizations: 0, api_keys: 0, api_keys_active: 0,
          authorizations: 0, authorizations_active: 0,
          licenses: 0, licenses_revoked: 0, licenses_suspended: 0,
          seat_assignments: 0, billing_orders: 0,
          billing_orders_pending: 0, billing_orders_paid: 0
        });
      }
    } catch (err) {
      // Set default stats on any error (timeout or other) so page doesn't show "Loading..." forever
      setStats({
        organizations: 0, api_keys: 0, api_keys_active: 0,
        authorizations: 0, authorizations_active: 0,
        licenses: 0, licenses_revoked: 0, licenses_suspended: 0,
        seat_assignments: 0, billing_orders: 0,
        billing_orders_pending: 0, billing_orders_paid: 0
      });
      if (err.name !== 'AbortError') {
        console.error("Failed to load stats:", err);
      }
    } finally {
      setLoadingStats(false);
    }
  };
  
  const loadServices = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds
      
      // Call Service Manager API directly (no auth needed)
      const response = await fetch(`${SERVICE_MANAGER_URL}/api/services/status`, {
        credentials: 'omit',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.services && typeof data.services === 'object') {
          // Transform Service Manager response to website format
          const transformedServices = {};
          
          // Add Service Manager status (port 9000)
          transformedServices['emv_service_9000'] = {
            name: 'EM&V Service Manager',
            description: 'EM&V service manager',
            url: 'http://localhost:9000',
            running: true, // Service Manager is always running if we can call it
            healthy: true,
            port: 9000,
            dependencies: []
          };
          
          // Add main_app as emv_program_8082
          if (data.services.main_app) {
            transformedServices['emv_program_8082'] = {
              name: 'EM&V Program',
              description: 'EM&V program application',
              url: 'http://localhost:8082',
              running: data.services.main_app.running || false,
              healthy: data.services.main_app.healthy || false,
              port: 8082,
              dependencies: []
            };
          }
          
          // Check License Service health
          try {
            const licenseHealthResponse = await fetch(`${LICENSE_SERVICE_URL}/health`, {
              credentials: 'omit',
              signal: AbortSignal.timeout(2000)
            });
            transformedServices['license_service_8000'] = {
              name: 'License Service',
              description: 'License management service',
              url: 'http://localhost:8000',
              running: licenseHealthResponse.ok,
              healthy: licenseHealthResponse.ok,
              port: 8000,
              dependencies: []
            };
          } catch (e) {
            transformedServices['license_service_8000'] = {
              name: 'License Service',
              description: 'License management service',
              url: 'http://localhost:8000',
              running: false,
              healthy: false,
              port: 8000,
              dependencies: []
            };
          }
          
          setServices(transformedServices);
          setServicesError(null); // Clear error on success
        } else {
          setServicesError("Services endpoint returned no data.");
        }
      } else {
        setServicesError(`Failed to load services: ${response.status}`);
      }
    } catch (err) {
      // On timeout or error, preserve last known services instead of clearing them
      // Only set error message if we don't have any services loaded yet
      if (Object.keys(services).length === 0) {
        setServicesError("Services status unavailable. The Service Manager endpoint is timing out. The admin dashboard is still functional.");
      } else {
        // We have services loaded, just show a warning that status might be stale
        setServicesError("Warning: Unable to refresh service status. Displaying last known state.");
      }
      // Don't clear services - keep showing the last known state
      console.warn('Service status refresh failed:', err);
    } finally {
      setLoadingServices(false);
    }
  };
  
  const handleServiceAction = async (serviceId, action) => {
    // Check if service is managed by Service Manager
    const serviceManagerId = mapServiceId(serviceId);
    
    // Handle Service Manager self-restart
    if (serviceManagerId === 'SELF_RESTART' && action === 'restart') {
      if (confirm('Restarting Service Manager will temporarily disconnect. The page will reload automatically. Continue?')) {
        setServiceActions(prev => ({ ...prev, [serviceId]: action }));
        try {
          const response = await fetch(`${SERVICE_MANAGER_URL}/api/services/restart-self`, {
            method: 'POST',
            credentials: 'omit'
          });
          const data = await response.json();
          
          if (data.success) {
            alert(data.message);
            // Refresh page after delay to reconnect to restarted Service Manager
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } else {
            alert('Failed to restart Service Manager: ' + (data.message || 'Unknown error'));
            setServiceActions(prev => {
              const next = { ...prev };
              delete next[serviceId];
              return next;
            });
          }
        } catch (err) {
          console.error('Failed to restart Service Manager:', err);
          alert('Failed to restart Service Manager: ' + err.message);
          setServiceActions(prev => {
            const next = { ...prev };
            delete next[serviceId];
            return next;
          });
        }
      }
      return;
    }
    
    // Handle other actions for Service Manager (start/stop) - not supported
    if (serviceManagerId === 'SELF_RESTART') {
      alert('Service Manager can only be restarted. Start/Stop operations are not supported.');
      return;
    }
    
    // Services not managed by Service Manager
    if (serviceManagerId === null) {
      if (serviceId === 'license_service_8000') {
        // Handle License Service start/stop via main app (8082) endpoints
        // Since License Service may be stopped, we can't call its API directly
        if (action === 'start' || action === 'stop') {
          setServiceActions(prev => ({ ...prev, [serviceId]: action }));
          try {
            const response = await fetch(`${EMV_URL}/admin/license-service/${action}`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            
            if (data.success) {
              alert(data.message || `License Service ${action} initiated`);
              setTimeout(() => {
                loadServices();
                setServiceActions(prev => {
                  const next = { ...prev };
                  delete next[serviceId];
                  return next;
                });
              }, 2000);
            } else {
              alert(`Failed to ${action} License Service: ` + (data.message || 'Unknown error'));
              setServiceActions(prev => {
                const next = { ...prev };
                delete next[serviceId];
                return next;
              });
            }
          } catch (err) {
            console.error(`Failed to ${action} License Service:`, err);
            alert(`Failed to ${action} License Service: ` + err.message);
            setServiceActions(prev => {
              const next = { ...prev };
              delete next[serviceId];
              return next;
            });
          }
          return;
        } else {
          alert(`License Service (port 8000) only supports Start and Stop operations.`);
        }
      } else {
        alert(`Service ${serviceId} is not managed by Service Manager.`);
      }
      return;
    }
    
    setServiceActions(prev => ({ ...prev, [serviceId]: action }));
    try {
      // Call Service Manager API directly (no auth needed)
      const response = await fetch(
        `${SERVICE_MANAGER_URL}/api/services/${action}/${serviceManagerId}`,
        {
          method: 'POST',
          credentials: 'omit'
        }
      );
      const data = await response.json();
      
      // Refresh service status after action
      setTimeout(() => {
        loadServices();
        setServiceActions(prev => {
          const next = { ...prev };
          delete next[serviceId];
          return next;
        });
      }, 2000);
      
      if (!response.ok) {
        const errorMsg = data.message || data.detail || `Failed to ${action} service`;
        alert(errorMsg);
        console.error(`Service ${action} error:`, data);
        // Clear the action state on error
        setServiceActions(prev => {
          const next = { ...prev };
          delete next[serviceId];
          return next;
        });
      } else {
        // Success - service action completed
        console.log(`Service ${serviceId} ${action} completed:`, data);
        if (data.message) {
          // Show success message briefly
          console.log(data.message);
        }
        // Action state will be cleared by the setTimeout
      }
    } catch (err) {
      console.error(`Failed to ${action} service:`, err);
      alert(`Failed to ${action} service: ${err.message}`);
      setServiceActions(prev => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
    }
  };
  
  const handleStartAll = async () => {
    setServiceActions(prev => ({ ...prev, 'all': 'starting' }));
    try {
      // Call Service Manager API directly (no auth needed)
      // Use a longer timeout since starting all services can take 60+ seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(
        `${SERVICE_MANAGER_URL}/api/services/start-all`,
        {
          method: 'POST',
          credentials: 'omit',
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      
      setTimeout(() => {
        loadServices();
        setServiceActions(prev => {
          const next = { ...prev };
          delete next['all'];
          return next;
        });
      }, 3000);
      
      if (response.ok) {
        const results = data.results || {};
        const services = data.services || {};
        const successCount = Object.values(results).filter(r => r === true).length;
        const totalCount = Object.keys(results).length;
        
        // Build detailed message with service names
        const serviceNames = {
          'main_app': 'Main App (8082)',
          'pdf_generator': 'PDF Generator (8083)',
          'html_reports': 'HTML Reports (8084)',
          'weather': 'Weather (8200)',
          'charts': 'Charts (8086)',
          'ollama_ai': 'Ollama AI Backend (8090)',
          'utility_rate': 'Utility Rate Service (8202)',
          'utility_incentive': 'Utility Incentive Service (8203)'
        };
        
        const succeeded = [];
        const failed = [];
        
        for (const [serviceId, success] of Object.entries(results)) {
          const serviceName = serviceNames[serviceId] || serviceId;
          const serviceInfo = services[serviceId] || {};
          const errorMsg = serviceInfo.error_message;
          
          if (success === true) {
            succeeded.push(serviceName);
          } else {
            // Include error message if available
            if (errorMsg) {
              failed.push(`${serviceName}\n   Error: ${errorMsg}`);
            } else {
              failed.push(serviceName);
            }
          }
        }
        
        let message = `Started ${successCount}/${totalCount} service(s).\n\n`;
        
        if (succeeded.length > 0) {
          message += `✅ Succeeded (${succeeded.length}):\n${succeeded.join('\n')}\n\n`;
        }
        
        if (failed.length > 0) {
          message += `❌ Failed (${failed.length}):\n${failed.join('\n')}\n\n`;
          message += `Check the Service Manager logs for more details.`;
        } else {
          message += `All services started successfully!`;
        }
        
        alert(message);
      } else {
        alert(data.message || data.detail || 'Failed to start all services');
      }
    } catch (err) {
      console.error('Failed to start all services:', err);
      let errorMessage = 'Failed to start all services';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The services may still be starting. Please check the Service Manager status in a few moments.';
      } else if (err.message) {
        errorMessage = `Failed to start all services: ${err.message}`;
      }
      
      alert(errorMessage);
      setServiceActions(prev => {
        const next = { ...prev };
        delete next['all'];
        return next;
      });
      
      // Refresh service status even on error to show current state
      setTimeout(() => {
        loadServices();
      }, 2000);
    }
  };
  
  const handleStopAll = async () => {
    if (!confirm('Are you sure you want to stop all services?')) {
      return;
    }
    setServiceActions(prev => ({ ...prev, 'all': 'stopping' }));
    try {
      // Call Service Manager API directly (no auth needed)
      const response = await fetch(
        `${SERVICE_MANAGER_URL}/api/services/stop-all`,
        {
          method: 'POST',
          credentials: 'omit'
        }
      );
      const data = await response.json();
      
      setTimeout(() => {
        loadServices();
        setServiceActions(prev => {
          const next = { ...prev };
          delete next['all'];
          return next;
        });
      }, 2000);
      
      if (response.ok) {
        alert(`Stopped ${data.stopped?.length || 0} service(s). ${data.failed?.length > 0 ? `Failed: ${data.failed.map(f => f.service_id).join(', ')}` : ''}`);
      } else {
        alert(data.detail || 'Failed to stop all services');
      }
    } catch (err) {
      console.error('Failed to stop all services:', err);
      alert(`Failed to stop all services: ${err.message}`);
      setServiceActions(prev => {
        const next = { ...prev };
        delete next['all'];
        return next;
      });
    }
  };
  
  // REMOVED: checkingAuth check - page loads immediately if token exists
  
  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect
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
        .led-green {
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.4);
        }
        .led-yellow {
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.6), 0 0 15px rgba(234, 179, 8, 0.4);
        }
        .led-red {
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6), 0 0 15px rgba(239, 68, 68, 0.4);
        }
      `}</style>
      <LicenseSeal />
      <section className="max-w-7xl mx-auto px-4 py-12 fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-center">Admin Dashboard</h1>
          <p className="text-xl text-gray-300 mb-4 text-center">
            Welcome, {userInfo?.username || 'Admin'}!
          </p>
          <p className="text-gray-400 text-center max-w-4xl mx-auto">
            Manage the Synerex platform, monitor system status, and access administrative tools.
          </p>
        </div>
        
        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Get token from localStorage and pass it to License Service for seamless auth
              const token = localStorage.getItem('session_token');
              const targetUrl = token 
                ? `${LICENSE_SERVICE_URL}/admin?token=${encodeURIComponent(token)}`
                : `${LICENSE_SERVICE_URL}/admin/login`;
              // Navigate immediately
              window.location.replace(targetUrl);
            }}
            className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-700/50 hover:border-purple-500 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-400">License Management</h3>
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Manage licenses, organizations, billing, and API keys
            </p>
            <div className="text-purple-400 text-sm font-semibold">Open Admin Panel →</div>
          </div>
          
          <a
            href={`${EMV_URL}/admin-panel`}
            onClick={(e) => {
              e.preventDefault();
              // Open in same window to preserve session cookies
              window.location.href = `${EMV_URL}/admin-panel`;
            }}
            className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/50 hover:border-blue-500 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-400">EM&V Admin Panel</h3>
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Manage EM&V program settings and configurations
            </p>
            <div className="text-blue-400 text-sm font-semibold">Open Admin Panel →</div>
          </a>
          
          <a
            href={`${LICENSE_SERVICE_URL}/admin/change-password`}
            onClick={(e) => {
              e.preventDefault();
              // Open in same window to preserve session cookies
              window.location.href = `${LICENSE_SERVICE_URL}/admin/change-password`;
            }}
            className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-700/50 hover:border-green-500 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-400">Change Password</h3>
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Update your admin password
            </p>
            <div className="text-green-400 text-sm font-semibold">Change Password →</div>
          </a>
        </div>
        
        {/* Statistics Section */}
        {loadingStats ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
            <div className="text-center text-gray-400">Loading statistics...</div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Platform Statistics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Organizations</div>
                <div className="text-3xl font-bold text-purple-400">{stats.organizations || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Active Licenses</div>
                <div className="text-3xl font-bold text-blue-400">{stats.licenses || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Active API Keys</div>
                <div className="text-3xl font-bold text-green-400">{stats.api_keys_active || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Pending Orders</div>
                <div className="text-3xl font-bold text-yellow-400">{stats.billing_orders_pending || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Total Orders</div>
                <div className="text-3xl font-bold text-gray-300">{stats.billing_orders || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Paid Orders</div>
                <div className="text-3xl font-bold text-green-400">{stats.billing_orders_paid || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Active Authorizations</div>
                <div className="text-3xl font-bold text-blue-400">{stats.authorizations_active || 0}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Active Seats</div>
                <div className="text-3xl font-bold text-purple-400">{stats.seat_assignments || 0}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Service Management Section */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purple-400">Service Management</h2>
            <div className="flex gap-2">
              <button
                onClick={handleStartAll}
                disabled={serviceActions['all'] === 'starting'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
              >
                {serviceActions['all'] === 'starting' ? 'Starting...' : 'Start All'}
              </button>
              <button
                onClick={handleStopAll}
                disabled={serviceActions['all'] === 'stopping'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
              >
                {serviceActions['all'] === 'stopping' ? 'Stopping...' : 'Stop All'}
              </button>
            </div>
          </div>
          
          {loadingServices ? (
            <div className="text-center text-gray-400 py-8">Loading service status...</div>
          ) : servicesError ? (
            <div className="text-center text-yellow-400 py-8">
              <p className="font-semibold mb-2">{servicesError}</p>
              <button 
                onClick={() => {
                  setLoadingServices(true);
                  setServicesError(null);
                  loadServices();
                }}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Retry Loading Services
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Always show EM&V buttons even if services object is empty */}
              {/* EM&V Program Services */}
              <div>
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  EM&V Program
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {['emv_service_9000', 'emv_program_8082'].map(serviceId => {
                    const service = services[serviceId];
                    // Always show buttons even if service data not loaded yet
                    // Use default values if service not found
                    const defaultService = {
                      name: serviceId === 'emv_service_9000' ? 'EM&V Service (Port 9000)' : 'EM&V Program (Port 8082)',
                      description: serviceId === 'emv_service_9000' ? 'EM&V service manager' : 'EM&V program application',
                      url: serviceId === 'emv_service_9000' ? 'http://localhost:9000' : 'http://localhost:8082',
                      running: false,
                      healthy: false,
                      dependencies: []
                    };
                    const serviceData = service || defaultService;
                    
                    const isRunning = serviceData.running;
                    const isHealthy = serviceData.healthy;
                    const actionInProgress = serviceActions[serviceId];
                    const hasDeps = serviceData.dependencies && serviceData.dependencies.length > 0;
                    
                    // Determine LED color and status
                    let ledColor = 'bg-red-500';
                    let statusText = 'Stopped';
                    if (isHealthy) {
                      ledColor = 'bg-green-500';
                      statusText = 'Healthy';
                    } else if (isRunning) {
                      ledColor = 'bg-yellow-500';
                      statusText = 'Running';
                    }
                    
                    return (
                      <div key={serviceId} className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="text-base font-semibold text-gray-200 mb-1">{serviceData.name}</div>
                            <div className="text-xs text-gray-500 mb-2">{serviceData.description}</div>
                            <div className="text-xs text-gray-400 mb-1">{serviceData.url}</div>
                            {hasDeps && (
                              <div className="text-xs text-yellow-400 mt-2">
                                <span className="font-semibold">Depends on:</span> {serviceData.dependencies.map(dep => services[dep]?.name || dep).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2 ml-4">
                            {/* LED Indicator */}
                            <div className={`w-6 h-6 rounded-full ${ledColor} shadow-lg ${isHealthy ? 'animate-pulse led-green' : isRunning ? 'led-yellow' : 'led-red'}`} 
                                 title={statusText}>
                            </div>
                            <span className={`text-xs font-semibold ${
                              isHealthy ? 'text-green-400' : 
                              isRunning ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                        
                        {/* Control Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleServiceAction(serviceId, 'start')}
                            disabled={isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {actionInProgress === 'start' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Starting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'stop')}
                            disabled={!isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {actionInProgress === 'stop' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Stopping...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                                </svg>
                                Stop
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'restart')}
                            disabled={!isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {actionInProgress === 'restart' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Restarting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Restart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* License Service */}
              <div>
                <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  License Management
                </h3>
                <div className="grid md:grid-cols-1 gap-4">
                  {['license_service_8000'].map(serviceId => {
                    const service = services[serviceId];
                    if (!service) {
                      console.warn(`Service ${serviceId} not found in services object`);
                      return null;
                    }
                    
                    const isRunning = service.running;
                    const isHealthy = service.healthy;
                    const actionInProgress = serviceActions[serviceId];
                    
                    let ledColor = 'bg-red-500';
                    let statusText = 'Stopped';
                    if (isHealthy) {
                      ledColor = 'bg-green-500';
                      statusText = 'Healthy';
                    } else if (isRunning) {
                      ledColor = 'bg-yellow-500';
                      statusText = 'Running';
                    }
                    
                    return (
                      <div key={serviceId} className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="text-base font-semibold text-gray-200 mb-1">{service.name}</div>
                            <div className="text-xs text-gray-500 mb-2">{service.description}</div>
                            <div className="text-xs text-gray-400">{service.url}</div>
                          </div>
                          <div className="flex flex-col items-center gap-2 ml-4">
                            <div className={`w-6 h-6 rounded-full ${ledColor} shadow-lg ${isHealthy ? 'animate-pulse led-green' : isRunning ? 'led-yellow' : 'led-red'}`} 
                                 title={statusText}>
                            </div>
                            <span className={`text-xs font-semibold ${
                              isHealthy ? 'text-green-400' : 
                              isRunning ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleServiceAction(serviceId, 'start')}
                            disabled={isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {actionInProgress === 'start' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Starting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'stop')}
                            disabled={!isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {actionInProgress === 'stop' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Stopping...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                                </svg>
                                Stop
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Maintenance Tools Section */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-purple-400">Maintenance Tools</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href={`${LICENSE_SERVICE_URL}/admin/pe-registrations`}
              onClick={(e) => {
                e.preventDefault();
                // Open in same window to preserve session cookies
                window.location.href = `${LICENSE_SERVICE_URL}/admin/pe-registrations`;
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 mb-1">PE Registrations</div>
              <div className="text-sm text-gray-400">Review and approve Licensed PE registrations</div>
            </a>
            <a
              href={`${LICENSE_SERVICE_URL}/admin/orgs`}
              onClick={(e) => {
                e.preventDefault();
                // Open in same window to preserve session cookies
                window.location.href = `${LICENSE_SERVICE_URL}/admin/orgs`;
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 mb-1">Organizations</div>
              <div className="text-sm text-gray-400">Manage organizations and their licenses</div>
            </a>
            <a
              href={`${LICENSE_SERVICE_URL}/admin/api-keys`}
              onClick={(e) => {
                e.preventDefault();
                // Open in same window to preserve session cookies
                window.location.href = `${LICENSE_SERVICE_URL}/admin/api-keys`;
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 mb-1">API Keys</div>
              <div className="text-sm text-gray-400">Manage API keys and access tokens</div>
            </a>
            <a
              href={`${LICENSE_SERVICE_URL}/admin/server`}
              onClick={(e) => {
                e.preventDefault();
                // Open in same window to preserve session cookies
                window.location.href = `${LICENSE_SERVICE_URL}/admin/server`;
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 mb-1">Server Info</div>
              <div className="text-sm text-gray-400">View server configuration and status</div>
            </a>
            <a
              href={`${LICENSE_SERVICE_URL}/docs`}
              onClick={(e) => {
                e.preventDefault();
                // Open API docs in new tab (doesn't require auth)
                window.open(`${LICENSE_SERVICE_URL}/docs`, '_blank');
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 mb-1">API Documentation</div>
              <div className="text-sm text-gray-400">View API documentation and test endpoints</div>
            </a>
            <a
              href="/my-account"
              onClick={(e) => {
                e.preventDefault();
                // Navigate using React Router
                navigate('/my-account');
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 mb-1">My Account</div>
              <div className="text-sm text-gray-400">View your account information</div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
