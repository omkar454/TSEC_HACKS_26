import React, { useState } from 'react'
import { User, Settings, Shield, Edit, Heart, Layers } from 'lucide-react'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('campaigns');
    const [user, setUser] = useState({
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Passionate creator making a difference.'
    });

    const handleEditToggle = () => setIsEditing(!isEditing);

    const handleSave = () => {
        setIsEditing(false);
        // Mock save logic
    }

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

                    <span className="text-[#808191] text-sm mt-2">Creator</span>
                    <div className="flex gap-2 mt-4">
                        <span className="px-3 py-1 bg-[#8c6dfd] rounded-full text-xs text-white">Verified</span>
                        <span className="px-3 py-1 bg-[var(--background)] rounded-full text-xs text-[#808191]">Level 2</span>
                    </div>

                    <button onClick={isEditing ? handleSave : handleEditToggle} className="mt-6 text-[#4acd8d] flex items-center gap-2 text-sm hover:underline">
                        {isEditing ? <CheckIcon /> : <Edit size={14} />}
                        {isEditing ? 'Save Profile' : 'Edit Details'}
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
                                <span className="text-[#4acd8d] font-bold text-xs">0x12...3456</span>
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
                                {/* Mock Campaign List */}
                                <div className="bg-[var(--background)] p-4 rounded-[10px] flex justify-between items-center">
                                    <div>
                                        <h4 className="text-[var(--text-primary)] font-bold">Eco-Friendly Documentary</h4>
                                        <span className="text-xs text-[#808191]">Status: Active</span>
                                    </div>
                                    <span className="text-[#4acd8d] font-bold">₹ 12,000 Raised</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'donations' && (
                            <div className="flex flex-col gap-4">
                                <p className="text-[#808191] text-sm">Projects you have backed.</p>
                                {/* Mock Donation List */}
                                <div className="bg-[var(--background)] p-4 rounded-[10px] flex justify-between items-center">
                                    <div>
                                        <h4 className="text-[var(--text-primary)] font-bold">The Helpers</h4>
                                        <span className="text-xs text-[#808191]">Date: 2023-11-01</span>
                                    </div>
                                    <span className="text-[#8c6dfd] font-bold">₹ 5,000</span>
                                </div>
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
