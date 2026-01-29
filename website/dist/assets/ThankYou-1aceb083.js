import{j as r,a as e}from"./index-5a66b705.js";import{H as s}from"./Hero-9fbceb9f.js";import{L as i}from"./LicenseSeal-e7de1aa3.js";function c(){const a=new URLSearchParams(window.location.search),t=a.get("topic")||"",n=a.get("source")||"";return r("div",{className:"min-h-screen bg-gray-950 text-gray-100 font-sans pt-16",children:[e("style",{children:`        @keyframes gradientMove {
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
      `}),r("section",{className:"relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white",children:[e("div",{className:"absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60",style:{zIndex:.5}}),e("div",{className:"fade-in",style:{zIndex:1},children:e("img",{src:"/images/SynerexLogo.png",alt:"Synerex Logo",className:"mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow"})})]}),e(i,{}),e(s,{title:"Thank You — Message Received!",subtitle:"We've received your inquiry and will respond within 24 hours."}),r("section",{className:"max-w-7xl mx-auto px-4 py-10 text-center",children:[r("div",{className:"bg-green-900/30 border border-green-700 rounded-lg p-6 mb-8",children:[e("div",{className:"text-green-400 text-lg font-semibold mb-2",children:"✓ Your message has been sent successfully"}),r("div",{className:"text-green-300",children:[r("p",{className:"mb-2",children:["We've received your inquiry about ",e("strong",{children:t})," and will get back to you shortly."]}),e("p",{className:"text-sm",children:"Our team typically responds within 24 hours during business days."})]})]}),r("div",{className:"text-sm text-gray-300 mb-6",children:[r("div",{children:["Inquiry Topic: ",t]}),r("div",{children:["Source: ",n]}),a.get("utm_campaign")&&r("div",{children:["Campaign: ",a.get("utm_campaign")]})]}),r("div",{className:"flex gap-3 justify-center",children:[e("a",{className:"px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-400",href:"/",children:"Return Home"}),e("a",{className:"px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300",href:"/downloads",children:"View Downloads"}),e("a",{className:"px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300",href:"/contact",children:"Contact Us Again"})]})]})]})}export{c as default};
