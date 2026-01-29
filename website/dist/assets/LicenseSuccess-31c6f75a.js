import{u as h,r as s,a as e,j as t,F as x}from"./index-5a66b705.js";import{L as f}from"./LicenseSeal-e7de1aa3.js";function N(){const[i]=h(),[r,d]=s.useState(null),[m,o]=s.useState(!0),[l,g]=s.useState(null),c="http://localhost:8000",a=i.get("order_id"),n=i.get("license_id");s.useEffect(()=>{a||n?(d({licenseId:n||"N/A",orderId:a||"N/A"}),o(!1)):(g("No license information provided"),o(!1))},[a,n]);const u=p=>!(r!=null&&r.licenseId)||r.licenseId==="N/A"?"#":`${c}/access/${p}?license_id=${r.licenseId}`;return m?e("div",{className:"min-h-screen bg-gray-950 text-gray-100 font-sans pt-16 flex items-center justify-center",children:e("div",{className:"text-center",children:e("div",{className:"text-purple-400 text-xl mb-4",children:"Loading license information..."})})}):l?e("div",{className:"min-h-screen bg-gray-950 text-gray-100 font-sans pt-16 flex items-center justify-center",children:t("div",{className:"text-center max-w-2xl mx-auto px-3",children:[e("div",{className:"text-red-400 text-xl mb-4",children:"Error"}),e("div",{className:"text-gray-300",children:l}),e("a",{href:"/",className:"mt-6 inline-block px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-400",children:"Return Home"})]})}):t("div",{className:"min-h-screen bg-gray-950 text-gray-100 font-sans pt-16",children:[e("style",{children:`
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
      `}),e(f,{}),t("section",{className:"max-w-7xl mx-auto px-4 py-12 fade-in",children:[t("div",{className:"bg-green-900/30 border border-green-700 rounded-lg p-8 mb-8",children:[e("h1",{className:"text-3xl font-bold text-green-400 mb-4",children:"✓ License Registration Successful!"}),e("p",{className:"text-gray-300 mb-6",children:"Your license has been issued successfully. You can now access the licensed programs."}),r&&t("div",{className:"bg-gray-800 p-4 rounded-lg mb-6",children:[e("div",{className:"text-sm text-gray-400 mb-2",children:"License ID:"}),e("div",{className:"text-lg font-mono text-purple-300",children:r.licenseId}),r.orderId&&r.orderId!=="N/A"&&t(x,{children:[e("div",{className:"text-sm text-gray-400 mb-2 mt-4",children:"Order ID:"}),e("div",{className:"text-sm font-mono text-gray-300",children:r.orderId})]})]}),e("div",{className:"mt-6",children:t("a",{href:u("emv"),target:"_blank",rel:"noopener noreferrer",className:"block p-6 bg-purple-600 hover:bg-purple-400 rounded-lg text-center transition-colors max-w-md mx-auto",children:[e("div",{className:"text-xl font-bold mb-2",children:"Access EM&V Program"}),e("div",{className:"text-sm text-purple-500",children:"Click to open the Energy Measurement & Verification program"})]})}),t("div",{className:"mt-6 text-sm text-gray-400",children:[e("p",{className:"mb-4",children:"Your license details have been sent to your email address."}),t("p",{className:"mb-4",children:[e("strong",{className:"text-purple-400",children:"Next Steps:"})," You can now log in to your account using the username and password you created during registration."]}),e("div",{className:"mt-4",children:e("a",{href:`${c}/auth/login?return_url=${encodeURIComponent(window.location.origin+"/my-account")}`,className:"inline-block px-6 py-3 bg-purple-600 hover:bg-purple-400 text-white font-semibold rounded-lg transition-colors",children:"Log In to My Account"})})]})]}),t("div",{className:"flex gap-3 justify-center",children:[e("a",{href:"/",className:"px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg",children:"Return Home"}),e("a",{href:"/downloads",className:"px-6 py-3 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded-lg",children:"View Downloads"})]})]})]})}export{N as default};
