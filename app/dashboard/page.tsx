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

export default function DashboardOverview() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to fetch clients", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const totalClients = clients.length;
  const chatbotEnabledCount = clients.filter((c) => c.chatbotEnabled).length;
  const itineraryEnabledCount = clients.filter((c) => c.itineraryEnabled).length;
  const recentClients = clients.slice(0, 5);

  return (
    <div>
      <PageHeader 
        title="Overview" 
        description="Monitor your clients and AI integrations across Shield Tech."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Clients</p>
              <h3 className="text-3xl font-bold text-gray-900">{totalClients}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Chatbots</p>
              <h3 className="text-3xl font-bold text-gray-900">{chatbotEnabledCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <Bot className="w-5 h-5" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Planners</p>
              <h3 className="text-3xl font-bold text-gray-900">{itineraryEnabledCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Map className="w-5 h-5" />
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
