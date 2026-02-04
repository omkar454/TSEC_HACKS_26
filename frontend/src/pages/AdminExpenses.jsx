import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Info, ExternalLink, Loader } from 'lucide-react';
import api from '../utils/api';

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPendingExpenses = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/expenses/pending');
            setExpenses(data);
        } catch (err) {
            console.error("Failed to fetch pending expenses:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingExpenses();
    }, []);

    const handleReview = async (id, status) => {
        const action = status === 'APPROVED' ? 'APPROVE' : 'REJECT';
        if (!window.confirm(`Are you sure you want to ${action} this expense?`)) return;

        try {
            await api.patch(`/expenses/${id}/status`, { status });
            alert(`Expense ${status.toLowerCase()} successfully.`);
            fetchPendingExpenses();
        } catch (error) {
            alert("Action Failed: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="flex flex-col gap-8 text-[var(--text-primary)]">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader className="w-[80px] h-[80px] animate-spin text-[#8c6dfd]" />
                    <p className="mt-4 font-bold text-xl text-white">Fetching Pending Ledgers...</p>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="font-epilogue font-bold text-[28px] flex items-center gap-3">
                    <ShieldAlert className="text-[#8c6dfd]" size={32} />
                    Pending Expenses Ledger
                </h1>
                <div className="bg-[var(--secondary)] px-4 py-2 rounded-xl border border-[#3a3a43]">
                    <span className="text-[#808191] text-sm">Pending Requests: </span>
                    <span className="text-white font-bold">{expenses.length}</span>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {expenses.length === 0 ? (
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
                                                onClick={() => handleReview(exp._id, 'APPROVED')}
                                                className="flex-1 bg-[#4acd8d] text-primary font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#4acd8d]/20"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReview(exp._id, 'REJECTED')}
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
                )}
            </div>
        </div>
    );
};

export default AdminExpenses;
