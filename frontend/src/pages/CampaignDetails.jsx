import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Loader, Folder, User, ShieldCheck, PieChart, Lock, Info, CheckCircle, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

import CustomButton from '../components/CustomButton'
import UploadBillForm from '../components/UploadBillForm'
import { CAMPAIGN_STATES, EXPENSE_STATES } from '../constants'
import api from '../utils/api'
import finternetService from '../services/finternetService'
import PaymentConfirmModal from '../components/PaymentConfirmModal'
import { formatToIST, calculateCountdownIST } from '../utils/dateUtils'

const CampaignDetails = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [activeTab, setActiveTab] = useState('trust');

    const [campaign, setCampaign] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [revenues, setRevenues] = useState([]);
    const [governanceRequests, setGovernanceRequests] = useState([]);
    const [userOwnership, setUserOwnership] = useState(0);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });


    useEffect(() => {
        if (!campaign?.rawDeadline) return;

        const timer = setInterval(() => {
            setTimeLeft(calculateCountdownIST(campaign.rawDeadline));
        }, 1000);

        return () => clearInterval(timer);
    }, [campaign?.rawDeadline]);

    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDays, setExtensionDays] = useState(7);
    const [extensionReason, setExtensionReason] = useState('');

    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [deficitAmount, setDeficitAmount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { data: project } = await api.get(`/projects/${id}`);

                const mappedProject = {
                    title: project.title,
                    description: project.description,
                    target: project.fundingGoal,
                    raised: project.currentFunding,
                    rawDeadline: project.deadline,
                    deadline: project.deadline ? formatToIST(project.deadline) : "Ongoing",
                    image: project.imageUrl || "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
                    owner: project.creatorId?.name || "Unknown Creator",
                    category: project.category,
                    state: project.status,
                    fundsLocked: project.currentFunding,
                    creatorId: project.creatorId?._id || project.creatorId,
                    _id: project._id,
                    milestones: project.milestones || [],
                    tiers: project.tiers || {},
                    creatorStake: Number(project.creatorStake) || 0
                };
                console.log("Fetched Project Data:", project);
                console.log("Mapped Creator Stake:", mappedProject.creatorStake);
                setCampaign(mappedProject);

                const { data: expenseList } = await api.get(`/expenses/project/${id}`);
                setExpenses(expenseList.map(e => ({
                    id: e._id,
                    title: e.title,
                    amount: e.amount,
                    status: e.status,
                    category: e.category,
                    date: new Date(e.createdAt).toLocaleDateString(),
                    receipt: e.receiptUrl || "No Receipt",
                })));

                try {
                    const { data: projectWallet } = await api.get(`/wallet/project/${id}`);
                    setCampaign(prev => ({ ...prev, fundsLocked: projectWallet.balance }));
                } catch (err) { console.error(err); }

                const { data: contribList } = await api.get(`/finance/projects/${id}/contributions`);
                setContributions(contribList);

                if (user && project.currentFunding > 0) {
                    try {
                        const { data: myContributions } = await api.get('/finance/my-contributions');
                        const myTotal = myContributions
                            .filter(c => (c.projectId?._id === id || c.projectId === id) && c.status === 'COMPLETED')
                            .reduce((acc, curr) => acc + curr.amount, 0);

                        const totalFunding = project.fundingGoal || 1;
                        const poolShare = (myTotal / totalFunding);
                        const creatorStakeFactor = 1 - (project.creatorStake / 100);
                        const finalRevenueShare = (poolShare * creatorStakeFactor * 100).toFixed(2);

                        setUserOwnership(finalRevenueShare);
                    } catch (err) { console.error(err); }
                }

                const { data: revenueList } = await api.get(`/revenue/project/${id}`);
                setRevenues(revenueList);

                const { data: govRequests } = await api.get(`/governance/project/${id}`);
                setGovernanceRequests(govRequests);

            } catch (error) {
                console.error("Error fetching campaign details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, refreshTrigger]);

    const handleFundCheck = async () => {
        if (!amount) return;
        setIsLoading(true);
        try {
            let currentBalance = 0;
            try {
                const { data: walletData } = await api.get('/wallet');
                currentBalance = walletData.balance;
            } catch (err) { currentBalance = 0; }

            const investmentAmount = parseFloat(amount);
            if (investmentAmount > currentBalance) {
                setDeficitAmount(investmentAmount - currentBalance);
                setShowTopUpModal(true);
                setIsLoading(false);
                return;
            }
            executeFund();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const executeTopUpAndFund = async () => {
        try {
            setIsLoading(true);
            await finternetService.createPaymentIntent(deficitAmount, 'INR', 'Instant Top-up for Investment');
            await api.post('/wallet/add-funds', { amount: deficitAmount });
            setShowTopUpModal(false);
            await executeFund();
        } catch (error) {
            alert("Top-up failed: " + error.message);
            setIsLoading(false);
        }
    }

    const executeFund = async () => {
        try {
            await api.post('/finance/contribute', {
                projectId: id,
                amount: parseFloat(amount)
            });
            alert(`Successfully invested ₹${amount}.`);
            setAmount('');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Funding failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    }


    const handleMilestoneSubmit = async (milestoneId, type) => {
        let proofData = {};

        if (type === 'KICKOFF') {
            const textProof = window.prompt("Submit your Project Kickoff Plan / Script (Text):");
            if (!textProof) return;
            proofData = { textProof };
        } else if (type === 'PRODUCTION' || type === 'FINAL_DELIVERY') {
            // New logic: Trigger file upload
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*,video/*,application/pdf';

            input.onchange = async (e) => {
                const files = e.target.files;
                if (!files.length) return;

                setIsLoading(true);
                try {
                    const formData = new FormData();
                    for (let i = 0; i < files.length; i++) {
                        formData.append('media', files[i]);
                    }

                    const { data: uploadResult } = await api.post('/milestones/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    await api.post(`/milestones/${id}/${milestoneId}/submit`, { mediaUrls: uploadResult.urls });
                    alert("Multimedia Proof Uploaded & Submitted!");
                    setRefreshTrigger(prev => prev + 1);
                } catch (error) {
                    alert("Upload Failed: " + (error.response?.data?.message || error.message));
                } finally {
                    setIsLoading(false);
                }
            };
            input.click();
            return; // Exit early as upload is handled in onchange
        } else if (type === 'RELEASE') {
            const finalLink = window.prompt("Enter the final Public URL (Social Media/Platform):");
            if (!finalLink) return;
            proofData = { finalLink };
        }

        setIsLoading(true);
        try {
            await api.post(`/milestones/${id}/${milestoneId}/submit`, proofData);
            alert("Milestone Work Submitted for Review!");
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Submission Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleMilestoneVote = async (milestoneId, vote) => {
        if (!window.confirm(`Are you sure you want to vote ${vote}? This uses your weighted contribution power.`)) return;
        setIsLoading(true);
        try {
            await api.post(`/milestones/${id}/${milestoneId}/vote`, { vote });
            alert(`Your ${vote} vote has been recorded!`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Voting Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGovernanceVote = async (requestId, vote) => {
        if (!window.confirm(`Are you sure you want to vote ${vote}? This uses your weighted contribution power.`)) return;
        setIsLoading(true);
        try {
            await api.post(`/governance/deadline-vote`, { requestId, vote });
            alert(`Your ${vote} vote has been recorded!`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Voting Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleExtensionRequest = async () => {
        setIsLoading(true);
        try {
            await api.post('/governance/deadline-request', {
                projectId: id,
                extensionDays,
                reason: extensionReason
            });
            alert("Extension Request Submitted for Governance Voting!");
            setShowExtensionModal(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert("Request Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async (expenseId, status) => {
        try {
            await api.patch(`/expenses/${expenseId}/status`, { status: status.toUpperCase() });
            alert(`Expense ${status}ed`);
            setRefreshTrigger(p => p + 1);
        } catch (e) { alert(e.message); }
    };

    if (!campaign) return <div className="text-white text-center mt-10">Loading...</div>;

    return (
        <div className="flex flex-col gap-8 text-[var(--text-primary)]">
            {isLoading && <div className="fixed z-[100] w-full bg-[rgba(0,0,0,0.7)] flex items-center justify-center flex-col h-screen inset-0 backdrop-blur-sm">
                <Loader className="w-[80px] h-[80px] object-contain animate-spin text-[#8c6dfd]" />
                <p className="mt-[20px] font-epilogue font-bold text-[20px] text-white text-center tracking-widest">TRANSACTING WITH TRUST ENGINE...</p>
            </div>}

            <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
                <div className="flex-1 flex-col">
                    <div className="relative">
                        <img src={campaign.image} alt="campaign" className="w-full h-[410px] object-cover rounded-[15px]" />
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 group cursor-help">
                            <div className="bg-[#8c6dfd] text-white px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2">
                                {campaign.state}
                                <Info size={14} />
                            </div>
                        </div>
                    </div>
                    <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-[#4acd8d] rounded-full transition-all duration-1000"
                            style={{ width: `${(campaign.raised / campaign.target) * 100}%`, maxWidth: '100%' }}
                        />
                    </div>
                </div>

                <div className="flex md:w-[200px] w-full flex-wrap justify-between gap-[30px]">
                    <CountBox title="Time Remaining" value={`${timeLeft.days}d ${timeLeft.hours}h`} />
                    <CountBox title={`Raised of ₹${campaign.target.toLocaleString()}`} value={`₹${campaign.raised.toLocaleString()}`} />
                    <div className="flex flex-col items-center w-[150px]">
                        <h4 className="font-epilogue font-bold text-[30px] text-[var(--text-primary)] p-3 bg-[var(--secondary)] rounded-t-[10px] w-full text-center truncate">
                            {campaign.creatorStake}%
                        </h4>
                        <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] bg-[var(--background)] px-3 py-2 w-full rounded-b-[10px] text-center border-x border-b border-[#3a3a43]">
                            Creator Pool
                        </p>
                    </div>
                    <div className="flex flex-col items-center w-[150px]">
                        <h4 className="font-epilogue font-bold text-[30px] text-[var(--text-primary)] p-3 bg-[var(--secondary)] rounded-t-[10px] w-full text-center truncate">
                            {100 - campaign.creatorStake}%
                        </h4>
                        <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] bg-[var(--background)] px-3 py-2 w-full rounded-b-[10px] text-center border-x border-b border-[#3a3a43]">
                            Investor Pool
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
                <div className="flex-[2] flex flex-col gap-[40px]">
                    <div className="flex flex-row items-center gap-[14px]">
                        <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[var(--secondary)]">
                            <User className="w-[60%] h-[60%] text-[#808191]" />
                        </div>
                        <div>
                            <h4 className="font-epilogue font-semibold text-[14px] text-[var(--text-primary)]">Created by {campaign.owner}</h4>
                            <p className="font-epilogue font-normal text-[12px] text-[var(--text-secondary)]">Verified Platform Creator</p>
                        </div>
                    </div>

                    <div className="flex gap-4 border-b border-[#3a3a43] pb-2 overflow-x-auto">
                        {['trust', 'story', 'transparency', 'finances'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`font-epilogue font-semibold text-[14px] capitalize py-2 px-4 rounded-t-[10px] transition-all whitespace-nowrap
                                ${activeTab === tab ? 'bg-[var(--secondary)] text-[#8c6dfd] border-b-2 border-[#8c6dfd]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                {tab === 'trust' ? 'Trust & Governance' : tab}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[200px]">
                        {activeTab === 'story' && (
                            <div>
                                <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Project Story</h4>
                                <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] leading-[26px] text-justify">
                                    {campaign.description}
                                </p>
                            </div>
                        )}

                        {activeTab === 'trust' && (
                            <div className="flex flex-col gap-8">
                                <div className="bg-gradient-to-br from-[#1c1c24] to-[#23232e] p-6 rounded-[20px] border border-[#3a3a43] shadow-xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <h5 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck className="text-[#4acd8d]" size={20} /> Trust Engine Status
                                        </h5>
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-[#4acd8d]/10 text-[#4acd8d]">
                                            SYSTEM: {campaign.state}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[#808191] text-[10px] font-bold uppercase">Seed Tier (30%)</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-[#13131a] rounded-full overflow-hidden border border-[#3a3a43]">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${(campaign.raised / campaign.target) * 100 >= 30 ? 'bg-[#4acd8d]' : 'bg-[#eab308]'}`}
                                                        style={{ width: `${Math.min(((campaign.raised / campaign.target) * 100) / 0.3, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-white text-xs font-bold">{Math.round((campaign.raised / campaign.target) * 100)}%</span>
                                            </div>
                                            <p className="text-[10px] text-[#808191] mt-1 italic">
                                                {(campaign.raised / campaign.target) * 100 >= 30 ? "✅ Seed Goal Met." : "⚠️ Goal for safe funding."}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-[#808191] text-[10px] font-bold uppercase">Escrow Protection</span>
                                            <p className="text-white text-sm font-bold">₹ {campaign.fundsLocked.toLocaleString()}</p>
                                            <p className="text-[10px] text-[#4acd8d] font-bold mt-1 uppercase">Locked in Project Wallet</p>
                                        </div>

                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="text-[#808191] text-[10px] font-bold uppercase">Hard Deadline</span>
                                            <p className="text-white text-sm font-bold">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</p>
                                            <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">Automatic Kill-Switch Armed</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">Funding Milestones</h4>
                                    <div className="flex flex-col gap-4">
                                        {campaign.milestones.map((milestone, idx) => (
                                            <div key={milestone._id || idx} className={`p-5 rounded-[15px] border transition-all ${milestone.status === 'APPROVED' ? 'bg-[#4acd8d]/5 border-[#4acd8d]/30' : 'bg-[var(--secondary)] border-[#3a3a43] opacity-80'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-4">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${milestone.status === 'APPROVED' ? 'bg-[#4acd8d] text-primary' : 'bg-[#3a3a43] text-[#808191]'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[var(--text-primary)] font-bold text-lg">{milestone.title}</h5>
                                                            <p className="text-[#808191] text-xs mt-1">{milestone.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${milestone.status === 'APPROVED' ? 'bg-[#4acd8d]/20 text-[#4acd8d]' : milestone.status === 'SUBMITTED' ? 'bg-[#8c6dfd]/20 text-[#8c6dfd]' : 'bg-[#3a3a43] text-[#808191]'}`}>
                                                            {milestone.status}
                                                        </span>
                                                        <p className="text-[#8c6dfd] text-sm font-bold mt-2">Tranche: {milestone.tranchePercent}%</p>
                                                    </div>
                                                </div>

                                                {/* Evidence / Proof Display */}
                                                {(milestone.textProof || milestone.mediaUrls?.length > 0 || milestone.finalLink) && (
                                                    <div className="mt-4 p-4 bg-[#13131a] rounded-lg border border-[#3a3a43] flex flex-col gap-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] text-[#808191] uppercase font-bold tracking-widest">Digital Evidence Stack:</span>
                                                        </div>

                                                        {milestone.textProof && (
                                                            <div className="p-3 bg-[#1c1c24] rounded border border-[#3a3a43]">
                                                                <p className="text-gray-300 text-xs italic">"{milestone.textProof}"</p>
                                                            </div>
                                                        )}

                                                        {milestone.mediaUrls?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {milestone.mediaUrls.map((url, i) => (
                                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-[#8c6dfd]/10 text-[#8c6dfd] border border-[#8c6dfd]/30 rounded-full text-[10px] font-bold hover:bg-[#8c6dfd]/20 transition-all">Multimedia #{i + 1}</a>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {milestone.finalLink && (
                                                            <a href={milestone.finalLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#4acd8d] text-xs font-bold hover:underline">
                                                                <CheckCircle size={14} /> View Final Content Release
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Voting / Governance UI */}
                                                {milestone.status === 'SUBMITTED' && (
                                                    <div className="mt-4 p-4 border border-[#8c6dfd]/20 rounded-xl bg-[#8c6dfd]/5">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-white text-xs font-bold uppercase tracking-tight">Community Governance Progress</span>
                                                            <span className="text-[#8c6dfd] text-[10px] font-bold">{milestone.voteStats?.yesWeight.toFixed(1)}% / 50% Req.</span>
                                                        </div>

                                                        <div className="h-2 w-full bg-[#13131a] rounded-full overflow-hidden border border-[#3a3a43] flex">
                                                            <div className="bg-[#4acd8d] h-full transition-all duration-500" style={{ width: `${milestone.voteStats?.yesWeight || 0}%` }} />
                                                            <div className="bg-[#ef4444] h-full transition-all duration-500" style={{ width: `${milestone.voteStats?.noWeight || 0}%` }} />
                                                        </div>

                                                        {user?._id !== campaign?.creatorId && (
                                                            <div className="flex gap-2 mt-4">
                                                                <button
                                                                    onClick={() => handleMilestoneVote(milestone._id, 'YES')}
                                                                    className="flex-1 py-1.5 bg-[#4acd8d] text-primary font-bold text-[10px] rounded uppercase hover:bg-[#3fb87f]"
                                                                >
                                                                    I Approve (YES)
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMilestoneVote(milestone._id, 'NO')}
                                                                    className="flex-1 py-1.5 bg-transparent border border-[#ef4444] text-[#ef4444] font-bold text-[10px] rounded uppercase hover:bg-[#ef4444] hover:text-white"
                                                                >
                                                                    Reject (NO)
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Creator: Submit Button */}
                                                {milestone.status === 'PENDING' && user?._id === campaign?.creatorId && (
                                                    <button onClick={() => handleMilestoneSubmit(milestone._id, milestone.milestoneType)} className="mt-4 w-full py-2 border border-[#8c6dfd] text-[#8c6dfd] rounded-lg font-bold text-xs uppercase hover:bg-[#8c6dfd] hover:text-white transition-all">
                                                        Submit Proof for {milestone.milestoneType}
                                                    </button>
                                                )}

                                                {/* Admin: Oversight (Approved state) */}
                                                {milestone.status === 'APPROVED' && (
                                                    <div className="mt-4 flex items-center justify-center gap-2 text-[#4acd8d] text-[10px] font-black uppercase tracking-tighter">
                                                        <ShieldCheck size={14} /> Milestone Verified & Tranche Released
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-6">
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">Governance Proposals</h4>
                                    {user?._id === campaign?.creatorId && (
                                        <CustomButton btnType="button" title="Request Extension" styles="bg-[#8c6dfd] py-2 px-4 text-xs" handleClick={() => setShowExtensionModal(true)} />
                                    )}
                                </div>
                                <div className="flex flex-col gap-4">
                                    {governanceRequests.length === 0 ? (
                                        <div className="p-10 text-center border-2 border-dashed border-[#3a3a43] rounded-[15px] opacity-50">
                                            <Info className="mx-auto mb-2 text-[#808191]" />
                                            <p className="text-[#808191]">No active governance proposals.</p>
                                        </div>
                                    ) : (
                                        governanceRequests.map((req) => (
                                            <div key={req._id} className="bg-[var(--secondary)] p-6 rounded-[20px] border border-[#3a3a43] shadow-lg">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h5 className="text-white font-bold text-lg">Deadline Extension Request</h5>
                                                        <p className="text-[#808191] text-xs mt-1">Status: <span className={`uppercase font-bold ${req.status === 'APPROVED' ? 'text-[#4acd8d]' : req.status === 'REJECTED' ? 'text-red-500' : 'text-[#8c6dfd]'}`}>{req.status}</span></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-white font-mono font-bold">+{req.details.extensionDays} Days</span>
                                                        <p className="text-[10px] text-[#808191] uppercase">Proposed Extension</p>
                                                    </div>
                                                </div>
                                                <div className="bg-[#13131a] p-4 rounded-lg mb-6">
                                                    <p className="text-[#808191] text-sm italic">"{req.details.reason}"</p>
                                                </div>

                                                {req.status === 'PENDING' && (
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[#808191]">
                                                            <span>Consensus Progress</span>
                                                            <span className="text-white">Voting Closes: {new Date(req.expiresAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-[#13131a] rounded-full overflow-hidden border border-[#3a3a43]">
                                                            <div
                                                                className="h-full bg-[#4acd8d] transition-all duration-1000"
                                                                style={{ width: `${Math.min((req.votes.filter(v => v.vote === 'YES').reduce((s, v) => s + v.weight, 0)), 100)}%` }}
                                                            />
                                                        </div>
                                                        {user?.role === 'CONTRIBUTOR' && !req.votes.find(v => v.voterId === user._id) && (
                                                            <div className="flex gap-4 mt-2">
                                                                <button onClick={() => handleGovernanceVote(req._id, 'YES')} className="flex-1 py-3 bg-[#4acd8d] text-primary font-bold rounded-xl hover:opacity-80 transition-all">APPROVE (YES)</button>
                                                                <button onClick={() => handleGovernanceVote(req._id, 'NO')} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:opacity-80 transition-all">REJECT (NO)</button>
                                                            </div>
                                                        )}
                                                        {req.votes.find(v => v.voterId === user?._id) && (
                                                            <p className="text-center text-[#4acd8d] text-xs font-bold uppercase italic mt-2">✓ You have voted on this proposal</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'transparency' && (
                            <div className="flex flex-col gap-8">
                                <div>
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Contribution Ledger</h4>
                                    <div className="bg-[var(--secondary)] p-4 rounded-[10px] border border-[#3a3a43] overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-400">
                                            <thead>
                                                <tr className="text-[#808191] text-xs uppercase">
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Contributor</th>
                                                    <th className="px-4 py-3">Amount</th>
                                                    <th className="px-4 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contributions.map((tx, idx) => (
                                                    <tr key={idx} className="border-b border-[#3a3a43]">
                                                        <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 font-mono text-[#8c6dfd]">{tx.contributorName}</td>
                                                        <td className="px-4 py-3 text-white">₹ {tx.amount.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-[#4acd8d]">COMPLETED</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Revenue Stream</h4>
                                    <div className="bg-[var(--secondary)] p-4 rounded-[10px] border border-[#3a3a43] overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-400">
                                            <thead>
                                                <tr className="text-[#808191] text-xs uppercase">
                                                    <th className="px-4 py-2">Date</th>
                                                    <th className="px-4 py-2">Source</th>
                                                    <th className="px-4 py-2">Earned</th>
                                                    <th className="px-4 py-2">Payout</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {revenues.map((rev, idx) => (
                                                    <tr key={idx} className="border-t border-[#3a3a43]">
                                                        <td className="px-4 py-3">{new Date(rev.createdAt).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3">{rev.source}</td>
                                                        <td className="px-4 py-3 text-[#4acd8d]">₹ {rev.amount.toLocaleString()}</td>
                                                        <td className="px-4 py-3">{rev.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'finances' && (
                            <div className="flex flex-col gap-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase">Expense Claims</h4>
                                    {user?._id === campaign?.creatorId && (
                                        <CustomButton btnType="button" title={showExpenseForm ? "Close" : "Submit Bill"} styles="bg-[#8c6dfd] py-1 px-4 text-xs" handleClick={() => setShowExpenseForm(!showExpenseForm)} />
                                    )}
                                </div>
                                {showExpenseForm && <UploadBillForm projectId={id} onClose={() => setShowExpenseForm(false)} onSuccess={() => setRefreshTrigger(prev => prev + 1)} />}
                                <div className="flex flex-col gap-4">
                                    {expenses.length === 0 ? (
                                        <div className="p-10 text-center border-2 border-dashed border-[#3a3a43] rounded-[15px] opacity-50">
                                            <Info className="mx-auto mb-2 text-[#808191]" />
                                            <p className="text-[#808191]">No expenses recorded yet.</p>
                                        </div>
                                    ) : (
                                        expenses.map((expense) => (
                                            <div key={expense.id} className="bg-[var(--secondary)] p-6 rounded-[15px] border border-[#3a3a43]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h5 className="text-white font-bold">{expense.title}</h5>
                                                        <p className="text-xs text-[#808191]">{expense.category} • {expense.date}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${expense.status === 'APPROVED' ? 'bg-[#4acd8d]/20 text-[#4acd8d]' : 'bg-yellow-500/10 text-yellow-500'}`}>{expense.status}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-[#3a3a43]">
                                                    <span className="text-white font-mono font-bold">₹ {expense.amount.toLocaleString()}</span>
                                                    <a href={expense.receipt} target="_blank" rel="noreferrer" className="text-[#8c6dfd] text-xs hover:underline">Receipt</a>
                                                </div>
                                                {expense.status === 'PENDING' && user?.role === 'ADMIN' && (
                                                    <div className="flex gap-4 mt-6">
                                                        <button onClick={() => handleVote(expense.id, 'approve')} className="flex-1 py-2 bg-[#4acd8d] text-primary font-bold rounded-lg text-xs">APPROVE</button>
                                                        <button onClick={() => handleVote(expense.id, 'reject')} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-lg text-xs">REJECT</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    <h4 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] uppercase mb-4">Financial Engine</h4>
                    <div className="mb-6 bg-[var(--secondary)] p-6 rounded-[20px] border border-[#3a3a43]">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="text-[#8c6dfd]" size={24} />
                            <div>
                                <p className="text-[#808191] text-xs uppercase font-bold">Escrow Protection</p>
                                <p className="text-2xl font-bold text-white">₹ {campaign.fundsLocked.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <PieChart className="text-[#4acd8d]" size={24} />
                            <div>
                                <p className="text-[#808191] text-xs uppercase font-bold">Your Revenue Share</p>
                                <p className="text-2xl font-bold text-white">{userOwnership}%</p>
                            </div>
                        </div>
                        <div className="w-full bg-[var(--background)] h-2 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-[#8c6dfd]" style={{ width: `${userOwnership}%` }}></div>
                        </div>
                    </div>

                    <div className="flex flex-col p-6 bg-[var(--secondary)] rounded-[20px] border border-[#3a3a43]">
                        <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-[#808191]">Invest & Govern</p>
                        <div className="mt-[30px]">
                            {user?.role === 'CONTRIBUTOR' ? (
                                <>
                                    <input type="number" placeholder="₹ 5000" className="w-full py-[10px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] rounded-[10px]" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    <CustomButton btnType="button" title="Fund Project" styles="w-full bg-[#8c6dfd] mt-4" handleClick={handleFundCheck} />
                                    <p className="text-[#808191] text-[10px] text-center mt-3 leading-relaxed leading-relaxed font-bold uppercase tracking-tighter text-[#4acd8d]">SAFE: FUNDS HELD IN ATOMIC ESCROW</p>
                                </>
                            ) : (
                                <div className="p-4 bg-[#13131a] rounded-[10px] border border-[#3a3a43] text-center text-sm text-[#808191]">Only registered Contributors can invest.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showExtensionModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#1c1c24] w-full max-w-[500px] p-8 rounded-[24px] border border-[#3a3a43] shadow-2xl">
                        <h3 className="text-white font-bold text-2xl mb-2">Request Extension</h3>
                        <p className="text-[#808191] text-sm mb-6">Propose a deadline extension. Needs 51% consensus.</p>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-1">
                                <label className="text-[#808191] text-[10px] font-bold uppercase">Days</label>
                                <input type="number" value={extensionDays} onChange={(e) => setExtensionDays(e.target.value)} className="bg-[#13131a] border border-[#3a3a43] p-3 rounded-lg text-white outline-none" min="1" max="30" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[#808191] text-[10px] font-bold uppercase">Justification</label>
                                <textarea value={extensionReason} onChange={(e) => setExtensionReason(e.target.value)} className="bg-[#13131a] border border-[#3a3a43] p-3 rounded-lg text-white outline-none h-24" placeholder="Why do you need more time?" />
                            </div>
                            <div className="flex gap-4 mt-2">
                                <button onClick={() => setShowExtensionModal(false)} className="flex-1 py-3 bg-[#3a3a43] text-white font-bold rounded-xl">Cancel</button>
                                <button onClick={handleExtensionRequest} className="flex-1 py-3 bg-[#1dc071] text-primary font-bold rounded-xl">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PaymentConfirmModal isOpen={showTopUpModal} onClose={() => setShowTopUpModal(false)} onConfirm={executeTopUpAndFund} amount={deficitAmount} title="Investment Top-up" isLoading={isLoading} />
        </div>
    )
}

const CountBox = ({ title, value }) => (
    <div className="flex flex-col items-center w-[150px]">
        <h4 className="font-epilogue font-bold text-[30px] text-[var(--text-primary)] p-3 bg-[var(--secondary)] rounded-t-[10px] w-full text-center truncate">{value}</h4>
        <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] bg-[var(--background)] px-3 py-2 w-full rounded-b-[10px] text-center border-x border-b border-[#3a3a43]">{title}</p>
    </div>
)

export default CampaignDetails
