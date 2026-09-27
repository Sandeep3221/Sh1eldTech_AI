"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Bot, Map, ChevronRight, Activity } from "lucide-react";
import { Card, PageHeader, Badge } from "../components/ui";

interface ClientData {
  _id: string;
  name: string;
  clientId: string;
  chatbotEnabled: boolean;
  itineraryEnabled: boolean;
  createdAt: string;
}

interface StatsData {
  totalClients: number;
  totalLeads: number;
  leadsThisMonth: number;
  aiRequests: number;
  chatRequests: number;
  itineraryRequests: number;
  aiFailures: number;
}

export default function DashboardOverview() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, statsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/dashboard/stats")
        ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const recentClients = clients.slice(0, 5);

  return (
    <div>
      <PageHeader 
        title="Overview" 
        description="Monitor your clients and AI integrations across Shield Tech."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Clients</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalClients}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Leads</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalLeads}</h3>
              <p className="text-xs text-gray-400 mt-1">{stats.leadsThisMonth} this month</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">AI Requests</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.aiRequests}</h3>
              <p className="text-xs text-gray-400 mt-1">{stats.chatRequests} chat, {stats.itineraryRequests} planner</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Bot className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">AI Failures</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.aiFailures}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Recent Clients
          </h2>
          <Link href="/dashboard/clients" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
            View all
          </Link>
        </div>
        
        {recentClients.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No clients onboarded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {recentClients.map((client) => (
              <Link 
                key={client._id} 
                href={`/dashboard/clients/${client._id}`}
                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {client.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5 font-mono">
                    {client.clientId}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex gap-2">
                    {client.chatbotEnabled && <Badge variant="success">Chatbot</Badge>}
                    {client.itineraryEnabled && <Badge variant="default" className="bg-purple-100 text-purple-800">Planner</Badge>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
