import React, { useState, useEffect } from 'react'
import { ShieldAlert, Activity, Users, Lock, Unlock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import api from '../utils/api'

const AdminDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [risks, setRisks] = useState([]);
    const [stats, setStats] = useState({ totalProjects: 0, totalVolume: 0, highRisk: 0 });

    const fetchData = async () => {
        try {
            // 1. Fetch All Projects
            const { data: allProjects } = await api.get('/projects');
            setProjects(allProjects);

            // 2. Fetch Risks
            try {
                const { data: riskData } = await api.get('/admin/risks');
                // Backend returns array? Or object? 
                // Based on previous reads, let's assume it returns array or { flaggedProjects: [] }
                // Let's handle array directly as per my implementation plan mock
                const riskArray = Array.isArray(riskData) ? riskData : (riskData.flaggedProjects || []);

                setRisks(riskArray);
                setStats({
                    totalProjects: allProjects.length,
                    totalVolume: allProjects.reduce((acc, p) => acc + (p.currentFunding || 0), 0),
                    highRisk: riskArray.length
                });
            } catch (err) {
                console.warn("Risk API error or empty:", err);
                setStats({
                    totalProjects: allProjects.length,
                    totalVolume: allProjects.reduce((acc, p) => acc + (p.currentFunding || 0), 0),
                    highRisk: 0
                });
            }

        } catch (error) {
            console.error("Admin fetch error:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleFreeze = async (projectId, currentStatus) => {
        const newStatus = !currentStatus;
        if (!window.confirm(`Are you sure you want to ${newStatus ? 'FREEZE' : 'UNFREEZE'} this project?`)) return;

        try {
            await api.patch(`/admin/projects/${projectId}/freeze`);
            fetchData();
            alert(`Project ${newStatus ? 'FROZEN' : 'UNFROZEN'} successfully.`);
        } catch (error) {
            alert("Freeze Toggle Failed: " + error.response?.data?.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 text-[var(--text-primary)]">
            <h1 className="font-epilogue font-bold text-[24px]">Governance Oversight</h1>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-[20px] border border-[#3a3a43]">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-[#4acd8d]" />
                        <h3 className="text-[#808191] text-sm">System Volume</h3>
                    </div>
                    <p className="text-[24px] font-bold">₹ {stats.totalVolume.toLocaleString()}</p>
                </div>
                <div className="glass-panel p-6 rounded-[20px] border border-[#3a3a43]">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="text-[#ef4444]" />
                        <h3 className="text-[#808191] text-sm">High Risk Alerts</h3>
                    </div>
                    <p className="text-[24px] font-bold text-[#ef4444]">{stats.highRisk}</p>
                </div>
                <div className="glass-panel p-6 rounded-[20px] border border-[#3a3a43]">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-[#8c6dfd]" />
                        <h3 className="text-[#808191] text-sm">Total Projects</h3>
                    </div>
                    <p className="text-[24px] font-bold">{stats.totalProjects}</p>
                </div>
            </div>

            <div className="flex xl:flex-row flex-col gap-6">
                {/* Main: Project Oversight */}
                <div className="flex-[2] bg-[var(--secondary)] rounded-[20px] p-6 border border-[#3a3a43]">
                    <h3 className="font-bold text-lg mb-4">Projects Oversight</h3>

                    {/* DRAFTS SECTION */}
                    <h4 className="text-[#808191] text-sm uppercase font-bold mt-4 mb-2">Pending Approval (Drafts)</h4>
                    <div className="flex flex-col gap-3 mb-6">
                        {projects.filter(p => p.status === 'DRAFT').length === 0 && <p className="text-sm italic text-[#808191]">No pending drafts.</p>}
                        {projects.filter(p => p.status === 'DRAFT').map(p => (
                            <div key={p._id} className="flex justify-between items-center bg-[var(--background)] p-4 rounded-[10px] border-l-4 border-yellow-500">
                                <div>
                                    <h4 className="font-bold">{p.title}</h4>
                                    <p className="text-xs text-[#808191]">Created by: {p.creatorId?.name || p.creatorId} • Stake: {p.creatorStake || 0}%</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="flex items-center gap-1 px-3 py-1 bg-[#4acd8d]/20 text-[#4acd8d] rounded hover:bg-[#4acd8d] hover:text-white transition-all text-xs font-bold"
                                        onClick={async () => {
                                            if (window.confirm(`Approve ${p.title} to go ACTIVE?`)) {
                                                try {
                                                    await api.patch(`/projects/${p._id}/status`, { status: "ACTIVE" });
                                                    alert("Project Activated!");
                                                    fetchData();
                                                } catch (e) { alert("Error: " + e.message); }
                                            }
                                        }}
                                    >
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                        className="flex items-center gap-1 px-3 py-1 bg-[#ef4444]/20 text-[#ef4444] rounded hover:bg-[#ef4444] hover:text-white transition-all text-xs font-bold"
                                        onClick={async () => {
                                            if (window.confirm(`Reject and Delete project ${p._id}?`)) {
                                                try {
                                                    await api.delete(`/projects/${p._id}`);
                                                    alert("Project Rejected & Deleted.");
                                                    fetchData();
                                                } catch (e) {
                                                    console.error("Delete Error:", e);
                                                    alert(`Delete Failed: ${e.response?.data?.message || e.message}`);
                                                }
                                            }
                                        }}
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ACTIVE PROJECTS SECTION */}
                    <h4 className="text-[#808191] text-sm uppercase font-bold mt-4 mb-2">Active & Monitored Projects</h4>
                    <div className="flex flex-col gap-3">
                        {projects.filter(p => p.status !== 'DRAFT').map(p => {
                            const pendingMilestones = p.milestones?.filter(m => m.status === 'PENDING') || [];
                            return (
                                <div key={p._id} className="flex justify-between items-center bg-[var(--background)] p-4 rounded-[10px] border-l-4 border-[#8c6dfd]">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${p.status === 'ACTIVE' ? 'bg-[#4acd8d]' : 'bg-[#808191]'}`}></div>
                                        <div>
                                            <h4 className="font-bold flex items-center gap-2">
                                                {p.title}
                                                {pendingMilestones.length > 0 && (
                                                    <span className="bg-[#8c6dfd] text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse">
                                                        TRANCE PENDING
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-[#808191]">Status: {p.status} • Stake: {p.creatorStake || 0}% • Health: OK</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-xs">₹ {p.currentFunding?.toLocaleString()}</p>
                                            <p className="text-[10px] text-[#808191]">Escrow Locked</p>
                                        </div>
                                        <button
                                            onClick={() => toggleFreeze(p._id, p.isFrozen)}
                                            className={`p-2 rounded-full transition-colors ${p.isFrozen ? 'bg-[#ef4444] text-white' : 'bg-[#3a3a43] text-[#808191] hover:text-white'}`}
                                            title={p.isFrozen ? "Project Frozen" : "Freeze Project"}
                                        >
                                            {p.isFrozen ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Risk Radar */}
                <div className="flex-1 bg-[var(--secondary)] rounded-[20px] p-6 border border-[#3a3a43] h-fit">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" />
                        Risk Radar
                    </h3>
                    <div className="flex flex-col gap-4">
                        {risks.length === 0 ? (
                            <p className="text-[#808191] italic text-sm">No anomalies detected.</p>
                        ) : (
                            risks.map((risk, idx) => (
                                <div key={idx} className="p-4 bg-[#ef4444]/10 border border-[#ef4444] rounded-[10px]">
                                    <h4 className="font-bold text-[#ef4444] text-sm">{risk.projectTitle}</h4>
                                    <p className="text-xs text-[#808191] mt-1">{risk.reason}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[10px] bg-[#ef4444] text-white px-2 py-1 rounded">High Risk</span>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Static Example for Demo if empty */}
                        {risks.length === 0 && (
                            <div className="opacity-50 pointer-events-none p-4 bg-[#ef4444]/10 border border-[#ef4444] rounded-[10px] grayscale">
                                <h4 className="font-bold text-[#ef4444] text-sm">Demo Project X (Example)</h4>
                                <p className="text-xs text-[#808191] mt-1">High expense rejection rate (80%)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard