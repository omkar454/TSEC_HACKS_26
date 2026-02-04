import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Rocket, DollarSign, Image as ImageIcon, Type } from 'lucide-react';

import CustomButton from '../components/CustomButton';
import FormField from '../components/FormField';

const CreateCampaign = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        title: '',
        description: '',
        target: '',
        deadline: '',
        image: '',
        category: 'Education'
    });

    const handleFormFieldChange = (fieldName, e) => {
        setForm({ ...form, [fieldName]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Form Data Submitted:", form);
        setTimeout(() => {
            setIsLoading(false);
            navigate('/');
        }, 2000);
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

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[30px] relative z-10 max-w-[800px]">

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
                            <FormField
                                labelName="Campaign Title"
                                placeholder="e.g. The Future of AI"
                                inputType="text"
                                value={form.title}
                                handleChange={(e) => handleFormFieldChange('title', e)}
                            />
                        </div>
                        <FormField
                            labelName="Story"
                            placeholder="Tell your story..."
                            isTextArea
                            value={form.description}
                            handleChange={(e) => handleFormFieldChange('description', e)}
                        />
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
                        <h3 className="text-white font-bold text-xl uppercase tracking-wider">Target & Governance</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <FormField
                            labelName="Funding Goal (₹)"
                            placeholder="500000"
                            inputType="text"
                            value={form.target}
                            handleChange={(e) => handleFormFieldChange('target', e)}
                        />
                        <FormField
                            labelName="Deadline"
                            placeholder="End Date"
                            inputType="date"
                            value={form.deadline}
                            handleChange={(e) => handleFormFieldChange('deadline', e)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col gap-[10px]">
                            <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191]">Min Quorum (%)</span>
                            <div className="p-[15px] bg-[#13131a] rounded-[10px] border border-[#3a3a43] text-[#808191]">
                                30% (Default)
                            </div>
                        </div>
                        <div className="flex flex-col gap-[10px]">
                            <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191]">Allowed Expenses</span>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {['Equipment', 'Logistics', 'Talent', 'Marketing'].map(cat => (
                                    <span key={cat} className="px-3 py-1 bg-[#2c2f32] rounded-full text-xs text-white border border-[#3a3a43] hover:bg-[#3a3a43] transition-colors cursor-default">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
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
                                {form.image ? (
                                    <>
                                        <img src={form.image} alt="preview" className="w-full h-full object-cover opacity-90 group-hover/image:opacity-100 transition-opacity" onError={(e) => { e.target.style.display = 'none' }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-transparent opacity-50" />
                                        <div className="absolute bottom-4 left-4">
                                            <p className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Live Preview</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-[#4b5264]">
                                        <ImageIcon size={40} />
                                        <span>Enter a URL to preview</span>
                                    </div>
                                )}
                            </div>

                            <input
                                type="url"
                                placeholder="https://..."
                                value={form.image}
                                onChange={(e) => handleFormFieldChange('image', e)}
                                className="mt-4 py-[15px] px-[25px] outline-none border-[1px] border-[#3a3a43] bg-[#13131a] font-epilogue text-white text-[14px] placeholder:text-[#4b5264] rounded-[10px] focus:border-[#8c6dfd] transition-colors"
                            />
                        </div>

                        <FormField
                            labelName="Category"
                            placeholder="e.g. Governance, Tech, Art"
                            inputType="text"
                            value={form.category}
                            handleChange={(e) => handleFormFieldChange('category', e)}
                        />
                    </div>
                </div>

                <div className="flex justify-center items-center mt-[40px] mb-10">
                    <CustomButton
                        btnType="submit"
                        title="Launch Campaign"
                        styles="bg-[#1dc071] w-full max-w-[300px] py-4 text-lg shadow-lg hover:shadow-[#1dc071]/40 hover:-translate-y-1 transition-all font-bold tracking-wide rounded-[12px]"
                    />
                </div>
            </form>
        </div>
    )
}

export default CreateCampaign
