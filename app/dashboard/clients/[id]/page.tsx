"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Package2, HelpCircle, FileText, Code, Copy, CheckCircle2, Trash2, Edit2, Plus, Bot, Map } from "lucide-react";
import { Button, Card, Input, Label, Textarea, Badge } from "../../../components/ui";

interface ClientData {
  _id: string;
  name: string;
  clientId: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  location?: string;
  businessDescription?: string;
  supportEmail?: string;
  chatbotEnabled: boolean;
  itineraryEnabled: boolean;
}

interface Package {
  _id: string;
  title: string;
  destination: string;
  days: number;
  nights: number;
  price: number;
  description: string;
  inclusions: string[];
  exclusions: string[];
  active: boolean;
}

interface Faq {
  _id: string;
  question: string;
  answer: string;
}

interface Policy {
  _id: string;
  title: string;
  content: string;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [client, setClient] = useState<ClientData | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("info");

  const [pkgForm, setPkgForm] = useState<Partial<Package>>({});
  const [faqForm, setFaqForm] = useState<Partial<Faq>>({});
  const [policyForm, setPolicyForm] = useState<Partial<Policy>>({});

  const [editingPkg, setEditingPkg] = useState<string | null>(null);
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);

  const [copiedChatbot, setCopiedChatbot] = useState(false);
  const [copiedItinerary, setCopiedItinerary] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [clientRes, pkgsRes, faqsRes, polsRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch(`/api/packages?clientId=${id}`),
        fetch(`/api/faqs?clientId=${id}`),
        fetch(`/api/policies?clientId=${id}`)
      ]);

      if (clientRes.ok) setClient(await clientRes.json());
      if (pkgsRes.ok) setPackages(await pkgsRes.json());
      if (faqsRes.ok) setFaqs(await faqsRes.json());
      if (polsRes.ok) setPolicies(await polsRes.json());
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePackage(e: React.FormEvent) {
    e.preventDefault();
    const url = editingPkg ? `/api/packages/${editingPkg}` : "/api/packages";
    const method = editingPkg ? "PUT" : "POST";
    
    const dataToSave = {
      ...pkgForm,
      clientId: id,
      inclusions: typeof pkgForm.inclusions === 'string' ? (pkgForm.inclusions as string).split(',').map(s => s.trim()).filter(Boolean) : pkgForm.inclusions,
      exclusions: typeof pkgForm.exclusions === 'string' ? (pkgForm.exclusions as string).split(',').map(s => s.trim()).filter(Boolean) : pkgForm.exclusions,
    };

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSave) });
    if (res.ok) {
      setPkgForm({});
      setEditingPkg(null);
      fetchData();
    }
  }

  async function deletePackage(pkgId: string) {
    if (!confirm("Delete package?")) return;
    const res = await fetch(`/api/packages/${pkgId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  async function saveFaq(e: React.FormEvent) {
    e.preventDefault();
    const url = editingFaq ? `/api/faqs/${editingFaq}` : "/api/faqs";
    const method = editingFaq ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...faqForm, clientId: id }) });
    if (res.ok) {
      setFaqForm({});
      setEditingFaq(null);
      fetchData();
    }
  }

  async function deleteFaq(faqId: string) {
    if (!confirm("Delete FAQ?")) return;
    const res = await fetch(`/api/faqs/${faqId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  async function savePolicy(e: React.FormEvent) {
    e.preventDefault();
    const url = editingPolicy ? `/api/policies/${editingPolicy}` : "/api/policies";
    const method = editingPolicy ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...policyForm, clientId: id }) });
    if (res.ok) {
      setPolicyForm({});
      setEditingPolicy(null);
      fetchData();
    }
  }

  async function deletePolicy(polId: string) {
    if (!confirm("Delete policy?")) return;
    const res = await fetch(`/api/policies/${polId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  function handleCopy(text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-4xl">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
      </div>
    );
  }
  
  if (!client) return <div className="text-gray-500">Client not found</div>;

  const tabs = [
    { id: "info", label: "Business Info", icon: Building2 },
    { id: "packages", label: "Packages", icon: Package2, count: packages.length },
    { id: "faqs", label: "FAQs", icon: HelpCircle, count: faqs.length },
    { id: "policies", label: "Policies", icon: FileText, count: policies.length },
    { id: "embeds", label: "Embed Scripts", icon: Code },
  ];

  return (
    <div className="pb-16 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{client.clientId}</p>
          </div>
          <div className="flex gap-2">
            {client.chatbotEnabled && <Badge variant="success">Chatbot Active</Badge>}
            {client.itineraryEnabled && <Badge variant="default" className="bg-purple-100 text-purple-800">Planner Active</Badge>}
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <Card className="p-6 md:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Contact & Business Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-gray-900">{client.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-sm text-gray-900">{client.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">WhatsApp</p>
              <p className="text-sm text-gray-900">{client.whatsapp || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Website</p>
              <p className="text-sm text-blue-600 hover:underline">{client.website || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</p>
              <p className="text-sm text-gray-900">{client.location || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Support Email</p>
              <p className="text-sm text-gray-900">{client.supportEmail || "—"}</p>
            </div>
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Description</p>
              <p className="text-sm text-gray-700 leading-relaxed max-w-3xl whitespace-pre-wrap">{client.businessDescription || "No description provided."}</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "packages" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingPkg ? "Edit Package" : "Create New Package"}</h3>
            <form onSubmit={savePackage} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Title</Label>
                  <Input required placeholder="e.g. Bali Summer Retreat" value={pkgForm.title || ""} onChange={e => setPkgForm({...pkgForm, title: e.target.value})} />
                </div>
                <div>
                  <Label required>Destination</Label>
                  <Input required placeholder="e.g. Bali, Indonesia" value={pkgForm.destination || ""} onChange={e => setPkgForm({...pkgForm, destination: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Days</Label>
                    <Input required type="number" min="1" value={pkgForm.days || ""} onChange={e => setPkgForm({...pkgForm, days: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label required>Nights</Label>
                    <Input required type="number" min="0" value={pkgForm.nights || ""} onChange={e => setPkgForm({...pkgForm, nights: Number(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <Label required>Price ($)</Label>
                  <Input required type="number" min="0" value={pkgForm.price || ""} onChange={e => setPkgForm({...pkgForm, price: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-2">
                  <Label required>Description</Label>
                  <Textarea required placeholder="Describe the package experience..." value={pkgForm.description || ""} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} />
                </div>
                <div>
                  <Label>Inclusions (comma separated)</Label>
                  <Input placeholder="Flights, Hotel, Breakfast" value={Array.isArray(pkgForm.inclusions) ? pkgForm.inclusions.join(', ') : (pkgForm.inclusions || "")} onChange={e => setPkgForm({...pkgForm, inclusions: e.target.value as unknown as string[]})} />
                </div>
                <div>
                  <Label>Exclusions (comma separated)</Label>
                  <Input placeholder="Visa, Lunch, Personal expenses" value={Array.isArray(pkgForm.exclusions) ? pkgForm.exclusions.join(', ') : (pkgForm.exclusions || "")} onChange={e => setPkgForm({...pkgForm, exclusions: e.target.value as unknown as string[]})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit">{editingPkg ? "Update Package" : "Add Package"}</Button>
                {editingPkg && <Button type="button" variant="secondary" onClick={() => {setEditingPkg(null); setPkgForm({});}}>Cancel</Button>}
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            {packages.map(p => (
              <Card key={p._id} className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-gray-300 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-gray-900 text-lg">{p.title}</h4>
                    <Badge variant="default" className="bg-green-50 text-green-700 border border-green-200">${p.price}</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{p.destination} • {p.days} Days, {p.nights} Nights</p>
                  <p className="text-sm text-gray-500 line-clamp-2 max-w-3xl">{p.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => { setEditingPkg(p._id); setPkgForm(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-3">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" onClick={() => deletePackage(p._id)} className="px-3">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {packages.length === 0 && <div className="text-center p-8 text-gray-500 border border-dashed rounded-xl">No packages added yet.</div>}
          </div>
        </div>
      )}

      {activeTab === "faqs" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingFaq ? "Edit FAQ" : "Create New FAQ"}</h3>
            <form onSubmit={saveFaq} className="space-y-5">
              <div>
                <Label required>Question</Label>
                <Input required placeholder="e.g. What is the cancellation policy?" value={faqForm.question || ""} onChange={e => setFaqForm({...faqForm, question: e.target.value})} />
              </div>
              <div>
                <Label required>Answer</Label>
                <Textarea required placeholder="Provide a clear, helpful answer..." value={faqForm.answer || ""} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit">{editingFaq ? "Update FAQ" : "Add FAQ"}</Button>
                {editingFaq && <Button type="button" variant="secondary" onClick={() => {setEditingFaq(null); setFaqForm({});}}>Cancel</Button>}
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            {faqs.map(f => (
              <Card key={f._id} className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-gray-300 transition-colors">
                <div className="max-w-3xl">
                  <h4 className="font-bold text-gray-900 mb-2">{f.question}</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{f.answer}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => { setEditingFaq(f._id); setFaqForm(f); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-3">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" onClick={() => deleteFaq(f._id)} className="px-3">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {faqs.length === 0 && <div className="text-center p-8 text-gray-500 border border-dashed rounded-xl">No FAQs added yet.</div>}
          </div>
        </div>
      )}

      {activeTab === "policies" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingPolicy ? "Edit Policy" : "Create New Policy"}</h3>
            <form onSubmit={savePolicy} className="space-y-5">
              <div>
                <Label required>Policy Title</Label>
                <Input required placeholder="e.g. Refund Policy" value={policyForm.title || ""} onChange={e => setPolicyForm({...policyForm, title: e.target.value})} />
              </div>
              <div>
                <Label required>Policy Content</Label>
                <Textarea required className="min-h-[150px]" placeholder="Detailed policy rules..." value={policyForm.content || ""} onChange={e => setPolicyForm({...policyForm, content: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit">{editingPolicy ? "Update Policy" : "Add Policy"}</Button>
                {editingPolicy && <Button type="button" variant="secondary" onClick={() => {setEditingPolicy(null); setPolicyForm({});}}>Cancel</Button>}
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            {policies.map(p => (
              <Card key={p._id} className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-gray-300 transition-colors">
                <div className="max-w-3xl">
                  <h4 className="font-bold text-gray-900 mb-2">{p.title}</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{p.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => { setEditingPolicy(p._id); setPolicyForm(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-3">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" onClick={() => deletePolicy(p._id)} className="px-3">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {policies.length === 0 && <div className="text-center p-8 text-gray-500 border border-dashed rounded-xl">No policies added yet.</div>}
          </div>
        </div>
      )}

      {activeTab === "embeds" && (
        <div className="space-y-6">
          <Card className="p-8 border-blue-100 bg-blue-50/30">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Integration Scripts</h2>
            <p className="text-sm text-gray-600 max-w-2xl mb-8">
              Copy and paste the appropriate snippet directly into the <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">&lt;head&gt;</code> or just before the closing <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">&lt;/body&gt;</code> tag of the client&apos;s website.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {client.chatbotEnabled ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-900">Chatbot Assistant</h3>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs text-gray-500 mb-4">Adds a floating support assistant button to the bottom right of the website.</p>
                    <div className="relative mt-auto">
                      <pre className="bg-[#0d1117] text-[#c9d1d9] p-4 rounded-lg overflow-x-auto text-[13px] leading-relaxed font-mono">
{`<script
  src="${process.env.NEXT_PUBLIC_APP_URL || 'https://YOUR-AI-DOMAIN'}/chatbot.js"
  data-client-id="${client.clientId}">
</script>`}
                      </pre>
                      <button 
                        onClick={() => handleCopy(`<script\n  src="${process.env.NEXT_PUBLIC_APP_URL || 'https://YOUR-AI-DOMAIN'}/chatbot.js"\n  data-client-id="${client.clientId}">\n</script>`, setCopiedChatbot)}
                        className="absolute top-3 right-3 p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedChatbot ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <Bot className="w-8 h-8 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-900">Chatbot Disabled</h4>
                  <p className="text-sm text-gray-500 mt-1">Enable this feature in Business Info to view the embed script.</p>
                </div>
              )}

              {client.itineraryEnabled ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-900">Itinerary Planner</h3>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs text-gray-500 mb-4">Embeds a trip planning widget. Place this script wherever you want the widget to appear.</p>
                    <div className="relative mt-auto">
                      <pre className="bg-[#0d1117] text-[#c9d1d9] p-4 rounded-lg overflow-x-auto text-[13px] leading-relaxed font-mono">
{`<script
  src="${process.env.NEXT_PUBLIC_APP_URL || 'https://YOUR-AI-DOMAIN'}/itinerary.js"
  data-client-id="${client.clientId}">
</script>`}
                      </pre>
                      <button 
                        onClick={() => handleCopy(`<script\n  src="${process.env.NEXT_PUBLIC_APP_URL || 'https://YOUR-AI-DOMAIN'}/itinerary.js"\n  data-client-id="${client.clientId}">\n</script>`, setCopiedItinerary)}
                        className="absolute top-3 right-3 p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedItinerary ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <Map className="w-8 h-8 text-gray-300 mb-3" />
                  <h4 className="font-semibold text-gray-900">Planner Disabled</h4>
                  <p className="text-sm text-gray-500 mt-1">Enable this feature in Business Info to view the embed script.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
