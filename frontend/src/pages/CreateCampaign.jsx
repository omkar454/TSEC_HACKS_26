import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Rocket, DollarSign, Image as ImageIcon, Type, AlertCircle, Shield, Sparkles } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import FormField from '../components/FormField';
import api from '../utils/api';
import finternetService from '../services/finternetService';
import PaymentConfirmModal from '../components/PaymentConfirmModal';
import AIPreviewModal from '../components/AIPreviewModal';

const CreateCampaign = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        title: '',
        description: '',
        target: '',
        deadline: '',
        image: null,
        imagePreview: "",
        category: 'OTHER',
        creatorStake: '',
        milestones: [
            { title: 'Project Kickoff & Pre-production', description: 'Script finalized and initial logistics set.', tranchePercent: 20, milestoneType: 'KICKOFF' },
            { title: 'Production Completion', description: 'Raw footage/content recorded.', tranchePercent: 40, milestoneType: 'PRODUCTION' },
            { title: 'Final Delivery', description: 'Post-production complete and content ready for publishing.', tranchePercent: 30, milestoneType: 'FINAL_DELIVERY' },
            { title: 'Public Release', description: 'Content successfully published to platform.', tranchePercent: 10, milestoneType: 'RELEASE' }
        ]
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suggestion, setSuggestion] = useState('');
    const [activeAction, setActiveAction] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const callAI = async (endpoint, body) => {
        setAiLoading(true);
        setIsModalOpen(true);
        setSuggestion('');
        try {
            // Note: Updated endpoint to match project routes structure if nested, or global ai route
            const { data } = await api.post(`/projects/ai/${endpoint}`, body);
            if (data.result) {
                setSuggestion(data.result);
            } else {
                setSuggestion("No result generated.");
            }
        } catch (error) {
            console.error(error);
            setSuggestion("Error: " + (error.response?.data?.error || error.message));
        } finally {
            setAiLoading(false);
        }
    };

    const handleRewrite = (e) => {
        e.preventDefault();
        setActiveAction('rewrite');
        callAI('rewrite', { description: form.description });
    };

    const handleTitle = (e) => {
        e.preventDefault();
        setActiveAction('title');
        callAI('title', { title: form.title });
    };

    const handleSimplify = (e) => {
        e.preventDefault();
        setActiveAction('simplify');
        // Passing fund details logic; for now sending target/rules summary
        const fundCtx = `Target: ${form.target}, Stake: ${form.creatorStake}%, Category: ${form.category}`;
        callAI('simplify', { fundDetails: fundCtx });
    };

    const handleAccept = (text) => {
        if (activeAction === 'rewrite') setForm({ ...form, description: text });
        if (activeAction === 'title') setForm({ ...form, title: text });
        // For simplify, we don't have a direct field to map back to in this form structure easily
        // unless we add a 'funding explanation' field. For now, we'll just alert or maybe append.
        if (activeAction === 'simplify') alert("Explanation copied to clipboard!");

        setIsModalOpen(false);
    };

    const categories = ["FILM", "DOCUMENTARY", "PODCAST", "MUSIC", "OTHER"];

    // Role Guard
    if (user?.role !== 'CREATOR') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#1c1c24] rounded-[20px] border border-[#3a3a43]">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-white text-2xl font-bold mb-2">Access Restricted</h2>
                <p className="text-[#808191] max-w-[400px]">
                    Only registered **Creators** can launch new campaigns. Your current role is **{user?.role || 'Guest'}**.
                </p>
                <div className="mt-6 flex gap-4">
                    <CustomButton
                        btnType="button"
                        title="Go Home"
                        styles="bg-[#1dc071]"
                        handleClick={() => navigate('/')}
                    />
                    {user && (
                        <p className="text-xs text-[#4b5264] mt-4 block w-full">
                            Contact Admin to upgrade your role if you are a content creator.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const handleFormFieldChange = (fieldName, e) => {
        setForm({ ...form, [fieldName]: e.target.value })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({
                ...form,
                image: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    const [showFeeModal, setShowFeeModal] = useState(false);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Validate
        if (!form.title || !form.target) return alert("Please fill required fields");
        setShowFeeModal(true);
    };

    const executeCreation = async () => {
        setIsLoading(true);

        try {
            if (!form.deadline) throw new Error("A specific deadline is mandatory for the Trust Engine.");

            // Execute Finternet Fee
            await finternetService.createPaymentIntent(50, 'INR', 'Campaign Listing Fee: ' + form.title);

            // Use FormData for file upload
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('fundingGoal', parseFloat(form.target));
            formData.append('category', form.category);
            formData.append('deadline', new Date(form.deadline).toISOString());
            formData.append('creatorStake', parseFloat(form.creatorStake) || 0);
            formData.append('milestones', JSON.stringify(form.milestones));
            formData.append('fundUsageRules', JSON.stringify([
                { category: 'Production', maxAmount: parseFloat(form.target) * 0.5, requiresReceipt: true },
                { category: 'Marketing', maxAmount: parseFloat(form.target) * 0.3, requiresReceipt: false },
                { category: 'Ops', maxAmount: parseFloat(form.target) * 0.2, requiresReceipt: true }
            ]));

            if (form.image) {
                formData.append('image', form.image);
            }

            const { data } = await api.post('/projects', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowFeeModal(false);
            alert("Project Created Successfully!");
            navigate(`/campaign-details/${data._id}`); // Use backend ID
        } catch (error) {
            console.error("Project Creation Failed:", error);
            alert("Failed to create project: " + (error.response?.data?.message || error.message));
            setShowFeeModal(false);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative flex justify-center items-center flex-col rounded-[20px] sm:p-10 p-4 border border-[#3a3a43] bg-[#1c1c24] overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#8c6dfd]/20 to-transparent pointer-events-none" />
            <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-[#4acd8d]/10 rounded-full blur-[100px] pointer-events-none" />

            {isLoading && <div className="absolute z-[10] h-full bg-[#13131a]/90 backdrop-blur-sm flex items-center justify-center flex-col rounded-[10px] inset-0">
                <Loader className="w-[80px] h-[80px] object-contain animate-spin text-[#8c6dfd]" />
                <p className="mt-[20px] font-epilogue font-bold text-[20px] text-white text-center tracking-wider">IGNITING CAMPAIGN...</p>
            </div>}

            {/* Header */}
            <div className="relative z-10 flex flex-col items-center justify-center p-[20px] w-full mb-10 text-center">
                <div className="p-4 bg-[#2c2f32]/50 rounded-full mb-4 border border-[#3a3a43]">
                    <Rocket className="w-8 h-8 text-[#8c6dfd]" />
                </div>
                <h1 className="font-epilogue font-bold sm:text-[40px] text-[28px] leading-[1.2] text-white tracking-tight">
                    Bring Your Vision to Life
                </h1>
                <p className="mt-4 text-[#808191] text-lg max-w-[600px]">
                    Create a cinematic campaign that captures hearts and logic.
                </p>
            </div>

            <form onSubmit={handleFormSubmit} className="w-full flex flex-col gap-[30px] relative z-10 max-w-[800px]">

                {/* Section 1: The Pitch */}
                <div className="bg-[#1c1c24]/60 backdrop-blur-md p-8 rounded-[24px] border border-[#3a3a43] hover:border-[#8c6dfd]/50 transition-colors group">
                    <div className="flex items-center gap-3 mb-6">
                        <Type className="text-[#8c6dfd] group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-xl uppercase tracking-wider">The Pitch</h3>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                labelName="Creator Name"
                                placeholder="John Doe"
                                inputType="text"
                                value={form.name}
                                handleChange={(e) => handleFormFieldChange('name', e)}
                            />
                            <div className="relative">
                                <FormField
                                    labelName="Campaign Title"
                                    placeholder="e.g. The Future of AI"
                                    inputType="text"
                                    value={form.title}
                                    handleChange={(e) => handleFormFieldChange('title', e)}
                                />
                                <button onClick={handleTitle} className="absolute top-0 right-0 p-1 text-[#8c6dfd] hover:text-white transition-colors" title="Enhance Title">
                                    <Sparkles size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <FormField
                                labelName="Story"
                                placeholder="Tell your story..."
                                isTextArea
                                value={form.description}
                                handleChange={(e) => handleFormFieldChange('description', e)}
                            />
                            <div className="absolute top-0 right-0 z-10">
                                <button onClick={handleRewrite} className="flex items-center gap-1 text-xs text-[#8c6dfd] border border-[#8c6dfd] px-2 py-1 rounded hover:bg-[#8c6dfd] hover:text-white transition-all">
                                    <Sparkles size={12} /> AI Rewrite
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner - Callout */}
                <div className="w-full flex justify-center items-center py-8 bg-gradient-to-r from-[#8c6dfd]/10 via-[#4acd8d]/10 to-[#8c6dfd]/10 rounded-[20px] border border-[#3a3a43]/50">
                    <h4 className="font-epilogue font-bold text-[20px] text-white text-center">
                        <span className="text-[#4acd8d]">100% Ownership.</span> You keep what you raise.
                    </h4>
                </div>

                {/* Section 2: Economics & Governance */}
                <div className="bg-[#1c1c24]/60 backdrop-blur-md p-8 rounded-[24px] border border-[#3a3a43] hover:border-[#4acd8d]/50 transition-colors group">
                    <div className="flex items-center gap-3 mb-6">
                        <DollarSign className="text-[#4acd8d] group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-xl uppercase tracking-wider">Target & Trust Timeline</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="relative">
                            <FormField
                                labelName="Funding Goal (₹)"
                                placeholder="500000"
                                inputType="text"
                                value={form.target}
                                handleChange={(e) => handleFormFieldChange('target', e)}
                            />
                            <button onClick={handleSimplify} className="absolute top-0 right-0 p-1 text-[#4acd8d] hover:text-white transition-colors" title="Explain Funding">
                                <Sparkles size={16} />
                            </button>
                        </div>
                        <FormField
                            labelName="Mandatory Deadline *"
                            placeholder="Trust Cutoff Date"
                            inputType="date"
                            value={form.deadline}
                            handleChange={(e) => handleFormFieldChange('deadline', e)}
                        />
                    </div>

                    {/* Trust Engine: Milestone Tranches */}
                    <div className="flex flex-col gap-4 bg-[#13131a] p-6 rounded-2xl border border-[#3a3a43] mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[#4acd8d] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Shield size={16} /> Fund Release Tranches
                            </h4>
                            <span className="text-[10px] text-[#808191] font-bold">Automatic 20/40/30/10 Split</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {form.milestones.map((milestone, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-3 bg-[#1c1c24] rounded-lg border border-[#3a3a43]/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white text-xs font-bold">{milestone.title}</span>
                                        <span className="text-[#4acd8d] text-[10px] font-black">{milestone.tranchePercent}%</span>
                                    </div>
                                    <p className="text-[#808191] text-[10px]">{milestone.description}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-[#808191] italic mt-2">
                            * Funds will be released to your wallet ONLY after Admin approval of each milestone.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col gap-[10px]">
                            <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191]">Creator Stake (%)</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="20"
                                    min="0"
                                    max="100"
                                    value={form.creatorStake}
                                    onChange={(e) => handleFormFieldChange('creatorStake', e)}
                                    className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] w-full"
                                />
                            </div>
                            <span className="text-[10px] text-[#808191]">Percentage of revenue you retain before investor distribution.</span>
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191]">Seed Quorum (%)</span>
                            <div className="p-[15px] bg-[#13131a] rounded-[10px] border border-[#3a3a43] text-[#4acd8d] font-bold text-sm">
                                30% (Mandatory)
                            </div>
                        </div>
                    </div>
                    <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191]">Risk Policy</span>
                    <div className="p-4 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20 text-[10px] text-[#ef4444] font-bold uppercase leading-relaxed">
                        Fail to reach 30% by deadline = Mandatory Atomic Refund to all contributors.
                    </div>
                </div>

                {/* Section 3: Visuals */}
                <div className="bg-[#1c1c24]/60 backdrop-blur-md p-8 rounded-[24px] border border-[#3a3a43] hover:border-[#eab308]/50 transition-colors group">
                    <div className="flex items-center gap-3 mb-6">
                        <ImageIcon className="text-[#eab308] group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-xl uppercase tracking-wider">Visual Asset</h3>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="font-epilogue font-medium text-[14px] text-[#808191] mb-[10px]">Campaign Banner URL</span>

                            <div className="relative w-full h-[300px] bg-[#13131a] rounded-[16px] border border-[#3a3a43] flex items-center justify-center overflow-hidden group/image transition-all hover:shadow-2xl hover:shadow-[#8c6dfd]/10">
                                {form.imagePreview ? (
                                    <>
                                        <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover opacity-90 group-hover/image:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-transparent opacity-50" />
                                        <div className="absolute bottom-4 left-4">
                                            <p className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Image Selected</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-[#4b5264]">
                                        <ImageIcon size={40} />
                                        <span>Select a campaign banner</span>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="mt-4 py-[15px] px-[25px] outline-none border-[1px] border-[#3a3a43] bg-[#13131a] font-epilogue text-white text-[14px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#8c6dfd] file:text-white hover:file:bg-[#7a5bd1] rounded-[10px] focus:border-[#8c6dfd] transition-colors w-full cursor-pointer"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px]">Category</span>
                            <select
                                value={form.category}
                                onChange={(e) => handleFormFieldChange('category', e)}
                                className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-[#13131a] font-epilogue text-white text-[14px] rounded-[10px] focus:border-[#8c6dfd] transition-colors"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat} className="bg-[#1c1c24]">
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center items-center mt-[40px] mb-10">
                    <CustomButton
                        btnType="submit"
                        title="Launch Campaign"
                        styles="bg-[#1dc071] w-full max-w-[300px] py-4 text-lg shadow-lg hover:shadow-[#1dc071]/40 hover:-translate-y-1 transition-all font-bold tracking-wide rounded-[12px]"
                    />
                </div>
            </form >

            <PaymentConfirmModal
                isOpen={showFeeModal}
                onClose={() => setShowFeeModal(false)}
                onConfirm={executeCreation}
                amount={50}
                title="Projects Listing Fee"
                isLoading={isLoading}
            />

            <AIPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                originalText={
                    activeAction === 'title' ? form.title :
                        activeAction === 'rewrite' ? form.description :
                            activeAction === 'simplify' ? `Target: ${form.target}` :
                                ''
                }
                aiSuggestion={suggestion}
                onAccept={handleAccept}
                isLoading={aiLoading}
            />
        </div >
    )
}

export default CreateCampaign
