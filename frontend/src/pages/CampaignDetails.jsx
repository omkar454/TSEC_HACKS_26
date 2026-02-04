import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Loader, Folder, User, ShieldCheck, PieChart, Lock, Info, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
// import { useAuth } from '../context/AuthContext'

import CustomButton from '../components/CustomButton'
import UploadBillForm from '../components/UploadBillForm'
import { CAMPAIGN_STATES, EXPENSE_STATES } from '../constants'
import api from '../utils/api'

const CampaignDetails = () => {
    const { user } = useAuth(); // Get user for role check
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [activeTab, setActiveTab] = useState('governance');

    // State for real data
    const [campaign, setCampaign] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [revenues, setRevenues] = useState([]);
    const [userOwnership, setUserOwnership] = useState(0);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Project Details
                const { data: project } = await api.get(`/projects/${id}`);

                // Map Backend Project to UI Model
                // Map Backend Project to UI Model
                const mappedProject = {
                    title: project.title,
                    description: project.description,
                    target: project.fundingGoal,
                    raised: project.currentFunding,
                    deadline: project.deadline ? new Date(project.deadline).toLocaleDateString() : "Ongoing",
                    image: project.imageUrl || "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
                    owner: project.creatorId?.name || "Unknown Creator",
                    category: project.category,
                    state: project.status,
                    fundsLocked: project.currentFunding,
                    userContribution: 0,
                    walletId: project.walletId,
                    creatorId: project.creatorId?._id || project.creatorId,
                    _id: project._id
                };
                setCampaign(mappedProject);

                // 2. Fetch Expenses
                const { data: expenseList } = await api.get(`/expenses/project/${id}`);
                setExpenses(expenseList.map(e => ({
                    id: e._id,
                    title: e.title,
                    amount: e.amount,
                    status: e.status, // "PENDING", "APPROVED", "REJECTED"
                    category: e.category,
                    date: new Date(e.createdAt).toLocaleDateString(),
                    receipt: e.receiptUrl || "No Receipt",
                })));

                // 2.1 Fetch Creator Wallet Balance for "Available Funds" accuracy
                try {
                    const { data: creatorWallet } = await api.get(`/wallet/creator-of-project/${id}`);
                    setCampaign(prev => ({ ...prev, fundsLocked: creatorWallet.balance }));
                } catch (err) {
                    console.error("Error fetching creator wallet:", err);
                }

                // 3. Fetch Contributions (Public Ledger)
                const { data: contribList } = await api.get(`/finance/projects/${id}/contributions`);
                setContributions(contribList);

                // 4. Calculate Ownership using PRIVATE contributions endpoint
                if (user && project.currentFunding > 0) {
                    try {
                        const { data: myContributions } = await api.get('/finance/my-contributions');
                        const myTotalForThisProject = myContributions
                            .filter(c => (c.projectId?._id === id || c.projectId === id) && c.status === 'COMPLETED')
                            .reduce((acc, curr) => acc + curr.amount, 0);

                        const pct = (myTotalForThisProject / project.currentFunding) * 100;
                        setUserOwnership(pct.toFixed(2));
                    } catch (err) {
                        console.error("Error fetching my contributions for ownership:", err);
                    }
                }

                // 5. Fetch Revenue
                const { data: revenueList } = await api.get(`/revenue/project/${id}`);
                setRevenues(revenueList);

            } catch (error) {
                console.error("Error fetching campaign details:", error);
                // navigate('/'); // Optional: redirect on error
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, refreshTrigger]);

    const handleFund = async () => {
        if (!amount) return;
        setIsLoading(true);
        try {
            await api.post('/finance/contribute', {
                projectId: id,
                amount: parseFloat(amount)
            });

            alert(`Successfully invested ₹${amount}.`);
            setAmount('');
            // Refresh data
            window.location.reload();
        } catch (error) {
            console.error("Funding failed:", error);
            alert("Funding failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    }

    // Admin Governance Handler
    const handleVote = async (expenseId, decision) => {
        // decision: 'approved' or 'rejected' (Backend expects status uppercase: APPROVED/REJECTED)
        const status = decision === 'approve' ? 'APPROVED' : 'REJECTED';

        if (!window.confirm(`Are you sure you want to ${status} this expense? Money will move.`)) return;

        try {
            await api.patch(`/expenses/${expenseId}/status`, { status });
            alert(`Expense ${status}!`);
            // Refresh local state specific item
            setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status } : e));
        } catch (error) {
            alert("Governance Action Failed: " + error.response?.data?.message);
        }
    };

    if (!campaign) return <div className="text-white text-center mt-10">Loading...</div>;

    return (
        <div className="flex flex-col gap-8 text-[var(--text-primary)]">
            {isLoading && <div className="fixed z-[10] w-full bg-[rgba(0,0,0,0.7)] flex items-center justify-center flex-col h-screen inset-0">
                <Loader className="w-[80px] h-[80px] object-contain animate-spin text-[#8c6dfd]" />
                <p className="mt-[20px] font-epilogue font-bold text-[20px] text-white text-center">Processing Blockchain Transaction...</p>
            </div>}

            {/* Header / Hero */}
            <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
                <div className="flex-1 flex-col">
                    <div className="relative">
                        <img src={campaign.image} alt="campaign" className="w-full h-[410px] object-cover rounded-[15px]" />
                        <div className="absolute top-4 left-4 flex items-center gap-2 group cursor-help z-10">
                            <div className="bg-[#8c6dfd] text-white px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2">
                                {campaign.state}
                                <Info size={14} />
                            </div>

                            {/* State Rules Tooltip */}
                            <div className="absolute top-8 left-0 w-[280px] bg-[#1c1c24]/95 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto transform translate-y-2">
                                <h4 className="text-white font-bold text-sm mb-2 border-b border-white/10 pb-2">Campaign Lifecycle</h4>
                                <div className="flex flex-col gap-2 text-xs text-[#808191]">
                                    <div className="flex justify-between">
                                        <span>🟢 Funding</span>
                                        <span>Open to investment</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>🟣 Voting</span>
                                        <span>Funds locked, governance active</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>🟡 Revenue</span>
                                        <span>Project live, returns generated</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2 rounded-full">
                        <div
                            className="absolute h-full bg-[#4acd8d] rounded-full"
                            style={{ width: `${(campaign.raised / campaign.target) * 100}%`, maxWidth: '100%' }}
                        >
                        </div>
                    </div>
                </div>

                <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
                    <CountBox title="Days Left" value={campaign.deadline} />
                    <CountBox title={`Raised of ₹${campaign.target}`} value={`₹${campaign.raised}`} />
                    <CountBox title="Backers" value="12" />
                </div>
            </div>

            <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
                {/* Left Column: Governance & Details */}
                <div className="flex-[2] flex flex-col gap-[40px]">

                    {/* Creator Info */}
                    <div className="flex flex-row items-center gap-[14px]">
                        <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[var(--secondary)] cursor-pointer">
                            <User className="w-[60%] h-[60%] text-[#808191]" />
                        </div>
                        <div>
                            <h4 className="font-epilogue font-semibold text-[14px] text-[var(--text-primary)] break-all">Created by {campaign.owner}</h4>
                            <p className="font-epilogue font-normal text-[12px] text-[var(--text-secondary)]">10 Campaigns Created</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-[#3a3a43] pb-2 overflow-x-auto">
                        {['governance', 'story', 'transparency'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`font-epilogue font-semibold text-[14px] capitalize py-2 px-4 rounded-t-[10px] transition-all whitespace-nowrap
                                ${activeTab === tab ? 'bg-[var(--secondary)] text-[#8c6dfd]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[200px]">
                        {activeTab === 'story' && (
                            <div>
                                <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Project Story</h4>
                                <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] leading-[26px] text-justify">
                                    {campaign.description}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">Governance & Expense Control</h4>
                            {user?.id === campaign?.creatorId && (
                                <CustomButton
                                    btnType="button"
                                    title={showExpenseForm ? "Close Form" : "Request Reimbursement (Submit Bill)"}
                                    styles={`${showExpenseForm ? 'bg-[#3a3a43]' : 'bg-[#8c6dfd]'} py-2 px-4 shadow-lg hover:shadow-[#8c6dfd]/40`}
                                    handleClick={() => setShowExpenseForm(!showExpenseForm)}
                                />
                            )}
                        </div>

                        {showExpenseForm && (
                            <div className="mb-10">
                                <UploadBillForm
                                    projectId={id}
                                    onClose={() => setShowExpenseForm(false)}
                                    onSuccess={() => {
                                        setShowExpenseForm(false);
                                        setRefreshTrigger(prev => prev + 1);
                                    }}
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-6">
                            <p className="text-[#808191] text-sm">Expenses must be approved by token holders (or Goverance Council). Your Vote Weight: <span className="text-[#4acd8d] font-bold">{userOwnership}%</span></p>

                            <div className="flex flex-col gap-4">
                                {expenses.length === 0 ? (
                                    <div className="p-10 text-center border-2 border-dashed border-[#3a3a43] rounded-[15px] opacity-50">
                                        <Info className="mx-auto mb-2 text-[#808191]" />
                                        <p className="text-[#808191]">No active expense requests for this project.</p>
                                    </div>
                                ) : (
                                    expenses.map((expense) => (
                                        <div key={expense.id} className="bg-[var(--secondary)] p-6 rounded-[15px] border border-[#3a3a43] group hover:border-[#8c6dfd]/50 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="text-[var(--text-primary)] font-bold text-lg">{expense.title}</h5>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-[#808191] bg-[#1c1c24] px-2 py-0.5 rounded border border-[#3a3a43]">{expense.category}</span>
                                                        <span className="text-[#808191] text-[10px]">Submitted {expense.date || 'recently'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold tracking-wider uppercase ${expense.status === 'APPROVED' ? 'bg-[#4acd8d]/20 text-[#4acd8d]' :
                                                        expense.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-yellow-500/20 text-yellow-500'
                                                        }`}>
                                                        {expense.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mb-4 pt-4 border-t border-[#3a3a43]">
                                                <span className="text-[var(--text-primary)] font-mono font-bold text-xl">₹ {expense.amount.toLocaleString()}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#808191]">Receipt:</span>
                                                    <a href={expense.receipt} target="_blank" rel="noreferrer" className="text-[#8c6dfd] text-xs hover:underline flex items-center gap-1">
                                                        View Bill <Info size={12} />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Admin Actions */}
                                            {expense.status === 'PENDING' && user?.role === 'ADMIN' && (
                                                <div className="flex gap-4 mt-6">
                                                    <button
                                                        onClick={() => handleVote(expense.id, 'approve')}
                                                        className="flex-1 py-3 bg-[#4acd8d] text-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#4acd8d]/20"
                                                    >
                                                        Approve & Pay
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(expense.id, 'reject')}
                                                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-red-500/20"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}

                                            {expense.status === 'PENDING' && user?.role !== 'ADMIN' && (
                                                <div className="mt-4 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                                                    <p className="text-[10px] text-yellow-500 text-center italic">
                                                        ⏳ Pending Governance Verification (Council Approval)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {activeTab === 'transparency' && (
                            <div className="flex flex-col gap-8">
                                {/* Contributions Ledger */}
                                <div>
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Contribution Ledger</h4>
                                    <div className="bg-[var(--secondary)] p-4 rounded-[10px] border border-[#3a3a43] overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-400">
                                            <thead className="text-xs text-gray-700 uppercase bg-[#1c1c24] text-[#808191]">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Date</th>
                                                    <th className="px-4 py-3">Contributor</th>
                                                    <th className="px-4 py-3">Amount</th>
                                                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contributions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-6 text-center italic">No contributions yet. Be the first!</td>
                                                    </tr>
                                                ) : (
                                                    contributions.map((tx, idx) => (
                                                        <tr key={idx} className="border-b border-[#3a3a43] hover:bg-[#2c2f32]">
                                                            <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 font-mono text-[#8c6dfd]">
                                                                {tx.contributorName}
                                                            </td>
                                                            <td className="px-4 py-3 text-white">₹ {tx.amount.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-[#4acd8d]">
                                                                COMPLETED
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Revenue Ledger */}
                                <div>
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Revenue & Payouts</h4>
                                    <div className="bg-[var(--secondary)] p-4 rounded-[10px] border border-[#3a3a43] overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-400">
                                            <thead className="text-xs text-gray-700 uppercase bg-[#1c1c24] text-[#808191]">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Date</th>
                                                    <th className="px-4 py-3">Source</th>
                                                    <th className="px-4 py-3">Total Earned</th>
                                                    <th className="px-4 py-3 rounded-tr-lg">Distribution Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {revenues.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-6 text-center italic">No revenue reported yet.</td>
                                                    </tr>
                                                ) : (
                                                    revenues.map((rev, idx) => (
                                                        <tr key={idx} className="border-b border-[#3a3a43] hover:bg-[#2c2f32]">
                                                            <td className="px-4 py-3">{new Date(rev.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 text-white">{rev.source}</td>
                                                            <td className="px-4 py-3 text-[#4acd8d] font-bold">₹ {rev.amount.toLocaleString()}</td>
                                                            <td className="px-4 py-3">
                                                                {rev.status === 'DISTRIBUTED' ? (
                                                                    <span className="flex items-center gap-1 text-[#4acd8d]">
                                                                        <CheckCircle size={14} /> Distributed
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-yellow-500">Pending</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="mt-4 p-4 bg-[#8c6dfd]/10 rounded border border-[#8c6dfd]/30">
                                            <p className="text-sm text-[#808191]">
                                                <span className="text-white font-bold">Your Returns: </span>
                                                Based on your <span className="text-[#8c6dfd] font-bold">{userOwnership}%</span> ownership, you receive a proportional share of every "Distributed" revenue event directly to your wallet.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Financial Panel */}
                <div className="flex-1">
                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Financial Engine</h4>

                    <div className="mb-6 bg-[var(--secondary)] p-6 rounded-[20px] border border-[#3a3a43]">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="text-[#8c6dfd]" size={24} />
                            <div>
                                <p className="text-[#808191] text-xs uppercase font-bold">Available Creator Budget</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">₹ {campaign.fundsLocked.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <PieChart className="text-[#4acd8d]" size={24} />
                            <div>
                                <p className="text-[#808191] text-xs uppercase font-bold">Your Ownership</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{userOwnership}%</p>
                            </div>
                        </div>
                        <div className="w-full bg-[var(--background)] h-2 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-[#8c6dfd]" style={{ width: `${userOwnership}%` }}></div>
                        </div>
                        <p className="text-xs text-[#808191] mt-2 border-t border-[#3a3a43] pt-2">
                            * For demo purposes, revenue is manually simulated. In production, this would stream from platforms.
                        </p>
                    </div>

                    <div className="flex flex-col p-6 bg-[var(--secondary)] rounded-[20px] border border-[#3a3a43]">
                        <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-[#808191]">
                            Invest & Govern
                        </p>
                        <div className="mt-[30px]">
                            <div className="mt-[30px]">
                                {user?.role === 'CONTRIBUTOR' ? (
                                    <>
                                        <input
                                            type="number"
                                            placeholder="₹ 5000"
                                            step="1000"
                                            className="w-full py-[10px] sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-[var(--text-primary)] text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />

                                        <CustomButton
                                            btnType="button"
                                            title="Fund Project"
                                            styles="w-full bg-[#8c6dfd] mt-4"
                                            handleClick={handleFund}
                                        />
                                        <p className="text-[#808191] text-xs text-center mt-3 leading-relaxed">
                                            ℹ️ Funds are securely locked in the smart contract and can only be spent with contributor approval.
                                        </p>
                                    </>
                                ) : (
                                    <div className="p-4 bg-[#13131a] rounded-[10px] border border-[#3a3a43] text-center">
                                        <p className="text-[#808191] text-sm">
                                            {user?.role === 'CREATOR'
                                                ? "You are viewing this as a Creator. Switch to a Contributor account to invest."
                                                : "Only registered Contributors can invest in campaigns."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ... (Stats Subcomponent remains same)

// Stats Subcomponent
const CountBox = ({ title, value }) => {
    return (
        <div className="flex flex-col items-center w-[150px]">
            <h4 className="font-epilogue font-bold text-[30px] text-[var(--text-primary)] p-3 bg-[var(--secondary)] rounded-t-[10px] w-full text-center truncate">{value}</h4>
            <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] bg-[var(--background)] px-3 py-2 w-full rounded-b-[10px] text-center border-x border-b border-[#3a3a43]">{title}</p>
        </div>
    )
}

export default CampaignDetails
