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
  const POLL_INTERVAL_MS = 60000; // 60s - reduce load; pause when tab hidden via visibilitychange
  
  // Use relative paths so the app works from any host (local or remote via Tailscale/VPN).
  // The Vite dev server proxy forwards /license, /tracking, /emv, /service-manager to localhost:8080.
  const LICENSE_SERVICE_URL = '/license';
  const SERVICE_MANAGER_URL = import.meta.env.VITE_SERVICE_MANAGER_URL || '/service-manager';
  const EMV_URL = import.meta.env.VITE_EMV_URL || '/emv';
  const TRACKING_URL = '/tracking';
  const TRACKING_PROXY_URL = '/tracking';
  const WEBSITE_BACKEND_URL = import.meta.env.VITE_WEBSITE_BACKEND_URL || '';
  const WEBSITE_FRONTEND_URL = '';

  // Turn network/fetch errors into a clear message so user knows which service is unreachable
  const messageForFetchError = (err, serviceName, url) => {
    const isNetworkError = !err.message || err.message === 'Failed to fetch' || err.name === 'TypeError';
    if (isNetworkError) {
      return `${serviceName} is not reachable (${url}). Make sure it is running and try again.`;
    }
    return err.message;
  };

  // Map website service IDs to Service Manager service IDs
  const mapServiceId = (websiteServiceId) => {
    const mapping = {
      'emv_service_9000': 'SELF_RESTART', // Service Manager itself - uses special self-restart endpoint
      'emv_program_8082': 'main_app', // EMV Program maps to main_app
      'license_service_8000': null, // License Service - not managed by Service Manager
      'tracking_program_8087': null, // Tracking Program - not managed by Service Manager
      'website_frontend_5173': null // Website Frontend - not managed by Service Manager
    };
    // Check if key exists in mapping first, then return the value (even if null)
    if (websiteServiceId in mapping) {
      return mapping[websiteServiceId];
    }
    return websiteServiceId;
  };
  
  useEffect(() => {
    // Verify session via License Service server-side cookie.
    // If not authenticated, redirect to the License Service admin login
    // with return_url so we come back here after successful login.
    fetch(`${LICENSE_SERVICE_URL}/admin/api/check-auth`, { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setIsAdmin(true);
          setIsAuthenticated(true);
          loadStats();
          loadServices();
        } else {
          // Not authenticated — redirect to License Service login
          const returnUrl = window.location.origin + '/admin';
          window.location.replace(
            `${LICENSE_SERVICE_URL}/admin/login?return_url=${encodeURIComponent(returnUrl)}`
          );
        }
      })
      .catch(() => {
        // Network error — redirect to login
        const returnUrl = window.location.origin + '/admin';
        window.location.replace(
          `${LICENSE_SERVICE_URL}/admin/login?return_url=${encodeURIComponent(returnUrl)}`
        );
      });
  }, []);

  // Polling + visibility when authenticated (covers both token-from-storage and login-form flows)
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    const startPolling = () => {
      if (serviceIntervalRef.current) return;
      serviceIntervalRef.current = setInterval(loadServices, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (serviceIntervalRef.current) {
        clearInterval(serviceIntervalRef.current);
        serviceIntervalRef.current = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };
    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, isAdmin]);
  
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
            url: SERVICE_MANAGER_URL,
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
              url: EMV_URL,
              running: data.services.main_app.running || false,
              healthy: data.services.main_app.healthy || false,
              port: 8082,
              dependencies: []
            };
          }
          
          // Check License, Tracking, Website health in parallel
          const [licenseResult, trackingResult, frontendResult] = await Promise.allSettled([
            fetch(`${LICENSE_SERVICE_URL}/health`, { credentials: 'omit', signal: AbortSignal.timeout(2000) }),
            fetch(`${TRACKING_PROXY_URL}/health`, { credentials: 'omit', signal: AbortSignal.timeout(2000) }),
            fetch(`${WEBSITE_FRONTEND_URL}/`, { credentials: 'omit', signal: AbortSignal.timeout(2000) })
          ]);
          
          transformedServices['license_service_8000'] = {
            name: 'License Service',
            description: 'License management service',
            url: LICENSE_SERVICE_URL,
            running: licenseResult.status === 'fulfilled' && licenseResult.value.ok,
            healthy: licenseResult.status === 'fulfilled' && licenseResult.value.ok,
            port: 8000,
            dependencies: []
          };
          transformedServices['tracking_program_8087'] = {
            name: 'Tracking Program',
            description: 'Tracking program application',
            url: TRACKING_URL,
            running: data.services?.tracking_app?.running || (trackingResult.status === 'fulfilled' && (trackingResult.value.ok || trackingResult.value.status === 302)),
            healthy: data.services?.tracking_app?.healthy || (trackingResult.status === 'fulfilled' && (trackingResult.value.ok || trackingResult.value.status === 302)),
            port: 8087,
            dependencies: []
          };
          transformedServices['website_frontend_5173'] = {
            name: 'Website Frontend',
            description: 'Vite/React frontend development server',
            url: WEBSITE_FRONTEND_URL,
            running: true,
            healthy: frontendResult.status === 'fulfilled' && frontendResult.value.ok,
            port: 5173,
            dependencies: []
          };
          
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

  const handleAdminLogout = async () => {
    try {
      await fetch(`${LICENSE_SERVICE_URL}/admin/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to logout:", err);
    } finally {
      localStorage.removeItem("session_token");
      window.location.href = `${LICENSE_SERVICE_URL}/admin/login`;
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
          alert('Failed to restart Service Manager: ' + messageForFetchError(err, 'Service Manager', SERVICE_MANAGER_URL));
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
            alert(`Failed to ${action} License Service: ` + messageForFetchError(err, 'EM&V Program (proxy)', EMV_URL));
            setServiceActions(prev => {
              const next = { ...prev };
              delete next[serviceId];
              return next;
            });
          }
          return;
        } else if (action === 'restart') {
          // Restart License Service via stop -> start
          setServiceActions(prev => ({ ...prev, [serviceId]: action }));
          try {
            const stopResponse = await fetch(`${EMV_URL}/admin/license-service/stop`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            const stopData = await stopResponse.json();
            if (!stopData.success) {
              throw new Error(stopData.message || 'Failed to stop License Service');
            }

            // Give the port time to release
            await new Promise(resolve => setTimeout(resolve, 2000));

            const startResponse = await fetch(`${EMV_URL}/admin/license-service/start`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            const startData = await startResponse.json();
            if (!startData.success) {
              throw new Error(startData.message || 'Failed to start License Service');
            }

            alert(startData.message || 'License Service restart initiated');
            setTimeout(() => {
              loadServices();
              setServiceActions(prev => {
                const next = { ...prev };
                delete next[serviceId];
                return next;
              });
            }, 3000);
          } catch (err) {
            console.error('Failed to restart License Service:', err);
            alert('Failed to restart License Service: ' + messageForFetchError(err, 'EM&V Program (proxy)', EMV_URL));
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
      } else if (serviceId === 'tracking_program_8087') {
        // Tracking Program - Restart via License Service proxy (session auth, same-origin)
        if (action === 'restart') {
          setServiceActions(prev => ({ ...prev, [serviceId]: action }));
          try {
            const response = await fetch(`${LICENSE_SERVICE_URL}/admin/api/tracking-restart`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json().catch(() => ({ success: false, message: 'Invalid response' }));
            if (data.success) {
              alert(data.message || 'Tracking Program restart initiated.');
              setTimeout(() => {
                loadServices();
                setServiceActions(prev => {
                  const next = { ...prev };
                  delete next[serviceId];
                  return next;
                });
              }, 4000);
            } else {
              throw new Error(data.message || data.error || data.detail || 'Unknown error');
            }
          } catch (err) {
            console.error('Failed to restart Tracking Program:', err);
            alert('Failed to restart Tracking Program: ' + messageForFetchError(err, 'License Service (proxy)', LICENSE_SERVICE_URL));
            setServiceActions(prev => {
              const next = { ...prev };
              delete next[serviceId];
              return next;
            });
          }
          return;
        }
        // Start/Stop: try Service Manager (tracking_app) when available, else manual
        const serviceManagerId = 'tracking_app';
        setServiceActions(prev => ({ ...prev, [serviceId]: action }));
        try {
          const response = await fetch(
            `${SERVICE_MANAGER_URL}/api/services/${action}/${serviceManagerId}`,
            { method: 'POST', credentials: 'omit' }
          );
          const data = await response.json();
          if (data.success !== false) {
            alert(data.message || `Tracking Program ${action} initiated.`);
            setTimeout(() => {
              loadServices();
              setServiceActions(prev => {
                const next = { ...prev };
                delete next[serviceId];
                return next;
              });
            }, 3000);
          } else {
            throw new Error(data.message || data.error || 'Unknown error');
          }
        } catch (err) {
          const serviceName = 'Tracking Program (8087)';
          const startCmd = 'cd tracking-program/8087/flask_app && python run.py (or docker-compose up -d tracking-program)';
          const stopCmd = 'Stop the process or: docker-compose stop tracking-program';
          if (action === 'start') {
            alert(`Service Manager unreachable. To start ${serviceName}, run:\n\n${startCmd}`);
          } else if (action === 'stop') {
            alert(`Service Manager unreachable. To stop ${serviceName}:\n\n${stopCmd}`);
          } else {
            alert('Failed to ' + action + ': ' + messageForFetchError(err, 'Service Manager', SERVICE_MANAGER_URL));
          }
          setServiceActions(prev => {
            const next = { ...prev };
            delete next[serviceId];
            return next;
          });
        }
        return;
      } else if (serviceId === 'website_frontend_5173') {
        // Website Frontend (5173) - Docker or local dev
        const dockerRestart = 'docker-compose restart website';
        const localStart = 'cd website && npm run dev';
        if (action === 'restart') {
          const msg = `To restart the website (port 5173):\n\nDocker: In project root run:\n  ${dockerRestart}\n\nLocal dev: Ctrl+C in the terminal, then:\n  ${localStart}\n\nTip: Use "Copy restart command" in Maintenance Tools to copy the Docker command.`;
          alert(msg);
        } else if (action === 'start') {
          alert(`To start the website (5173):\n\nDocker: docker-compose up -d website\nLocal: ${localStart}`);
        } else if (action === 'stop') {
          alert('To stop: Docker: docker-compose stop website\nLocal: Ctrl+C in the terminal.');
        }
        return;
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
      alert(`Failed to ${action} service: ` + messageForFetchError(err, 'Service Manager', SERVICE_MANAGER_URL));
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
      } else {
        errorMessage = 'Failed to start all services: ' + messageForFetchError(err, 'Service Manager', SERVICE_MANAGER_URL);
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
      alert('Failed to stop all services: ' + messageForFetchError(err, 'Service Manager', SERVICE_MANAGER_URL));
      setServiceActions(prev => {
        const next = { ...prev };
        delete next['all'];
        return next;
      });
    }
  };
  
  if (!isAuthenticated || !isAdmin) {
    // Show a brief loading state while the check-auth fetch is in flight.
    // If not authenticated the useEffect will redirect to the License Service login.
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #1e1b4b 100%)'
      }}>
        <span className="text-gray-400 text-sm">Verifying session…</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen text-gray-100 font-sans pt-16 bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-950">
      <style>{`
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
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-4 py-2 text-sm font-semibold bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-400 text-center max-w-4xl mx-auto">
            Manage the Synerex platform, monitor system status, and access administrative tools.
          </p>
        </div>
        
        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Get token from localStorage and pass it to License Service for seamless auth
              const token = localStorage.getItem('session_token');
              const targetUrl = token 
                ? `${LICENSE_SERVICE_URL}/admin?token=${encodeURIComponent(token)}`
                : `${LICENSE_SERVICE_URL}/admin/login`;
              // Navigate in same window and preserve history
              window.location.href = targetUrl;
            }}
            className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-700/50 hover:border-purple-400 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-200">License Management</h3>
              <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Manage licenses, organizations, billing, and API keys
            </p>
            <div className="text-purple-200 text-sm font-semibold">Open Admin Panel →</div>
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
            href="/tracking/login"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/tracking/login';
            }}
            className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-6 border border-cyan-700/50 hover:border-cyan-500 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-cyan-400">Tracking Admin Portal</h3>
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Admin access to Tracking program (port 8087)
            </p>
            <div className="text-cyan-400 text-sm font-semibold">Open Admin Portal →</div>
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
        
        {/* Statistics Section - show skeleton immediately */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-purple-200">Platform Statistics</h2>
          {loadingStats ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-3" />
                  <div className="h-8 bg-gray-600 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Organizations</div>
                <div className="text-3xl font-bold text-purple-200">{stats.organizations || 0}</div>
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
                <div className="text-3xl font-bold text-purple-200">{stats.seat_assignments || 0}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Service Management Section */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purple-200">Service Management</h2>
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
            <div className="space-y-4">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-48" />
                  <div className="h-6 w-20 bg-gray-600 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {servicesError && (
                <div className="text-center text-yellow-400 py-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
                  <p className="font-semibold mb-2">{servicesError}</p>
                  <button 
                    onClick={() => {
                      setLoadingServices(true);
                      setServicesError(null);
                      loadServices();
                    }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Retry Loading Services
                  </button>
                </div>
              )}
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
                      url: serviceId === 'emv_service_9000' ? SERVICE_MANAGER_URL : EMV_URL,
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
                <h3 className="text-lg font-bold text-purple-200 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  License Management
                </h3>
                <div className="grid md:grid-cols-1 gap-4">
                  {['license_service_8000'].map(serviceId => {
                    const service = services[serviceId];
                    const defaultService = {
                      name: 'License Service',
                      description: 'License management service',
                      url: LICENSE_SERVICE_URL,
                      running: false,
                      healthy: false,
                      dependencies: []
                    };
                    const serviceData = service || defaultService;
                    const isRunning = serviceData.running;
                    const isHealthy = serviceData.healthy;
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
                            <div className="text-base font-semibold text-gray-200 mb-1">{serviceData.name}</div>
                            <div className="text-xs text-gray-500 mb-2">{serviceData.description}</div>
                            <div className="text-xs text-gray-400">{serviceData.url}</div>
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
              
              {/* Tracking Program */}
              <div>
                <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Tracking Program
                </h3>
                <div className="grid md:grid-cols-1 gap-4">
                  {['tracking_program_8087'].map(serviceId => {
                    const service = services[serviceId];
                    const defaultService = {
                      name: 'Tracking Program (Port 8087)',
                      description: 'Tracking program application',
                      url: TRACKING_URL,
                      running: false,
                      healthy: false,
                      dependencies: []
                    };
                    const serviceData = service || defaultService;
                    const isRunning = serviceData.running;
                    const isHealthy = serviceData.healthy;
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
                            <div className="text-base font-semibold text-gray-200 mb-1">{serviceData.name}</div>
                            <div className="text-xs text-gray-500 mb-2">{serviceData.description}</div>
                            <div className="text-xs text-gray-400">{serviceData.url}</div>
                            <a
                              href={serviceData.url}
                              className="text-xs text-cyan-400 hover:text-cyan-300 underline mt-1 inline-block"
                            >
                              Open →
                            </a>
                            <div className="text-xs text-gray-500 mt-2">Restart: via app endpoint. Start/Stop: Service Manager when available.</div>
                          </div>
                          <div className="flex flex-col items-center gap-2 ml-4">
                            <div className={`w-6 h-6 rounded-full ${ledColor} shadow-lg ${isHealthy ? 'animate-pulse led-green' : isRunning ? 'led-yellow' : 'led-red'}`} title={statusText}></div>
                            <span className={`text-xs font-semibold ${isHealthy ? 'text-green-400' : isRunning ? 'text-yellow-400' : 'text-red-400'}`}>{statusText}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleServiceAction(serviceId, 'start')}
                            disabled={isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'stop')}
                            disabled={!isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                            </svg>
                            Stop
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'restart')}
                            disabled={!isRunning || actionInProgress}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Website Services */}
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website Services
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {['website_frontend_5173'].map(serviceId => {
                    const service = services[serviceId];
                    // Use default values if service not found
                    const defaultService = {
                      name: 'Website Frontend (Port 5173)',
                      description: 'Vite/React dev server',
                      url: WEBSITE_FRONTEND_URL,
                      running: false,
                      healthy: false,
                      dependencies: []
                    };
                    const serviceData = service || defaultService;
                    
                    const isRunning = serviceData.running;
                    const isHealthy = serviceData.healthy;
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
                            <div className="text-base font-semibold text-gray-200 mb-1">{serviceData.name}</div>
                            <div className="text-xs text-gray-500 mb-2">{serviceData.description}</div>
                            <div className="text-xs text-gray-400">{serviceData.url}</div>
                            <a
                              href={serviceData.url}
                              className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 inline-block"
                            >
                              Open →
                            </a>
                            <div className="text-xs text-yellow-500 mt-2">Restart: use &quot;Copy restart command&quot; in Maintenance Tools below, or click Restart for instructions.</div>
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
                            disabled={actionInProgress}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'stop')}
                            disabled={actionInProgress}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                            </svg>
                            Stop
                          </button>
                          <button
                            onClick={() => handleServiceAction(serviceId, 'restart')}
                            disabled={actionInProgress}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restart
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
          <h2 className="text-2xl font-bold mb-6 text-purple-200">Maintenance Tools</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-green-400 mb-1">Restart website (5173)</div>
                <div className="text-sm text-gray-400 mb-3">Copy the Docker command and run it in a terminal from the project root to restart the website container.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const cmd = 'docker-compose restart website';
                  navigator.clipboard.writeText(cmd).then(() => {
                    alert('Command copied to clipboard:\n\n' + cmd + '\n\nPaste and run it in a terminal (from the project root).');
                  }).catch(() => {
                    alert('Run this in a terminal from the project root:\n\n' + cmd);
                  });
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                Copy restart command
              </button>
            </div>
            <a
              href={`${LICENSE_SERVICE_URL}/admin/pe-registrations`}
              onClick={(e) => {
                e.preventDefault();
                // Open in same window to preserve session cookies
                window.location.href = `${LICENSE_SERVICE_URL}/admin/pe-registrations`;
              }}
              className="bg-gray-900 hover:bg-gray-700 rounded-lg p-4 border border-gray-700 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-200 mb-1">PE Registrations</div>
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
              <div className="font-semibold text-purple-200 mb-1">Organizations</div>
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
              <div className="font-semibold text-purple-200 mb-1">API Keys</div>
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
              <div className="font-semibold text-purple-200 mb-1">Server Info</div>
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
              <div className="font-semibold text-purple-200 mb-1">API Documentation</div>
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
              <div className="font-semibold text-purple-200 mb-1">My Account</div>
              <div className="text-sm text-gray-400">View your account information</div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
