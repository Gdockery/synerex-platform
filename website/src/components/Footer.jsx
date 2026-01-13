export default function Footer(){
  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-3 py-10 grid md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-2">
          <a href="/" className="inline-flex items-center gap-2">
            <img 
              src="/images/Synerex_Logo_Transparent.png"
              alt="Synerex Laboratories, LLC" 
              className="h-10 w-auto brightness-0 invert"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{display: 'none'}} className="text-lg font-bold text-gray-300">SYNEREX</div>
          </a>
          <div className="text-gray-300" style={{fontSize: '0.75em'}}>© {new Date().getFullYear()} Synerex Laboratories, LLC. All rights reserved.</div>
        </div>
        <div className="space-y-2">
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/oem">OEM / ODM</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/custom-engineering">Custom Engineering</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/trademarks">Trademarks</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/legal-resources">For Attorneys</a>
        </div>
        <div className="space-y-2">
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/downloads">Downloads</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/contact">Contact</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/licensing">Licensing</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/privacy-policy">Privacy Policy</a><br/>
          <a className="hover:text-purple-400 font-bold text-gray-300" href="/copyright-notice">Copyright Notice</a>
        </div>
      </div>
    </footer>
  );
}