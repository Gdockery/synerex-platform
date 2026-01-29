import{j as n,a as e}from"./index-5a66b705.js";import{D as i}from"./DocCard-26e56f9c.js";import{L as t}from"./LicenseSeal-e7de1aa3.js";function s(){return n("div",{className:"min-h-screen bg-gray-950 text-gray-100 font-sans pt-16",children:[e("style",{children:`        @keyframes gradientMove {
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
      `}),n("section",{className:"relative from-gray-900 via-purple-900 to-gray-900 bg-gradient-to-br pt-32 pb-24 px-4 text-center text-white",children:[e("div",{className:"absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40",style:{backgroundImage:"url(/images/Synerex_Documents.jpeg)",zIndex:0}}),e("div",{className:"absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-gray-900/60",style:{zIndex:.5}}),n("div",{className:"fade-in relative",style:{zIndex:1},children:[e("img",{src:"/images/SynerexLogo.png",alt:"Synerex Logo",className:"mx-auto mb-4 w-[13.2rem] md:w-[16.5rem] logo-glow"}),e("h1",{className:"text-3xl font-bold text-purple-300 mb-6",children:"Download Center"}),n("div",{className:"max-w-4xl mx-auto",children:[n("p",{className:"text-lg text-gray-200 mb-6",children:[e("strong",{className:"text-purple-300",children:"SYN"}),"ergistic ",e("strong",{className:"text-purple-300",children:"E"}),"nergy ",e("strong",{className:"text-purple-300",children:"R"}),"esearch and ",e("strong",{className:"text-purple-300",children:"EX"}),"ecution (",e("strong",{children:"SYNEREX"}),") Download Center provides authorized access to technical documentation, engineering resources, and validated materials supporting ECBS technology, SYNEREX software, and associated licensing and deployment programs. Content is curated to support utility review, OEM integration, and engineering evaluation."]}),n("div",{className:"text-lg text-gray-200 mb-6",children:[e("p",{className:"mb-4",children:"Downloadable resources may include:"}),n("ul",{className:"list-disc list-inside text-left space-y-2",children:[e("li",{children:"Technical overviews and engineering briefs"}),e("li",{children:"ECBS system architecture and application notes"}),e("li",{children:"Measurement and verification methodologies"}),e("li",{children:"Sample reports and validation documentation"}),e("li",{children:"Licensing, OEM, and program reference materials"})]})]})]})]})]}),e(t,{}),n("section",{className:"max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6",children:[e(i,{title:"Engineering Brief",href:"/docs/IP Engineering Brief.pdf"}),e(i,{title:"SOW Template",href:"/docs/Synerex_SOW_Template_(Demo).pdf"}),e(i,{title:"ECBS Patent",href:"/docs/USPTO Dockery Patent 12375324B2.pdf",children:"Complete intellectual property portfolio covering ECBS technology and related innovations."}),e(i,{title:"Technology Brochure",href:"/docs/Synerex_Technology_Brochure.pdf",children:"Comprehensive overview of ECBS technology, benefits, and implementation capabilities."}),e(i,{title:"OEM Program Overview",href:"/docs/OEM_Program_Overview.pdf",children:"Detailed information about OEM/ODM licensing programs and manufacturing partnerships."}),e(i,{title:"Custom Engineering Brief",href:"/docs/Synerex_Custom_Engineering_Brief_(Demo).pdf",children:"Overview of custom engineering services and application-specific system design capabilities."}),e(i,{title:"Due Diligence Instructions",href:"/docs/Synerex_Due_Diligence_Instructions.pdf",children:"Guidelines and instructions for conducting due diligence on ECBS technology and licensing opportunities."}),e(i,{title:"Mutual NDA Sample",href:"/docs/Synerex_Mutual_NDA_Sample_(Demo).pdf",children:"Sample mutual non-disclosure agreement template for partnership and licensing discussions."})]})]})}export{s as default};
