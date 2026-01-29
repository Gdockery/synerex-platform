import{j as a,a as e}from"./index-5a66b705.js";import{I as t}from"./InquiryForm-cf6c07f3.js";import{L as r}from"./LicenseSeal-e7de1aa3.js";function s(){return a("div",{className:"min-h-screen bg-gray-950 text-gray-100 font-sans pt-16",children:[e("style",{children:`        @keyframes gradientMove {
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
      `}),a("section",{className:"relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white",children:[e("div",{className:"absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60",style:{zIndex:.5}}),a("div",{className:"fade-in",style:{zIndex:1},children:[e("img",{src:"/images/SynerexLogo.png",alt:"Synerex Logo",className:"mx-auto mb-6 w-[13.2rem] md:w-[16.5rem] logo-glow"}),e("p",{className:"text-gray-200 mb-6 text-[1.6875rem] md:text-[2.025rem] font-bold",style:{textShadow:"2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 0.7)"},children:'The "Network-wide" Solution for making Single-Circuit Applications Obsolete.'})]})]}),e(r,{}),e("section",{className:"max-w-7xl mx-auto px-4 py-10 fade-in",children:e(t,{variant:"contact"})})]})}export{s as default};
