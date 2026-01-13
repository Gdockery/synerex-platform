export default function LicenseSeal() {
  return (
    <div className="absolute top-20 right-4 z-50">
      <img 
        src="/images/Synerex License Seal.png" 
        alt="Synerex License Seal" 
        className="h-32 w-auto opacity-90 hover:opacity-100 transition-all duration-200 border-0 outline-none"
        style={{
          outline: 'none',
          filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))',
          boxShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.6), inset 0 -4px 8px rgba(0, 0, 0, 0.4), inset 2px 0 4px rgba(255, 255, 255, 0.3), inset -2px 0 4px rgba(0, 0, 0, 0.3), 0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderTop: '3px solid rgba(255, 255, 255, 0.4)',
          borderLeft: '3px solid rgba(255, 255, 255, 0.3)',
          borderBottom: '3px solid rgba(0, 0, 0, 0.3)',
          borderRight: '3px solid rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
}
