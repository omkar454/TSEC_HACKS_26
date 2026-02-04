import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Loader, Folder, User, ShieldCheck, PieChart, Lock, Info } from 'lucide-react'

import CustomButton from '../components/CustomButton'
import { CAMPAIGN_STATES, EXPENSE_STATES } from '../constants'

const CampaignDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [activeTab, setActiveTab] = useState('governance');
    const [userOwnership, setUserOwnership] = useState(0);

    // Enhanced Mock Data or State Data
    const [campaign, setCampaign] = useState(state || {
        title: "Eco-Friendly Documentary",
        description: "A deep dive into climate change solutions...",
        target: 50000,
        raised: 12000,
        deadline: "30",
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3",
        owner: "0x123...456",
        category: "Education",
        state: CAMPAIGN_STATES.VOTING_ACTIVE,
        fundsLocked: 12000,
        userContribution: 0
    });

    const [expenses, setExpenses] = useState([
        { id: 1, title: 'Camera Rental', amount: 25000, status: EXPENSE_STATES.VOTING_OPEN, approvalWeight: 45, rejectedWeight: 10, receipt: 'invoice_001.pdf' },
        { id: 2, title: 'Travel Logistics', amount: 10000, status: EXPENSE_STATES.APPROVED, approvalWeight: 75, rejectedWeight: 5, receipt: 'invoice_002.pdf' },
    ]);

    // Update Ownership % when campaign data changes
    useEffect(() => {
        if (campaign.raised > 0) {
            const ownership = (campaign.userContribution / campaign.target) * 100; // Using target for pool share or accumulated raised
            // Simulating ownership based on Total Raised for logical consistency
            const share = (campaign.userContribution / campaign.raised) * 100;
            setUserOwnership(share.toFixed(2));
        }
    }, [campaign]);

    const handleFund = () => {
        if (!amount) return;
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            const newRaised = parseFloat(campaign.raised) + parseFloat(amount);
            const newContribution = parseFloat(campaign.userContribution) + parseFloat(amount);

            setCampaign(prev => ({
                ...prev,
                raised: newRaised,
                userContribution: newContribution,
                fundsLocked: parseFloat(prev.fundsLocked) + parseFloat(amount)
            }));

            setAmount('');
            alert(`Successfully invested ₹${amount}. You now own more of this project!`);
        }, 1500);
    }

    const handleVote = (id, type) => {
        setExpenses(prev => prev.map(exp => {
            if (exp.id === id) {
                // Mocking vote weight addition
                const weightToAdd = parseFloat(userOwnership);
                if (type === 'approve') return { ...exp, approvalWeight: exp.approvalWeight + weightToAdd };
                if (type === 'reject') return { ...exp, rejectedWeight: exp.rejectedWeight + weightToAdd };
            }
            return exp;
        }));
    };

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

                        {activeTab === 'governance' && (
                            <div className="flex flex-col gap-6">
                                <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">Community Governance</h4>
                                <p className="text-[#808191] text-sm">Expenses must be approved by token holders. Your Vote Weight: <span className="text-[#8c6dfd] font-bold">{userOwnership}%</span></p>

                                {expenses.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-[#3a3a43] rounded-[10px] text-[#808191]">
                                        <p>No active expenses yet.</p>
                                        <p className="text-xs mt-2">Expenses will appear here once the campaign enters the Voting phase.</p>
                                    </div>
                                ) : (
                                    expenses.map((expense) => (
                                        <div key={expense.id} className="bg-[var(--secondary)] p-6 rounded-[10px] border border-[#3a3a43]">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="text-[var(--text-primary)] font-bold text-lg">{expense.title}</h5>
                                                    <p className="text-[#808191] text-sm">Receipt: <span className="text-[#4acd8d] underline cursor-pointer">{expense.receipt}</span></p>
                                                </div>
                                                <span
                                                    title={expense.status === EXPENSE_STATES.APPROVED ? "Approved by contributor vote. Funds released." : "Waiting for community consensus."}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-help ${expense.status === EXPENSE_STATES.APPROVED ? 'bg-[#4acd8d]/20 text-[#4acd8d]' : 'bg-[#eab308]/20 text-[#eab308]'}`}
                                                >
                                                    {expense.status}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[var(--text-primary)] font-mono font-bold">₹ {expense.amount.toLocaleString()}</span>
                                                <span className="text-[#808191] text-xs">Quorum: 30% Required</span>
                                            </div>

                                            {/* Voting Bars */}
                                            <div className="flex flex-col gap-2 mb-4">
                                                <div className="flex items-center gap-2 text-xs text-[#808191]">
                                                    <span>Approve ({expense.approvalWeight}%)</span>
                                                    <div className="flex-1 h-2 bg-[#3a3a43] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#4acd8d]" style={{ width: `${expense.approvalWeight}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-[#808191]">
                                                    <span>Reject ({expense.rejectedWeight}%)</span>
                                                    <div className="flex-1 h-2 bg-[#3a3a43] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#ef4444]" style={{ width: `${expense.rejectedWeight}%` }}></div>
                                                    </div>
                                                </div>

                                                {/* Quorum Indicator */}
                                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                                                    <p className="text-[10px] text-[#808191]">
                                                        <span className="text-[#8c6dfd] font-bold">{expense.approvalWeight + expense.rejectedWeight}%</span> Voted
                                                        <span className="mx-1">·</span>
                                                        Min 30% Quorum
                                                    </p>
                                                    {expense.approvalWeight + expense.rejectedWeight < 30 && (
                                                        <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                                                            ⚠️ Quorum Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions (Only if Voting Open) */}
                                            {expense.status === EXPENSE_STATES.VOTING_OPEN && parseFloat(userOwnership) > 0 && (
                                                <div className="flex gap-4 mt-4">
                                                    <button
                                                        onClick={() => handleVote(expense.id, 'approve')}
                                                        className="flex-1 py-2 bg-[#4acd8d]/10 text-[#4acd8d] border border-[#4acd8d] rounded hover:bg-[#4acd8d] hover:text-white transition-all font-semibold text-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(expense.id, 'reject')}
                                                        className="flex-1 py-2 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444] rounded hover:bg-[#ef4444] hover:text-white transition-all font-semibold text-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'transparency' && (
                            <div className="flex flex-col gap-4">
                                <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">Immutable Ledger</h4>
                                <div className="bg-[var(--secondary)] p-4 rounded-[10px] border border-[#3a3a43]">
                                    <div className="flex justify-between p-2 border-b border-[#3a3a43] text-[#808191] text-sm">
                                        <span>Item</span>
                                        <span>Status</span>
                                        <span>Amount</span>
                                    </div>
                                    {expenses.map(exp => (
                                        <div key={exp.id} className="flex justify-between p-3 text-[var(--text-primary)] text-sm">
                                            <span>{exp.title}</span>
                                            <span>{exp.status}</span>
                                            <span className="font-mono">₹ {exp.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between p-3 text-[#4acd8d] font-bold text-sm border-t border-[#3a3a43] mt-2">
                                        <span>Funds Released</span>
                                        <span></span>
                                        <span>₹ 10,000</span>
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
                                <p className="text-[#808191] text-xs uppercase font-bold">Funds Locked in Contract</p>
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
