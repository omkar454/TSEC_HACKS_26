import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Info, ExternalLink, Loader, Coins, Database } from 'lucide-react';
import api from '../utils/api';
import finternetService from '../services/finternetService';
import PaymentConfirmModal from '../components/PaymentConfirmModal';

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [pendingRevenue, setPendingRevenue] = useState([]);
    const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'revenue'
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'expenses') {
                const { data } = await api.get('/expenses/pending');
                setExpenses(data);
            } else {
                const { data } = await api.get('/revenue/pending');
                setPendingRevenue(data);
            }
        } catch (err) {
            console.error(`Failed to fetch pending ${activeTab}:`, err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const handleReviewCheck = (id, status) => {
        if (status === 'REJECTED') {
            if (window.confirm("Reject this expense?")) executeReview(id, 'REJECTED');
            return;
        }

        // Approval Flow
        const exp = expenses.find(e => e._id === id);
        if (exp) {
            setSelectedExpense(exp);
            setShowPayoutModal(true);
        }
    };

    const executePayoutAndApprove = async () => {
        if (!selectedExpense) return;
        setIsLoading(true);
        try {
            await finternetService.createPayoutIntent(selectedExpense.amount, 'INR', 'Expense Payout: ' + selectedExpense.title);
            await executeReview(selectedExpense._id, 'APPROVED');
            setShowPayoutModal(false);
        } catch (error) {
            alert("Payout Failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const executeReview = async (id, status) => {
        try {
            await api.patch(`/expenses/${id}/status`, { status });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Action Failed: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRevenueAction = async (id, action) => {
        const confirmMsg = action === 'approve'
            ? "Approve this revenue and trigger automatic distribution?"
            : "Reject this revenue?";

        if (!window.confirm(confirmMsg)) return;

        try {
            if (action === 'approve') {
                await api.post(`/revenue/${id}/approve`);
            } else {
                const reason = window.prompt("Enter rejection reason:");
                if (!reason) return;
                await api.post(`/revenue/${id}/reject`, { reason });
            }
            alert(`Revenue ${action === 'approve' ? 'Approved & Distributed' : 'Rejected'}.`);
            fetchData();
        } catch (error) {
            alert("Action Failed: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="flex flex-col gap-8 text-[var(--text-primary)]">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader className="w-[80px] h-[80px] animate-spin text-[#8c6dfd]" />
                    <p className="mt-4 font-bold text-xl text-white">Updating Ledger...</p>
                </div>
            )}

            <div className="flex lg:flex-row flex-col justify-between items-start lg:items-center gap-4">
                <h1 className="font-epilogue font-bold text-[28px] flex items-center gap-3">
                    <ShieldAlert className="text-[#8c6dfd]" size={32} />
                    Administrative Ledger
                </h1>

                <div className="flex items-center gap-2 bg-[var(--secondary)] p-1 rounded-xl border border-[#3a3a43]">
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-[#8c6dfd] text-white' : 'text-[#808191] hover:text-white'}`}
                    >
                        <Database size={16} />
                        Expenses ({expenses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'revenue' ? 'bg-[#4acd8d] text-primary' : 'text-[#808191] hover:text-white'}`}
                    >
                        <Coins size={16} />
                        Revenue ({pendingRevenue.length})
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {activeTab === 'expenses' ? (
                    expenses.length === 0 ? (
                        <div className="p-20 text-center glass-panel rounded-[20px] border-2 border-dashed border-[#3a3a43]">
                            <CheckCircle className="mx-auto mb-4 text-[#4acd8d] opacity-20" size={60} />
                            <h3 className="text-[var(--text-primary)] font-bold text-xl">All Clear!</h3>
                            <p className="text-[#808191] mt-2">No pending expenses require your attention.</p>
                        </div>
                    ) : (
                        expenses.map((exp) => (
                            <div key={exp._id} className="glass-panel p-6 rounded-[20px] border border-[#3a3a43] hover:border-[#8c6dfd]/40 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8c6dfd]"></div>

                                <div className="flex lg:flex-row flex-col justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <h2 className="text-[20px] font-bold text-white group-hover:text-[#8c6dfd] transition-colors">{exp.title}</h2>
                                            <span className="text-[10px] bg-[#3a3a43] text-[#808191] px-2 py-1 rounded-md uppercase tracking-widest font-bold">
                                                {exp.category}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[var(--background)] p-3 rounded-xl border border-white/5">
                                                <p className="text-[#808191] text-[10px] uppercase font-bold mb-1">Project Origins</p>
                                                <p className="text-white font-semibold text-sm">{exp.projectId?.title}</p>
                                            </div>
                                            <div className="bg-[var(--background)] p-3 rounded-xl border border-white/5">
                                                <p className="text-[#808191] text-[10px] uppercase font-bold mb-1">Submitted By</p>
                                                <p className="text-white font-semibold text-sm">{exp.submittedBy?.name} <span className="text-[#808191] font-normal">({exp.submittedBy?.email})</span></p>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 bg-[#1c1c24] rounded-xl border border-white/5">
                                            <p className="text-[#808191] text-xs leading-relaxed">{exp.description}</p>
                                        </div>
                                    </div>

                                    <div className="lg:w-[250px] w-full flex flex-col justify-between items-end gap-6 bg-[#3a3a43]/20 p-6 rounded-2xl border border-white/5">
                                        <div className="text-right">
                                            <p className="text-[#808191] text-xs font-bold uppercase mb-1">Requested Amount</p>
                                            <p className="text-4xl font-epilogue font-bold text-[#4acd8d]">₹ {exp.amount?.toLocaleString()}</p>
                                        </div>

                                        <div className="flex flex-col w-full gap-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReviewCheck(exp._id, 'APPROVED')}
                                                    className="flex-1 bg-[#4acd8d] text-primary font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#4acd8d]/20"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReviewCheck(exp._id, 'REJECTED')}
                                                    className="flex-1 bg-[#ef4444] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#ef4444]/20"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                            <a
                                                href={exp.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full text-center py-2 text-[#8c6dfd] border border-[#8c6dfd]/30 rounded-xl hover:bg-[#8c6dfd]/10 transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <ExternalLink size={16} /> View Proof of Spend
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    pendingRevenue.length === 0 ? (
                        <div className="p-20 text-center glass-panel rounded-[20px] border-2 border-dashed border-[#3a3a43]">
                            <Info className="mx-auto mb-4 text-[#8c6dfd] opacity-20" size={60} />
                            <h3 className="text-[var(--text-primary)] font-bold text-xl">Quiet Waters</h3>
                            <p className="text-[#808191] mt-2">No pending revenue reports found.</p>
                        </div>
                    ) : (
                        pendingRevenue.map((rev) => (
                            <div key={rev._id} className="glass-panel p-6 rounded-[20px] border border-[#3a3a43] hover:border-[#4acd8d]/40 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4acd8d]"></div>

                                <div className="flex lg:flex-row flex-col justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <h2 className="text-[20px] font-bold text-white group-hover:text-[#4acd8d] transition-colors">{rev.source}</h2>
                                            <span className="text-[10px] bg-[#3a3a43] text-[#8c6dfd] px-2 py-1 rounded-md uppercase tracking-widest font-bold">
                                                Revenue Report
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[var(--background)] p-3 rounded-xl border border-white/5">
                                                <p className="text-[#808191] text-[10px] uppercase font-bold mb-1">Project Origins</p>
                                                <p className="text-white font-semibold text-sm">{rev.projectId?.title}</p>
                                            </div>
                                            <div className="bg-[var(--background)] p-3 rounded-xl border border-white/5">
                                                <p className="text-[#808191] text-[10px] uppercase font-bold mb-1">Timestamp</p>
                                                <p className="text-white font-semibold text-sm">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 bg-[#1c1c24] rounded-xl border border-white/5">
                                            <p className="text-[#808191] text-[10px] uppercase font-bold mb-1">Explanation</p>
                                            <p className="text-white text-sm italic">"{rev.explanation || 'No explanation provided.'}"</p>
                                        </div>

                                        {rev.proofUrls?.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {rev.proofUrls.map((url, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3 py-1 bg-[#3a3a43] text-[10px] text-[#808191] hover:text-white rounded-full border border-white/5 flex items-center gap-2 transition-all"
                                                    >
                                                        <ExternalLink size={12} />
                                                        Proof {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:w-[250px] w-full flex flex-col justify-between items-end gap-6 bg-[#3a3a43]/20 p-6 rounded-2xl border border-white/5">
                                        <div className="text-right">
                                            <p className="text-[#808191] text-xs font-bold uppercase mb-1">Reported Amount</p>
                                            <p className="text-4xl font-epilogue font-bold text-[#4acd8d]">₹ {rev.amount?.toLocaleString()}</p>
                                        </div>

                                        <div className="flex flex-col w-full gap-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRevenueAction(rev._id, 'approve')}
                                                    className="flex-1 bg-[#4acd8d] text-primary font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#4acd8d]/20"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRevenueAction(rev._id, 'reject')}
                                                    className="flex-1 border border-[#ef4444] text-[#ef4444] font-bold py-3 rounded-xl hover:bg-[#ef4444]/10 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            <PaymentConfirmModal
                isOpen={showPayoutModal}
                onClose={() => setShowPayoutModal(false)}
                onConfirm={executePayoutAndApprove}
                amount={selectedExpense?.amount || 0}
                title={`Payout for: ${selectedExpense?.title}`}
                isLoading={isLoading}
            />
        </div>
    );
};

export default AdminExpenses;
