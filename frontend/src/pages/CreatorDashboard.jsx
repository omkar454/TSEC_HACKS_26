import React, { useState, useEffect } from 'react'
import { Plus, Upload, CheckCircle, Clock, AlertCircle, RefreshCw, Coins, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'
import UploadBillForm from '../components/UploadBillForm'
import api from '../utils/api'
import { formatToIST } from '../utils/dateUtils'

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('expenses');
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [revenues, setRevenues] = useState([]); // New Revenue State
    const [showUpload, setShowUpload] = useState(false);
    const [stats, setStats] = useState({ raised: 0, spent: 0, revenue: 0, projectBalance: 0 });
    const [revenueForm, setRevenueForm] = useState({ source: '', amount: '', explanation: '', proofs: [] }); // Form State
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger re-fetches

    // 1. Fetch User's Projects
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userData = localStorage.getItem('user');
                if (!userData) {
                    navigate('/login');
                    return;
                }
                const user = JSON.parse(userData);

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
                    date: formatToIST(e.createdAt)
                })));

                // Fetch Revenue (New Endpoint needed or mock for now if not ready, but we confirmed backend has it)
                // We confirmed getProjectRevenue in controller
                const { data: revenueList } = await api.get(`/revenue/project/${selectedProjectId}`);
                setRevenues(revenueList.map(r => ({
                    id: r._id,
                    source: r.source,
                    amount: r.amount,
                    status: r.status, // PENDING, DISTRIBUTED
                    date: formatToIST(r.createdAt)
                })));

                // Update Stats
                const project = projects.find(p => p._id === selectedProjectId);
                if (project) {
                    const totalRaised = project.currentFunding || 0;
                    const totalRevenue = revenueList.filter(r => r.status === 'DISTRIBUTED').reduce((acc, curr) => acc + curr.amount, 0);
                    const approvedExpenses = expenseList.filter(e => e.status === 'APPROVED').reduce((acc, curr) => acc + curr.amount, 0);

                    // Fetch Project Wallet Balance
                    const { data: projectWallet } = await api.get(`/wallet/project/${selectedProjectId}`);

                    setStats({
                        raised: totalRaised,
                        spent: approvedExpenses,
                        revenue: totalRevenue,
                        projectBalance: projectWallet.balance
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
            const formData = new FormData();
            formData.append('projectId', selectedProjectId);
            formData.append('source', revenueForm.source);
            formData.append('amount', parseFloat(revenueForm.amount));
            formData.append('explanation', revenueForm.explanation);

            revenueForm.proofs.forEach(file => {
                formData.append('proofs', file);
            });

            await api.post('/revenue', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Revenue reported! Waiting for Admin approval.");
            setRevenueForm({ source: '', amount: '', explanation: '', proofs: [] });
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Revenue Reporting Failed: " + (error.response?.data?.message || error.message));
        }
    };


    return (
        <div className="flex flex-col gap-6 text-[var(--text-primary)]">
            <h1 className="font-epilogue font-bold text-[24px]">Creator Studio</h1>

            {/* Project Selector */}
            {projects.length > 0 ? (
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
            ) : (
                <div className="bg-[var(--secondary)] p-10 rounded-[20px] border-2 border-dashed border-[#3a3a43] text-center">
                    <AlertCircle className="mx-auto mb-4 text-[#808191] w-12 h-12" />
                    <h2 className="text-white font-bold text-xl mb-2">You haven't created any projects yet!</h2>
                    <p className="text-[#808191] mb-6">Launch your first campaign to start tracking funds and reporting revenue.</p>
                    <CustomButton
                        btnType="button"
                        title="Create New Project"
                        styles="bg-[#8c6dfd]"
                        handleClick={() => navigate('/create-campaign')}
                    />
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-6 rounded-[20px] border border-[#8c6dfd]/30">
                    <h3 className="text-[#8c6dfd] text-sm mb-2 flex items-center gap-2">
                        <Lock size={14} /> Project Vault
                    </h3>
                    <p className="text-[24px] font-bold text-white">₹ {stats.projectBalance.toLocaleString()}</p>
                </div>
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
                <div className="glass-panel p-6 rounded-[20px] border border-[#f0ad4e]/30">
                    <h3 className="text-[#f0ad4e] text-sm mb-2 flex items-center gap-2">
                        <Coins size={14} /> My Revenue Stake
                    </h3>
                    <p className="text-[24px] font-bold text-white">
                        {projects.find(p => p._id === selectedProjectId)?.creatorStake || 0}%
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[#3a3a43] pb-2 mt-6">
                <button onClick={() => setActiveTab('expenses')} className={`pb-2 ${activeTab === 'expenses' ? 'text-[#4acd8d] border-b-2 border-[#4acd8d]' : 'text-[#808191]'}`}>Finances & Expenses</button>
                <button onClick={() => setActiveTab('revenue')} className={`pb-2 ${activeTab === 'revenue' ? 'text-[#8c6dfd] border-b-2 border-[#8c6dfd]' : 'text-[#808191]'}`}>Revenue & Returns</button>
            </div>

            {/* Content */}
            <div className="glass-panel rounded-[20px] p-6 min-h-[300px] mt-4">
                {selectedProjectId && stats.raised > 0 && (
                    <div className="mb-10 bg-[var(--background)] p-6 rounded-[15px] border border-[#3a3a43]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[#808191] text-xs font-bold uppercase">Budget Utilization (Spent vs Raised)</span>
                            <span className="text-white text-xs font-bold">{Math.round((stats.spent / stats.raised) * 100)}%</span>
                        </div>
                        <div className="w-full h-3 bg-[#13131a] rounded-full overflow-hidden border border-[#3a3a43]">
                            <div className="h-full bg-[#4acd8d] transition-all duration-1000" style={{ width: `${(stats.spent / stats.raised) * 100}%` }}></div>
                        </div>
                        <p className="text-[10px] text-[#808191] mt-2 italic">You have utilized ₹{stats.spent.toLocaleString()} out of the total ₹{stats.raised.toLocaleString()} community fund.</p>
                    </div>
                )}

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
                        <form onSubmit={handleRevenueSubmit} className="flex flex-col gap-4 bg-[var(--background)] p-6 rounded-[10px] border border-[#3a3a43]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>

                            <FormField
                                labelName="Explanation / Context"
                                placeholder="Describe why this revenue was generated..."
                                isTextArea
                                value={revenueForm.explanation}
                                handleChange={(e) => setRevenueForm({ ...revenueForm, explanation: e.target.value })}
                            />

                            <div className="flex flex-col gap-2">
                                <span className="font-epilogue font-medium text-[14px] text-[#808191]">Multimedia Proofs (Images/PDFs)</span>
                                <input
                                    type="file"
                                    multiple
                                    className="bg-[var(--secondary)] text-white p-2 rounded border border-[#3a3a43]"
                                    onChange={(e) => setRevenueForm({ ...revenueForm, proofs: Array.from(e.target.files) })}
                                />
                            </div>

                            <div className="flex justify-end mt-2">
                                <CustomButton btnType="submit" title="Report Revenue for Approval" styles="bg-[#4acd8d] h-[52px] px-8" />
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
                                            <span className={`text-xs px-2 py-1 rounded ${rev.status === 'DISTRIBUTED' ? 'bg-[#4acd8d]/20 text-[#4acd8d]' : rev.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                {rev.status.replace('_', ' ')}
                                            </span>
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



export default CreatorDashboard
