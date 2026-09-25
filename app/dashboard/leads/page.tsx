"use client";

import { useEffect, useState } from "react";
import { UserPlus, Calendar, DollarSign, MapPin } from "lucide-react";
import { Card, PageHeader, Badge, Table, Th, Td } from "../../components/ui";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsRes, clientsRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/clients")
        ]);

        if (leadsRes.ok) {
          setLeads(await leadsRes.json());
        }
        
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          const clientMap: Record<string, string> = {};
          clientsData.forEach((c: any) => {
            clientMap[c._id] = c.name;
          });
          setClients(clientMap);
        }
      } catch (error) {
        console.error("Failed to load leads", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Leads" 
        description="Monitor generated leads from the itinerary widgets across all clients."
      />
      
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Lead Contact</Th>
              <Th>Target Agency</Th>
              <Th>Trip Details</Th>
              <Th>Specs</Th>
              <Th>Source & Date</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                <Td>
                  <div className="font-semibold text-gray-900 mb-1">{lead.name}</div>
                  <div className="flex flex-col gap-0.5">
                    {lead.phone && <span className="text-xs text-gray-500">{lead.phone}</span>}
                    {lead.email && <span className="text-xs text-gray-500">{lead.email}</span>}
                  </div>
                </Td>
                <Td>
                  <Badge variant="default">{clients[lead.clientId] || lead.clientId}</Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900">{lead.destination || "Unspecified"}</span>
                  </div>
                  {lead.interests && (
                    <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]" title={lead.interests}>
                      {lead.interests}
                    </div>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                    {lead.budget && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        <span className="font-medium">{lead.budget}</span>
                      </div>
                    )}
                    {lead.days && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{lead.days} Days</span>
                      </div>
                    )}
                    {lead.travellers && (
                      <div className="flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                        <span>{lead.travellers} Pax</span>
                      </div>
                    )}
                  </div>
                </Td>
                <Td>
                  <div className="text-sm font-medium text-gray-900 mb-1">{lead.source}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </Td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <UserPlus className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No leads yet</h3>
                    <p className="text-sm text-gray-500">Leads will appear here when users submit the itinerary form.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
