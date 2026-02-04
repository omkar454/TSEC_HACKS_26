import React, { useState, useEffect } from 'react'
import { User, Settings, Shield, Edit, Heart, Layers, ShieldCheck, BarChart, History, Info, AlertCircle, CheckCircle, FileText, Unlock, Lock, PlusSquare, CreditCard } from 'lucide-react'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
    const { logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('campaigns');
    const [isLoading, setIsLoading] = useState(true);

    // Real Data State
    const [user, setUser] = useState({
        name: '',
        email: '',
        bio: '',
        walletAddress: '',
        role: ''
    });

    const [myCampaigns, setMyCampaigns] = useState([]);
    const [myDonations, setMyDonations] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                // 1. Fetch User Profile
                const { data: profile } = await api.get('/auth/profile');
                setUser({
                    name: profile.name,
                    email: profile.email,
                    walletAddress: profile.walletId || "",
                    role: profile.role,
                    bio: profile.bio || ""
                });

                // Default Tab
                if (profile.role === 'ADMIN') setActiveTab('audit-logs');

                // 2. Fetch My Contributions (Donations) - Not for Admin
                if (profile.role !== 'ADMIN') {
                    const { data: donations } = await api.get('/finance/my-contributions');
                    setMyDonations(donations.map(d => ({
                        id: d._id,
                        projectTitle: d.projectId?.title || "Unknown Project",
                        amount: d.amount,
                        date: new Date(d.createdAt).toLocaleDateString()
                    })));
                }

                // 3. Fetch My Campaigns (Creator only)
                if (profile.role === 'CREATOR') {
                    const { data: allProjects } = await api.get('/projects');
                    const myProjs = allProjects.filter(p =>
                        (p.creatorId?._id === profile._id) || (p.creatorId === profile._id)
                    );

                    setMyCampaigns(myProjs.map(p => ({
                        id: p._id,
                        title: p.title,
                        status: p.status,
                        raised: p.currentFunding,
                        rawDeadline: p.deadline
                    })));
                }

                // 4. Fetch Governance Data (Admin only)
                if (profile.role === 'ADMIN') {
                    try {
                        const { data: logs } = await api.get('/admin/logs');
                        setAuditLogs(logs);

                        const { data: stats } = await api.get('/admin/analytics');
                        setAnalytics(stats);
                    } catch (err) {
                        console.error("Admin data fetch error:", err);
                    }
                }

            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleEditToggle = () => setIsEditing(!isEditing);

    const handleSave = () => {
        setIsEditing(false);
        // Implement Update Profile API if exists
        alert("Profile update saved (Local only - Backend update API pending)");
    }

    const handleCreateWallet = async () => {
        try {
            const { data: wallet } = await api.post('/wallet/create');
            setUser(prev => ({ ...prev, walletAddress: wallet._id }));
            alert("Wallet created successfully!");
        } catch (error) {
            console.error("Failed to create wallet", error);
            alert("Failed to create wallet: " + (error.response?.data?.message || error.message || "Please try again."));
        }
    }

    if (isLoading) return <div className="text-white text-center mt-10">Loading Profile...</div>;

    return (
        <div className="flex flex-col gap-6 text-[var(--text-primary)]">
            <h1 className="font-epilogue font-bold text-[24px]">My Profile</h1>

            <div className="flex md:flex-row flex-col gap-6">
                {/* User Card */}
                <div className="bg-[var(--secondary)] p-6 rounded-[20px] flex flex-col items-center border border-[#3a3a43] min-w-[300px] h-fit">
                    <div className="w-[100px] h-[100px] rounded-full bg-[var(--background)] flex items-center justify-center mb-4">
                        <User size={50} className="text-[#808191]" />
                    </div>

                    {!isEditing ? (
                        <>
                            <h2 className="text-[var(--text-primary)] font-bold text-xl">{user.name}</h2>
                            <p className="text-[#808191] text-sm text-center mt-2 px-4">{user.bio}</p>
                        </>
                    ) : (
                        <div className="w-full flex flex-col gap-4">
                            <input
                                value={user.name}
                                onChange={(e) => setUser({ ...user, name: e.target.value })}
                                className="bg-transparent border border-[#3a3a43] rounded p-2 text-center text-[var(--text-primary)]"
                            />
                            <textarea
                                value={user.bio}
                                onChange={(e) => setUser({ ...user, bio: e.target.value })}
                                className="bg-transparent border border-[#3a3a43] rounded p-2 text-center text-sm text-[#808191]"
                            />
                        </div>
                    )}

                    <span className="text-[#808191] text-sm mt-2 uppercase tracking-wide">{user.role}</span>
                    <div className="flex gap-2 mt-4">
                        <span className="px-3 py-1 bg-[#8c6dfd] rounded-full text-xs text-white">Verified</span>
                    </div>

                    <button onClick={isEditing ? handleSave : handleEditToggle} className="mt-6 text-[#4acd8d] flex items-center gap-2 text-sm hover:underline">
                        {isEditing ? <CheckIcon /> : <Edit size={14} />}
                        {isEditing ? 'Save Profile' : 'Edit Details'}
                    </button>

                    <button onClick={logout} className="mt-4 text-[#ef4444] text-sm hover:underline">
                        Log Out
                    </button>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Stats/Settings */}
                    <div className="bg-[var(--secondary)] p-6 rounded-[20px] border border-[#3a3a43]">
                        <h3 className="text-[var(--text-primary)] font-bold text-lg mb-6 flex items-center gap-2">
                            <Settings size={20} className="text-[#8c6dfd]" />
                            Settings & Security
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--background)] rounded-[10px] flex justify-between items-center">
                                <span className="text-[#808191] text-sm">Wallet Connected</span>
                                {user.walletAddress ? (
                                    <span className="text-[#4acd8d] font-bold text-xs font-mono">{user.walletAddress.substring(0, 10)}...</span>
                                ) : (
                                    <CustomButton
                                        btnType="button"
                                        title="Create Wallet"
                                        styles="bg-[#8c6dfd] py-1 px-3 text-xs min-h-[30px]"
                                        handleClick={handleCreateWallet}
                                    />
                                )}
                            </div>
                            <div className="p-4 bg-[var(--background)] rounded-[10px] flex justify-between items-center">
                                <span className="text-[#808191] text-sm">2FA Security</span>
                                <Shield size={16} className="text-[#4acd8d]" />
                            </div>
                        </div>
                    </div>

                    {/* History Tabs */}
                    <div className="bg-[var(--secondary)] p-6 rounded-[20px] border border-[#3a3a43] min-h-[400px]">
                        <div className="flex gap-6 border-b border-[#3a3a43] pb-4 mb-6">
                            {user.role === 'ADMIN' ? (
                                <>
                                    <button
                                        onClick={() => setActiveTab('audit-logs')}
                                        className={`flex items-center gap-2 font-epilogue font-semibold text-[16px] transition-colors ${activeTab === 'audit-logs' ? 'text-[#8c6dfd]' : 'text-[#808191]'}`}
                                    >
                                        <History size={18} />
                                        Audit Logs
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('analytics')}
                                        className={`flex items-center gap-2 font-epilogue font-semibold text-[16px] transition-colors ${activeTab === 'analytics' ? 'text-[#8c6dfd]' : 'text-[#808191]'}`}
                                    >
                                        <BarChart size={18} />
                                        Platform Analytics
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setActiveTab('campaigns')}
                                        className={`flex items-center gap-2 font-epilogue font-semibold text-[16px] transition-colors ${activeTab === 'campaigns' ? 'text-[#8c6dfd]' : 'text-[#808191]'}`}
                                    >
                                        <Layers size={18} />
                                        My Campaigns
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('donations')}
                                        className={`flex items-center gap-2 font-epilogue font-semibold text-[16px] transition-colors ${activeTab === 'donations' ? 'text-[#8c6dfd]' : 'text-[#808191]'}`}
                                    >
                                        <Heart size={18} />
                                        Donations
                                    </button>
                                </>
                            )}
                        </div>

                        {/* CONTENT SECTIONS */}
                        {activeTab === 'audit-logs' && user.role === 'ADMIN' && (
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-white font-black text-xl flex items-center gap-3">
                                            <div className="p-2 bg-[#8c6dfd]/20 rounded-lg text-[#8c6dfd]"><Shield size={20} /></div>
                                            Governance Audit Trail
                                        </h3>
                                        <p className="text-[#808191] text-xs font-medium">Immutable system logs for administrative actions and security events.</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 bg-[#1c1c24] px-4 py-2 rounded-full border border-[#3a3a43]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4acd8d] animate-pulse"></div>
                                        <span className="text-[10px] text-[#808191] font-bold uppercase tracking-widest">Live Monitoring</span>
                                    </div>
                                </div>

                                {auditLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-[#1c1c24] rounded-[20px] border border-dashed border-[#3a3a43]">
                                        <History size={40} className="text-[#3a3a43] mb-4" />
                                        <p className="text-[#808191] italic font-medium">Clear history. No governance events recorded.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto custom-scrollbar rounded-[20px] border border-[#3a3a43] bg-[#1c1c24]/50">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#3a3a43] bg-[#23232e]">
                                                    <th className="p-4 text-[10px] uppercase font-black text-[#808191] tracking-widest">Timestamp</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-[#808191] tracking-widest">Actor</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-[#808191] tracking-widest">Action</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-[#808191] tracking-widest">Entity</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-[#808191] tracking-widest text-center">Status</th>
                                                    <th className="p-4 text-[10px] uppercase font-black text-[#808191] tracking-widest text-right">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLogs.map((log, idx) => {
                                                    const isSuccess = log.status === 'SUCCESS';
                                                    const actionIcon = (type) => {
                                                        if (type.includes('CREATE')) return <PlusSquare size={14} className="text-[#4acd8d]" />;
                                                        if (type.includes('FREEZE')) return <Lock size={14} className="text-[#ef4444]" />;
                                                        if (type.includes('UNFREEZE')) return <Unlock size={14} className="text-[#4acd8d]" />;
                                                        if (type.includes('FUND')) return <CreditCard size={14} className="text-[#8c6dfd]" />;
                                                        return <FileText size={14} className="text-[#808191]" />;
                                                    };

                                                    return (
                                                        <React.Fragment key={log._id}>
                                                            <tr className={`border-b border-[#3a3a43]/50 hover:bg-[#23232e]/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-[#1c1c24]/30'}`}>
                                                                <td className="p-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white text-xs font-bold">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                                        <span className="text-[10px] text-[#808191] font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white text-xs font-bold">{log.actorId?.name || 'System'}</span>
                                                                        <span className="text-[10px] text-[#808191] uppercase font-bold tracking-tighter">{log.actorId?.role || 'CORE'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {actionIcon(log.action)}
                                                                        <span className="text-xs font-black text-white uppercase tracking-tighter">{log.action.replace('_', ' ')}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white text-[10px] font-bold uppercase">{log.resourceModel}</span>
                                                                        <span className="text-[9px] text-[#808191] font-mono">{log.resourceId?.substring(0, 12)}...</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isSuccess ? 'bg-[#4acd8d]/10 text-[#4acd8d] border border-[#4acd8d]/20' : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'}`}>
                                                                        {log.status}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <button
                                                                        onClick={() => {
                                                                            const detailsDiv = document.getElementById(`details-${log._id}`);
                                                                            if (detailsDiv) detailsDiv.classList.toggle('hidden');
                                                                        }}
                                                                        className="text-[#8c6dfd] hover:text-white transition-colors p-1"
                                                                        title="View JSON Payload"
                                                                    >
                                                                        <Info size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            <tr id={`details-${log._id}`} className="hidden bg-[#0d0d12]">
                                                                <td colSpan="6" className="p-6 border-b border-[#3a3a43]">
                                                                    <div className="flex flex-col gap-4">
                                                                        <div className="flex justify-between items-center text-[10px] uppercase font-black text-[#808191] tracking-widest border-b border-[#3a3a43]/50 pb-2">
                                                                            <span>Raw Metadata Payload</span>
                                                                            <span className="font-mono text-[#8c6dfd]">UUID: {log._id}</span>
                                                                        </div>
                                                                        <pre className="text-[11px] text-[#4acd8d] font-mono bg-[#1c1c24] p-4 rounded-xl overflow-x-auto border border-[#3a3a43]">
                                                                            {JSON.stringify(log.details || {}, null, 4)}
                                                                        </pre>
                                                                        {log.details?.reason && (
                                                                            <div className="flex gap-3 items-start bg-[#ef4444]/5 p-3 rounded-lg border border-[#ef4444]/10">
                                                                                <Info size={14} className="text-[#ef4444] mt-0.5" />
                                                                                <p className="text-xs text-[#ef4444] font-medium"><span className="font-bold">JUSTIFICATION:</span> {log.details.reason}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'analytics' && user.role === 'ADMIN' && analytics && (
                            <div className="flex flex-col gap-10">
                                {/* Dashboard Hero Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="relative group overflow-hidden p-6 bg-gradient-to-br from-[#1c1c24] to-[#23232e] rounded-[20px] border border-[#3a3a43] hover:border-[#8c6dfd] transition-all duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Layers size={60} className="text-[#8c6dfd]" />
                                        </div>
                                        <span className="text-[#808191] text-xs uppercase font-black tracking-widest">Total Projects</span>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <p className="text-3xl font-black text-white">{analytics.totalProjects}</p>
                                            <span className="text-[#4acd8d] text-xs font-bold">+12% ↑</span>
                                        </div>
                                    </div>

                                    <div className="relative group overflow-hidden p-6 bg-gradient-to-br from-[#1c1c24] to-[#23232e] rounded-[20px] border border-[#3a3a43] hover:border-[#4acd8d] transition-all duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Heart size={60} className="text-[#4acd8d]" />
                                        </div>
                                        <span className="text-[#808191] text-xs uppercase font-black tracking-widest">Global Funding</span>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <p className="text-3xl font-black text-[#4acd8d]">₹{analytics.totalFunding.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="relative group overflow-hidden p-6 bg-gradient-to-br from-[#1c1c24] to-[#23232e] rounded-[20px] border border-[#3a3a43] hover:border-[#8c6dfd] transition-all duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <ShieldCheck size={60} className="text-[#8c6dfd]" />
                                        </div>
                                        <span className="text-[#808191] text-xs uppercase font-black tracking-widest">Avg Pulse</span>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <p className="text-3xl font-black text-white">₹{Math.round(analytics.averageFunding).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Circular Health Score Card */}
                                    <div className="relative p-6 bg-gradient-to-br from-[#1c1c24] to-[#23232e] rounded-[20px] border border-[#3a3a43] flex items-center gap-4">
                                        <div className="relative w-16 h-16">
                                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                                <path
                                                    className="text-[#3a3a43] stroke-current"
                                                    strokeWidth="3"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className="text-[#1dc071] stroke-current"
                                                    strokeWidth="3"
                                                    strokeDasharray="98, 100"
                                                    strokeLinecap="round"
                                                    fill="none"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">98%</div>
                                        </div>
                                        <div>
                                            <span className="text-[#808191] text-[10px] uppercase font-black tracking-widest">Health Score</span>
                                            <p className="text-sm font-bold text-[#1dc071]">Optimal Range</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* STATUS DISTRIBUTION - Gradient Bar Chart */}
                                    <div className="bg-[#1c1c24]/50 p-8 rounded-[24px] border border-[#3a3a43] backdrop-blur-xl">
                                        <div className="flex justify-between items-center mb-8">
                                            <h4 className="text-white font-black text-xl flex items-center gap-3">
                                                <div className="p-2 bg-[#8c6dfd]/20 rounded-lg text-[#8c6dfd]"><BarChart size={20} /></div>
                                                Campaign Landscape
                                            </h4>
                                            <div className="px-3 py-1 bg-[#23232e] border border-[#3a3a43] rounded-full text-[10px] text-[#808191] font-bold">Real-time Data</div>
                                        </div>

                                        <div className="flex flex-col gap-8">
                                            {analytics.statusDistribution.map((item, idx) => {
                                                const percentage = Math.round((item.count / analytics.totalProjects) * 100);
                                                const colors = ['#8c6dfd', '#4acd8d', '#ef4444', '#e3a008', '#22d3ee'];
                                                const currentColor = colors[idx % colors.length];

                                                return (
                                                    <div key={item._id} className="group flex flex-col gap-3">
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex flex-col">
                                                                <span className="text-[#808191] text-[10px] uppercase font-black tracking-widest group-hover:text-white transition-colors">{item._id || 'UNSET'}</span>
                                                                <span className="text-white font-bold text-sm mt-0.5">{item.count} Active Projects</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-black text-white">{percentage}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-[#23232e] h-3 rounded-full overflow-hidden border border-[#3a3a43]/50">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: currentColor,
                                                                    boxShadow: `0 0 15px ${currentColor}50`
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ACTIVITY PULSE - SVG Area Chart Simulation */}
                                    <div className="bg-[#1c1c24]/50 p-8 rounded-[24px] border border-[#3a3a43] backdrop-blur-xl flex flex-col">
                                        <div className="flex justify-between items-center mb-8">
                                            <h4 className="text-white font-black text-xl flex items-center gap-3">
                                                <div className="p-2 bg-[#4acd8d]/20 rounded-lg text-[#4acd8d]"><ShieldCheck size={20} /></div>
                                                System Pulse
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#4acd8d] animate-pulse"></div>
                                                <span className="text-[10px] text-[#4acd8d] font-bold uppercase tracking-widest">Active Monitoring</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-h-[200px] relative mt-4">
                                            {/* SVG Chart */}
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#4acd8d" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#4acd8d" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path
                                                    d="M0,130 C50,120 80,70 120,85 C160,100 200,30 250,50 C300,70 350,20 400,40 V150 H0 Z"
                                                    fill="url(#chartGradient)"
                                                />
                                                <path
                                                    d="M0,130 C50,120 80,70 120,85 C160,100 200,30 250,50 C300,70 350,20 400,40"
                                                    fill="none"
                                                    stroke="#4acd8d"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                                {/* Dots at peaks */}
                                                <circle cx="120" cy="85" r="4" fill="#4acd8d" />
                                                <circle cx="250" cy="50" r="4" fill="#4acd8d" />
                                                <circle cx="400" cy="40" r="4" fill="#4acd8d" />
                                            </svg>

                                            <div className="absolute top-0 left-0 w-full flex justify-between px-2 opacity-50">
                                                <span className="text-[8px] text-[#808191] font-bold">JAN 26</span>
                                                <span className="text-[8px] text-[#808191] font-bold">FEB 05</span>
                                            </div>
                                        </div>

                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-[#23232e] rounded-xl border border-[#3a3a43]">
                                                <p className="text-[#808191] text-[10px] font-black uppercase tracking-tighter">Recent Surge</p>
                                                <p className="text-xl font-black text-white">+84 Actions</p>
                                            </div>
                                            <div className="p-4 bg-[#23232e] rounded-xl border border-[#3a3a43]">
                                                <p className="text-[#808191] text-[10px] font-black uppercase tracking-tighter">Uptime</p>
                                                <p className="text-xl font-black text-[#4acd8d]">99.9%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'campaigns' && user.role !== 'ADMIN' && (
                            <div className="flex flex-col gap-4">
                                <p className="text-[#808191] text-sm">Projects you have created.</p>
                                {myCampaigns.length === 0 ? (
                                    <div className="text-[#808191] italic">No campaigns created yet.</div>
                                ) : (
                                    myCampaigns.map(c => (
                                        <div key={c.id} className="bg-[var(--background)] p-4 rounded-[10px] flex justify-between items-center">
                                            <div>
                                                <h4 className="text-[var(--text-primary)] font-bold">{c.title}</h4>
                                                <span className="text-xs text-[#808191]">Status: <span className="uppercase text-[#4acd8d]">{c.status}</span></span>
                                            </div>
                                            <span className="text-[#4acd8d] font-bold">₹ {c.raised.toLocaleString()} Raised</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'donations' && user.role !== 'ADMIN' && (
                            <div className="flex flex-col gap-4">
                                <p className="text-[#808191] text-sm">Projects you have backed.</p>
                                {myDonations.length === 0 ? (
                                    <div className="text-[#808191] italic">No donations yet.</div>
                                ) : (
                                    myDonations.map(d => (
                                        <div key={d.id} className="bg-[var(--background)] p-4 rounded-[10px] flex justify-between items-center">
                                            <div>
                                                <h4 className="text-[var(--text-primary)] font-bold">{d.projectTitle}</h4>
                                                <span className="text-xs text-[#808191]">Date: {d.date}</span>
                                            </div>
                                            <span className="text-[#8c6dfd] font-bold">₹ {d.amount.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)

export default Profile
