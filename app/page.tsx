import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
        <h1 className="text-3xl font-bold mb-2">SH1ELD Tech</h1>
        <p className="text-gray-500 mb-8">AI Dashboard Access</p>
        
        <Link 
          href="/dashboard"
          className="block w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors"
        >
          Enter Dashboard
        </Link>
      </div>
    </div>
  );
}
