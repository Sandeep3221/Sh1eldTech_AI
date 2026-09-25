"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, ShieldCheck, ChevronRight, Users } from "lucide-react";
import { Button, Card, Input, Label, Badge, PageHeader, Table, Th, Td } from "../../components/ui";

interface ClientData {
  _id: string;
  name: string;
  clientId: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  location: string;
  businessDescription: string;
  supportEmail: string;
  chatbotEnabled: boolean;
  itineraryEnabled: boolean;
}

const initialFormState = {
  name: "",
  clientId: "",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  location: "",
  businessDescription: "",
  supportEmail: "",
  chatbotEnabled: false,
  itineraryEnabled: false,
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function openNewForm() {
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEditForm(client: ClientData) {
    setFormData({
      name: client.name || "",
      clientId: client.clientId || "",
      email: client.email || "",
      phone: client.phone || "",
      whatsapp: client.whatsapp || "",
      website: client.website || "",
      location: client.location || "",
      businessDescription: client.businessDescription || "",
      supportEmail: client.supportEmail || "",
      chatbotEnabled: client.chatbotEnabled || false,
      itineraryEnabled: client.itineraryEnabled || false,
    });
    setEditingId(client._id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setIsFormOpen(false);
        fetchClients();
      } else {
        alert("Failed to save client");
      }
    } catch (error) {
      console.error("Error saving client", error);
      alert("Error saving client");
    }
  }

  async function deleteClient(id: string) {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
      } else {
        alert("Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client", error);
      alert("Error deleting client");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading clients...</div>;
  }

  return (
    <div>
      <PageHeader 
        title="Clients" 
        description="Manage agencies and their AI feature integrations."
        action={
          <Button onClick={openNewForm} className="gap-2">
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        }
      />

      {isFormOpen && (
        <Card className="p-6 md:p-8 mb-8 border-gray-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <ShieldCheck className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? "Edit Client Profile" : "Register New Client"}
            </h2>
          </div>
          
          <form onSubmit={saveClient} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label required>Business Name</Label>
                <Input required type="text" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label required>Unique Client ID</Label>
                <Input required type="text" name="clientId" value={formData.clientId} onChange={handleInputChange} className="font-mono text-sm" />
              </div>
              <div>
                <Label required>Primary Email</Label>
                <Input required type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Website URL</Label>
                <Input type="text" name="website" value={formData.website} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Location / Address</Label>
                <Input type="text" name="location" value={formData.location} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Support Email</Label>
                <Input type="email" name="supportEmail" value={formData.supportEmail} onChange={handleInputChange} />
              </div>
            </div>
            
            <div>
              <Label>Business Description</Label>
              <textarea 
                name="businessDescription" 
                value={formData.businessDescription} 
                onChange={handleInputChange} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none min-h-[100px]"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">AI Features</h4>
              <div className="flex flex-col sm:flex-row gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="chatbotEnabled" checked={formData.chatbotEnabled} onChange={handleInputChange} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black transition-all" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-black">Enable Chatbot Assistant</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="itineraryEnabled" checked={formData.itineraryEnabled} onChange={handleInputChange} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black transition-all" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-black">Enable Itinerary Planner</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save Client Configuration</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Business Name</Th>
              <Th>Client ID</Th>
              <Th>AI Features</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id} className="hover:bg-gray-50/50 group">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                      {client.name.substring(0, 2)}
                    </div>
                    <div>
                      <Link href={`/dashboard/clients/${client._id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {client.name}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">{client.email}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
                    {client.clientId}
                  </code>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {client.chatbotEnabled && <Badge variant="success">Chatbot</Badge>}
                    {client.itineraryEnabled && <Badge variant="default" className="bg-purple-100 text-purple-800">Planner</Badge>}
                    {!client.chatbotEnabled && !client.itineraryEnabled && <span className="text-xs text-gray-400">None</span>}
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-3 items-center">
                    <Link href={`/dashboard/clients/${client._id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Manage">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <button onClick={() => openEditForm(client)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteClient(client._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No clients registered</h3>
                    <p className="text-sm text-gray-500 mb-4">Add your first agency client to get started.</p>
                    <Button onClick={openNewForm} variant="secondary">Add Client</Button>
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
