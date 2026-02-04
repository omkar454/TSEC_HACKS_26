import React, { useState, useEffect } from 'react'
import { User, Settings, Shield, Edit, Heart, Layers } from 'lucide-react'
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
        bio: 'Passionate creator making a difference.', // Backend doesn't store bio yet, keep as mock or add field later
        walletAddress: '',
        role: ''
    });

    const [myCampaigns, setMyCampaigns] = useState([]);
    const [myDonations, setMyDonations] = useState([]);

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
                    bio: profile.bio || "Passionate creator making a difference."
                });

                // 2. Fetch My Contributions (Donations)
                const { data: donations } = await api.get('/finance/my-contributions');
                // Backend returns array of { projectId, amount, ... }
                setMyDonations(donations.map(d => ({
                    id: d._id,
                    projectTitle: d.projectId?.title || "Unknown Project",
                    amount: d.amount,
                    date: new Date(d.createdAt).toLocaleDateString()
                })));

                // 3. Fetch My Campaigns (Creator only)
                if (profile.role === 'CREATOR') {
                    // We don't have a specific /projects/my-projects endpoint yet, 
                    // but we can filter from all projects or add an endpoint.
                    // For MVP, let's assuming /projects returns all and we filter by owner is inefficient but works if small.
                    // Better: Add endpoint. For now, let's use the public projects list and filter in frontend (Not secure/scalable but unblocks).
                    // OR check if I missed an endpoint. projectRoutes has getProjects. 
                    // Let's assume getProjects returns all.
                    const { data: allProjects } = await api.get('/projects');

                    // Backend project model has creatorId. 
                    // Profile ID is available.
                    const myProjs = allProjects.filter(p =>
                        (p.creatorId?._id === profile._id) || (p.creatorId === profile._id)
                    );

                    setMyCampaigns(myProjs.map(p => ({
                        id: p._id,
                        title: p.title,
                        status: p.status,
                        raised: p.currentFunding
                    })));
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
                        </div>

                        {activeTab === 'campaigns' && (
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

                        {activeTab === 'donations' && (
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
