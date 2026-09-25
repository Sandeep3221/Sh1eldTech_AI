"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/dashboard/clients", icon: Users },
    { name: "Leads", href: "/dashboard/leads", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 md:min-h-screen flex flex-col flex-shrink-0 z-10 sticky top-0 md:static">
        <div className="p-5 md:p-6 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-gray-100 shadow-sm flex-shrink-0">
              <Image src="/logo.jpg" alt="Shield Tech Logo" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-gray-900 tracking-tight">SH1ELD Tech</h2>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden md:block">Admin Workspace</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 pb-4 md:pb-6 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center gap-2.5 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? "bg-black text-white" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
          
          <div className="hidden md:block pt-6 mt-6 border-t border-gray-100">
            <button 
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors group"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
              Sign out
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 w-full min-w-0">
        <div className="max-w-[1200px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
