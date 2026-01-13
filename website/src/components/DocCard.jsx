import ProtectedDownload from "./ProtectedDownload.jsx";
export default function DocCard({ title, href, children }){
  return (
    <div className="p-6 rounded-xl border border-gray-700 bg-gray-800">
      <h3 className="font-bold text-gray-300">{title}</h3>
      {children && <div className="text-sm mt-2 text-gray-300">{children}</div>}
      <ProtectedDownload href={href} className="mt-3 px-3 py-1.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700">Download PDF</ProtectedDownload>
    </div>
  );
}