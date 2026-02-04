import React from 'react';
import { ShieldCheck, X, AlertTriangle, CreditCard } from 'lucide-react';

const PaymentConfirmModal = ({ isOpen, onClose, onConfirm, amount, title, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#1c1c24] border border-[#3a3a43] rounded-[20px] shadow-2xl overflow-hidden scale-in-95 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-[#2c2f32] p-6 border-b border-[#3a3a43]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#8c6dfd]/20 rounded-lg text-[#8c6dfd]">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-white font-bold text-lg">Secure Payment</h3>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-[#808191] hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6">
                    <div className="text-center">
                        <p className="text-[#808191] mb-1 uppercase text-xs font-bold tracking-wider">Amount to Pay</p>
                        <h2 className="text-4xl text-white font-bold font-epilogue">
                            ₹ {Number(amount).toLocaleString()}
                        </h2>
                    </div>

                    <div className="bg-[#13131a] p-4 rounded-xl border border-[#3a3a43]">
                        <div className="flex justify-between mb-2">
                            <span className="text-[#808191] text-sm">Purpose</span>
                            <span className="text-white font-medium text-sm text-right">{title}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[#808191] text-sm">Gateway</span>
                            <span className="text-[#8c6dfd] font-medium text-sm flex items-center gap-1">
                                Finternet <CreditCard size={12} />
                            </span>
                        </div>
                        <div className="w-full h-[1px] bg-[#3a3a43] my-2"></div>
                        <div className="flex items-start gap-2 text-xs text-yellow-500/80">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <p>This action creates an irreversible payment intent on the distributed ledger.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-[#3a3a43] hover:bg-[#2c2f32] text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-[#8c6dfd] hover:bg-[#7b5ce8] text-white font-bold rounded-xl shadow-lg shadow-[#8c6dfd]/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>Pay via Finternet</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmModal;
