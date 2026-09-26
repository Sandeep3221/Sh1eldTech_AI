"use client";

import { useEffect, useState } from "react";
import { UserPlus, Calendar, DollarSign, MapPin, Edit3, MessageSquare } from "lucide-react";
import { Card, PageHeader, Badge, Table, Th, Td } from "../../components/ui";

const statusColors: Record<string, "default" | "success" | "warning"> = {
  new: "warning",
  contacted: "default",
  interested: "default",
  quotation_sent: "default",
  won: "success",
  lost: "default"
};

interface LeadData {
  _id: string;
  clientId: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  days: number;
  travellers?: number;
  budget?: string;
  interests?: string;
  travelDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

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
        clientsData.forEach((c: Record<string, unknown>) => {
          if (c.clientId && c.name) {
            clientMap[c.clientId as string] = c.name as string;
          }
        });
        setClients(clientMap);
      }
    } catch (error) {
      console.error("Failed to load leads", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLead(id: string) {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes
        })
      });

      if (res.ok) {
        setEditingLeadId(null);
        fetchData();
      } else {
        alert("Failed to update lead");
      }
    } catch {
      alert("Failed to update lead");
    }
  }

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
        title="Leads Pipeline" 
        description="Monitor generated leads from the itinerary widgets across all clients."
      />
      
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Lead Contact</Th>
              <Th>Target Agency</Th>
              <Th>Trip Details</Th>
              <Th>Status & Notes</Th>
              <Th>Actions</Th>
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
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(lead.createdAt).toLocaleDateString()}
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
                  <div className="flex flex-col gap-1.5 text-xs text-gray-600 mt-2">
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
                  </div>
                </Td>
                <Td>
                  {editingLeadId === lead._id ? (
                    <div className="flex flex-col gap-2">
                      <select 
                        value={editStatus} 
                        onChange={e => setEditStatus(e.target.value)}
                        className="p-1 text-sm border rounded"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="quotation_sent">Quotation Sent</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                      <textarea 
                        value={editNotes} 
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Add notes..."
                        className="p-1 text-sm border rounded h-16 resize-none"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div>
                        <Badge variant={statusColors[lead.status || 'new'] || 'default'}>
                          {(lead.status || 'new').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {lead.notes && (
                        <div className="text-xs text-gray-600 flex gap-1.5 items-start mt-1">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-2" title={lead.notes}>{lead.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Td>
                <Td>
                  {editingLeadId === lead._id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateLead(lead._id)}
                        className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingLeadId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditingLeadId(lead._id);
                        setEditStatus(lead.status || 'new');
                        setEditNotes(lead.notes || '');
                      }}
                      className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
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
