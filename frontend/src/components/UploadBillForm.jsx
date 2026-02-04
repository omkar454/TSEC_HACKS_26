import React, { useState, useEffect } from 'react';
import { Upload, AlertTriangle, CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import CustomButton from './CustomButton';
import FormField from './FormField';
import api from '../utils/api';

const UploadBillForm = ({ projectId, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [projectRules, setProjectRules] = useState([]);

    // Form State
    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: '',
        receiptUrl: '',
    });

    // File State
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);

    // 1. Fetch Project Rules (Categories)
    useEffect(() => {
        const fetchRules = async () => {
            try {
                const { data } = await api.get(`/projects/${projectId}`);
                setProjectRules(data.fundUsageRules || []);
                if (data.fundUsageRules?.length > 0) {
                    setForm(prev => ({ ...prev, category: data.fundUsageRules[0].category }));
                }
            } catch (err) {
                console.error("Failed to fetch project rules:", err);
            }
        };
        if (projectId) fetchRules();
    }, [projectId]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setAnalysisResult(null);
            setAnalysisError(null);
            setForm(prev => ({ ...prev, receiptUrl: URL.createObjectURL(selectedFile) }));
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setAnalysisError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('currency', 'INR');

        try {
            const { data } = await api.post('/receipts/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAnalysisResult(data);

            // Auto-fill form based on analysis
            setForm(prev => ({
                ...prev,
                amount: data.amountINR || prev.amount,
                description: data.vendor ? `Expense at ${data.vendor}` : prev.description,
                category: projectRules.find(r => r.category === data.category)?.category || prev.category
            }));

        } catch (err) {
            console.error(err);
            setAnalysisError("Failed to analyze receipt. Please fill details manually.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedRule = projectRules.find(r => r.category === form.category);
        if (selectedRule && parseFloat(form.amount) > selectedRule.maxAmount) {
            return alert(`Error: Amount for ${form.category} cannot exceed ₹${selectedRule.maxAmount}`);
        }

        setIsLoading(true);
        try {
            await api.post('/expenses', {
                projectId,
                title: form.description,
                amount: parseFloat(form.amount),
                category: form.category,
                description: form.description,
                receiptUrl: form.receiptUrl
            });
            alert("Expense Submitted! Waiting for Admin verification.");
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Submission Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#1c1c24] p-6 rounded-[20px] border border-[#3a3a43] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">New Expense Request</h3>
                <button onClick={onClose} className="text-[#808191] hover:text-white">Cancel</button>
            </div>

            <div className="flex flex-col gap-6 w-full">

                {/* File Upload Section */}
                <div className="flex flex-col gap-2">
                    <span className="font-epilogue font-medium text-[14px] text-[#808191]">Scan Bill / Receipt *</span>
                    <div className="relative border-2 border-dashed border-[#3a3a43] rounded-[10px] min-h-[150px] flex flex-col items-center justify-center bg-[#13131a] overflow-hidden group hover:border-[#8c6dfd] transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />

                        {preview ? (
                            <div className="relative w-full h-full p-2 flex flex-col items-center">
                                <img src={preview} alt="Receipt" className="max-h-[200px] object-contain rounded-md" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <p className="text-white font-medium">Click to Change</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Upload className="text-[#808191] mb-2 group-hover:text-[#8c6dfd]" />
                                <span className="text-[#808191] text-sm group-hover:text-white">Drag or click to upload receipt</span>
                                <p className="text-[#4b5264] text-[10px] mt-2">Supports JPG, PNG</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Analysis Button */}
                {file && !analysisResult && (
                    <CustomButton
                        btnType="button"
                        title={isAnalyzing ? "Analyzing with AI..." : "Analyze Receipt"}
                        styles={`w-full ${isAnalyzing ? 'bg-[#3a3a43]' : 'bg-[#8c6dfd]'}`}
                        handleClick={handleAnalyze}
                        disabled={isAnalyzing}
                    />
                )}
                {analysisError && <p className="text-red-500 text-sm">{analysisError}</p>}

                {/* Analysis Result Display */}
                {analysisResult && (
                    <div className="bg-[#13131a] p-4 rounded-[10px] border border-[#3a3a43]">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-[#4acd8d]" />
                            Analysis Result
                        </h4>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="text-[#808191] block">Vendor</span>
                                <span className="text-white font-medium">{analysisResult.vendor}</span>
                            </div>
                            <div>
                                <span className="text-[#808191] block">Detected Amount</span>
                                <span className="text-white font-medium">₹ {analysisResult.amountINR}</span>
                            </div>
                            <div>
                                <span className="text-[#808191] block">Category</span>
                                <span className="text-white font-medium">{analysisResult.category}</span>
                            </div>
                            <div>
                                <span className="text-[#808191] block">Confidence</span>
                                <span className="text-white font-medium">{(analysisResult.confidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        {/* Risk / Approval Score */}
                        <div className="flex items-center justify-between bg-[#1c1c24] p-3 rounded border border-[#3a3a43]">
                            <span className="text-[#808191]">Approval Score</span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`font-bold text-lg ${analysisResult.approval_score >= 70 ? 'text-[#4acd8d]' :
                                            analysisResult.approval_score >= 30 ? 'text-yellow-500' : 'text-red-500'
                                        }`}
                                >
                                    {analysisResult.approval_score}%
                                </span>
                                {analysisResult.approval_score >= 70 ? <CheckCircle size={18} className="text-[#4acd8d]" /> : <AlertTriangle size={18} className="text-yellow-500" />}
                            </div>
                        </div>

                        {/* Risk Reasons */}
                        {analysisResult.risk_reasons?.length > 0 && (
                            <div className="mt-3">
                                <p className="text-red-400 text-xs font-bold mb-1">Risk Factors:</p>
                                <ul className="list-disc list-inside text-xs text-[#808191]">
                                    {analysisResult.risk_reasons.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                    <FormField
                        labelName="Expense Description"
                        placeholder="e.g. Venue Booking for Shoot"
                        inputType="text"
                        value={form.description}
                        handleChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <FormField
                        labelName="Amount (₹)"
                        placeholder="5000"
                        inputType="number"
                        value={form.amount}
                        handleChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />

                    <div className="flex flex-col gap-2">
                        <span className="font-epilogue font-medium text-[14px] text-[#808191]">Category</span>
                        <select
                            className="py-[15px] px-[25px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] rounded-[10px]"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                            {projectRules.length === 0 ? (
                                <option value="">No categories defined</option>
                            ) : (
                                projectRules.map((rule) => (
                                    <option key={rule._id} value={rule.category} className="bg-[#1c1c24]">
                                        {rule.category} (Max: ₹{rule.maxAmount.toLocaleString()})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <CustomButton
                        btnType="submit"
                        title={isLoading ? "Submitting..." : "Submit for Verification"}
                        styles="bg-[#4acd8d] w-full"
                    />
                </form>
            </div>
        </div>
    )
}

export default UploadBillForm;
