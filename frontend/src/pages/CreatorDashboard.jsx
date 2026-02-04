import React, { useState, useEffect } from 'react'
import { Plus, Upload, CheckCircle, Clock, AlertCircle, RefreshCw, Coins } from 'lucide-react'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'
import api from '../utils/api'

const CreatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('expenses');
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [revenues, setRevenues] = useState([]); // New Revenue State
    const [showUpload, setShowUpload] = useState(false);
    const [stats, setStats] = useState({ raised: 0, spent: 0, revenue: 0 });
    const [revenueForm, setRevenueForm] = useState({ source: '', amount: '' }); // Form State
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger re-fetches

    // 1. Fetch User's Projects
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const { data: allProjects } = await api.get('/projects');
                const myProjs = allProjects.filter(p =>
                    (p.creatorId?._id === user._id) || (p.creatorId === user._id)
                );

                setProjects(myProjs);

                if (myProjs.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(myProjs[0]._id);
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            }
        };
        fetchDashboardData();
    }, [refreshTrigger]);

    // 2. Fetch Project Specific Data (Expenses & Revenue)
    useEffect(() => {
        if (!selectedProjectId) return;

        const fetchData = async () => {
            try {
                // Fetch Expenses
                const { data: expenseList } = await api.get(`/expenses/project/${selectedProjectId}`);
                setExpenses(expenseList.map(e => ({
                    id: e._id,
                    title: e.title,
                    amount: e.amount,
                    status: e.status, // PENDING, APPROVED, REJECTED
                    date: new Date(e.createdAt).toLocaleDateString()
                })));

                // Fetch Revenue (New Endpoint needed or mock for now if not ready, but we confirmed backend has it)
                // We confirmed getProjectRevenue in controller
                const { data: revenueList } = await api.get(`/revenue/project/${selectedProjectId}`);
                setRevenues(revenueList.map(r => ({
                    id: r._id,
                    source: r.source,
                    amount: r.amount,
                    status: r.status, // PENDING, DISTRIBUTED
                    date: new Date(r.createdAt).toLocaleDateString()
                })));

                // Update Stats
                const project = projects.find(p => p._id === selectedProjectId);
                if (project) {
                    const totalRaised = project.currentFunding || 0;
                    const totalRevenue = revenueList.filter(r => r.status === 'DISTRIBUTED').reduce((acc, curr) => acc + curr.amount, 0);
                    const approvedExpenses = expenseList.filter(e => e.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0);

                    setStats({
                        raised: totalRaised,
                        spent: approvedExpenses,
                        revenue: totalRevenue
                    });
                }

            } catch (error) {
                console.error("Project data fetch error:", error);
            }
        };
        fetchData();
    }, [selectedProjectId, projects, refreshTrigger]);

    const handleProjectChange = (e) => {
        setSelectedProjectId(e.target.value);
    }

    // Revenue Handlers
    const handleRevenueSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/revenue', {
                projectId: selectedProjectId,
                source: revenueForm.source,
                amount: parseFloat(revenueForm.amount)
            });
            alert("Revenue Ingested Successfully!");
            setRevenueForm({ source: '', amount: '' });
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Revenue Ingestion Failed: " + error.response?.data?.message);
        }
    };

    const handleDistribute = async (revenueId) => {
        if (!window.confirm("Are you sure? This will instantly distribute funds to all contributors.")) return;
        try {
            await api.post(`/revenue/${revenueId}/distribute`);
            alert("Revenue Distributed to Contributors!");
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Distribution Failed: " + error.response?.data?.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 text-[var(--text-primary)]">
            <h1 className="font-epilogue font-bold text-[24px]">Creator Studio</h1>

            {/* Project Selector */}
            {projects.length > 0 && (
                <div className="flex items-center gap-4">
                    <span className="text-[#808191]">Select Project:</span>
                    <select
                        className="bg-[var(--secondary)] text-white p-2 rounded border border-[#3a3a43] outline-none"
                        value={selectedProjectId || ''}
                        onChange={handleProjectChange}
                    >
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.title}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-[#808191] text-sm mb-2">Total Raised</h3>
                    <p className="text-[24px] font-bold text-[var(--text-primary)]">₹ {stats.raised.toLocaleString()}</p>
                </div>
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-[#808191] text-sm mb-2">Approved Expenses</h3>
                    <p className="text-[24px] font-bold text-[#4acd8d]">₹ {stats.spent.toLocaleString()}</p>
                </div>
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-[#808191] text-sm mb-2">Revenue Distributed</h3>
                    <p className="text-[24px] font-bold text-[#8c6dfd]">₹ {stats.revenue.toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[#3a3a43] pb-2 mt-6">
                <button onClick={() => setActiveTab('expenses')} className={`pb-2 ${activeTab === 'expenses' ? 'text-[#4acd8d] border-b-2 border-[#4acd8d]' : 'text-[#808191]'}`}>Expenses</button>
                <button onClick={() => setActiveTab('revenue')} className={`pb-2 ${activeTab === 'revenue' ? 'text-[#8c6dfd] border-b-2 border-[#8c6dfd]' : 'text-[#808191]'}`}>Revenue & Returns</button>
            </div>

            {/* Content */}
            <div className="glass-panel rounded-[20px] p-6 min-h-[300px] mt-4">

                {/* REVENUE TAB */}
                {activeTab === 'revenue' && (
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">Report Revenue</h3>
                                <p className="text-[#808191] text-sm">Ingest earnings from off-chain sources (Ads, Sponsorships) to share with backers.</p>
                            </div>
                        </div>

                        {/* Revenue Ingestion Form */}
                        <form onSubmit={handleRevenueSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--background)] p-4 rounded-[10px] border border-[#3a3a43]">
                            <FormField
                                labelName="Source"
                                placeholder="e.g. Youtube Ads Q3"
                                inputType="text"
                                value={revenueForm.source}
                                handleChange={(e) => setRevenueForm({ ...revenueForm, source: e.target.value })}
                            />
                            <FormField
                                labelName="Amount (₹)"
                                placeholder="10000"
                                inputType="number"
                                value={revenueForm.amount}
                                handleChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                            />
                            <div className="flex items-end">
                                <CustomButton btnType="submit" title="Ingest Revenue" styles="bg-[#4acd8d] w-full h-[52px]" />
                            </div>
                        </form>

                        {/* Revenue List */}
                        <h4 className="font-bold text-md mt-4">Revenue History</h4>
                        <div className="flex flex-col gap-3">
                            {revenues.length === 0 ? (
                                <p className="text-[#808191] text-sm italic">No revenue recorded yet.</p>
                            ) : (
                                revenues.map(rev => (
                                    <div key={rev.id} className="flex justify-between items-center bg-[var(--background)] p-4 rounded-[10px] border border-[#3a3a43]">
                                        <div>
                                            <p className="font-bold text-[var(--text-primary)]">{rev.source}</p>
                                            <p className="text-xs text-[#808191]">{rev.date}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[#8c6dfd] font-mono font-bold">₹ {rev.amount.toLocaleString()}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${rev.status === 'DISTRIBUTED' ? 'bg-[#4acd8d]/20 text-[#4acd8d]' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                {rev.status}
                                            </span>
                                            {rev.status !== 'DISTRIBUTED' && (
                                                <CustomButton
                                                    btnType="button"
                                                    title="Distribute"
                                                    styles="bg-[#8c6dfd] py-1 px-3 text-xs"
                                                    handleClick={() => handleDistribute(rev.id)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )
                            }
                        </div>
                    </div>
                )}

                {/* EXPENSES TAB */}
                {activeTab === 'expenses' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-epilogue font-semibold text-[18px]">Expense Requests</h2>
                            {selectedProjectId && (
                                <CustomButton
                                    btnType="button"
                                    title="Upload New Bill"
                                    styles="bg-[#8c6dfd] flex items-center gap-2"
                                    handleClick={() => setShowUpload(true)}
                                />
                            )}
                        </div>
                        {showUpload ? (
                            <UploadBillForm
                                projectId={selectedProjectId}
                                onClose={() => setShowUpload(false)}
                                onSuccess={() => {
                                    setShowUpload(false);
                                    setRefreshTrigger(prev => prev + 1);
                                }}
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-4 text-[#808191] text-sm mb-2 px-4">
                                    <span>Description</span>
                                    <span>Amount</span>
                                    <span>Date</span>
                                    <span>Status</span>
                                </div>
                                {expenses.length === 0 ? (
                                    <div className="py-10 text-center text-[#808191]">
                                        <p>No expenses recorded.</p>
                                        <p className="text-xs mt-1">Upload a bill to ask for community approval.</p>
                                    </div>
                                ) : (
                                    expenses.map((expense) => (
                                        <div key={expense.id} className="grid grid-cols-4 items-center bg-[var(--background)] p-4 rounded-[10px] text-[var(--text-primary)]">
                                            <span className="font-medium">{expense.title}</span>
                                            <span>₹ {expense.amount.toLocaleString()}</span>
                                            <span className="text-[#808191]">{expense.date}</span>
                                            <span className={`flex items-center gap-2 ${expense.status === 'APPROVED' ? 'text-[#4acd8d]' : 'text-[#f0ad4e]'}`}>
                                                {expense.status === 'APPROVED' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                                {expense.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

const UploadBillForm = ({ projectId, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: 'Equipment', // Default
        receiptUrl: 'https://example.com/invoice.pdf' // Mock for MVP
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/expenses', {
                projectId,
                title: form.description,
                amount: parseFloat(form.amount),
                category: form.category,
                description: form.description,
                receiptUrl: form.receiptUrl
            });
            alert("Expense Submitted!");
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to submit expense: " + error.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Expense Request</h3>
                <button onClick={onClose} className="text-[#808191] hover:text-white">Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[600px]">
                <FormField
                    labelName="Expense Description"
                    placeholder="e.g. Venue Booking for Shoot"
                    inputType="text"
                    value={form.description}
                    handleChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <FormField
                    labelName="Amount (₹)"
                    placeholder="5000"
                    inputType="number"
                    value={form.amount}
                    handleChange={(e) => setForm({ ...form, amount: e.target.value })}
                />

                <div className="flex flex-col gap-2">
                    <span className="font-epilogue font-medium text-[14px] text-[#808191]">Category</span>
                    <select
                        className="py-[15px] px-[25px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-[var(--text-primary)] text-[14px] rounded-[10px]"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="Equipment" className="bg-[#1c1c24]">Equipment</option>
                        <option value="Logistics" className="bg-[#1c1c24]">Logistics</option>
                        <option value="Talent" className="bg-[#1c1c24]">Talent</option>
                        <option value="Marketing" className="bg-[#1c1c24]">Marketing</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="font-epilogue font-medium text-[14px] text-[#808191]">Scan Bill / Receipt</span>
                    <div className="border-2 border-dashed border-[#3a3a43] rounded-[10px] h-[150px] flex flex-col items-center justify-center cursor-pointer hover:border-[#8c6dfd] transition-colors">
                        <Upload className="text-[#808191] mb-2" />
                        <span className="text-[#808191] text-sm">Drag or click to upload (Simulated)</span>
                    </div>
                </div>

                <CustomButton
                    btnType="submit"
                    title={isLoading ? "Submitting..." : "Submit for Verification"}
                    styles="bg-[#4acd8d]"
                />
            </form>
        </div>
    )
}

export default CreatorDashboard
