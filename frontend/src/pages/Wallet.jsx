import React, { useState, useEffect } from 'react'
import CustomButton from '../components/CustomButton'
import api from '../utils/api'
import { Wallet as WalletIcon, ExternalLink, PlusCircle, ArrowDownCircle } from 'lucide-react'
import finternetService from '../services/finternetService'
import PaymentConfirmModal from '../components/PaymentConfirmModal'

const Wallet = () => {
    const [wallet, setWallet] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchWallet = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/wallet');
            setWallet(data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setWallet(null);
            } else {
                console.error("Error fetching wallet", error);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const [showTransfer, setShowTransfer] = useState(false);
    const [bookingType, setBookingType] = useState('ADD'); // 'ADD' or 'WITHDRAW'
    const [amount, setAmount] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchWallet();
    }, [])

    const handleCreateWallet = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.post('/wallet/create');
            setWallet(data);
            alert("Wallet created successfully!");
        } catch (error) {
            console.error("Failed to create wallet", error);
            alert("Failed to create wallet. Please try again. " + (error.response?.data?.message || ""));
            setIsLoading(false);
        }
    }

    const openTransfer = (type) => {
        setBookingType(type);
        setShowTransfer(true);
        setAmount('');
        setErrorMessage('');
    }

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Initial check before modal
    const handleInitiateTransaction = (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || Number(amount) <= 0) return alert("Invalid amount");

        if (bookingType === 'ADD') {
            setShowConfirmModal(true);
        } else {
            // Withdraw flow doesn't use Finternet directly in this demo (or could, but avoiding complexity)
            executeTransaction();
        }
    }

    const executeTransaction = async () => {
        try {
            setIsLoading(true);

            if (bookingType === 'ADD') {
                await finternetService.createPaymentIntent(amount, 'INR', 'Wallet Top-up');

                // 2. Update Internal Ledger
                const { data } = await api.post('/wallet/add-funds', { amount });
                setWallet(data);
                // alert(`Successfully added ₹${amount} via Finternet Gateway!`); 
            } else {
                // Withdraw Flow
                const { data } = await api.post('/wallet/withdraw', { amount });
                setWallet(data);
                alert(`Successfully withdrawn ₹${amount}`);
            }

            setShowConfirmModal(false);
            setShowTransfer(false);
            setAmount('');
        } catch (error) {
            console.error("Transaction failed:", error);
            alert(`Failed: ` + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) return <div className="text-white text-center mt-10">Loading Wallet...</div>

    if (!wallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 text-[var(--text-primary)]">
                <div className="w-[100px] h-[100px] rounded-full bg-[var(--secondary)] flex items-center justify-center">
                    <WalletIcon size={50} className="text-[#808191]" />
                </div>
                <h2 className="text-3xl font-bold font-epilogue">No Wallet Found</h2>
                <p className="text-[#808191] text-center max-w-[400px]">
                    Create a programmable wallet to start funding projects and managing your contributions securely.
                </p>
                <CustomButton
                    btnType="button"
                    title="Create Wallet Now"
                    styles="bg-[#8c6dfd]"
                    handleClick={handleCreateWallet}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 text-[var(--text-primary)]">
            <h1 className="font-epilogue font-bold text-[24px]">My Wallet</h1>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Wallet Card */}
                <div className="bg-gradient-to-r from-[#2c2f32] to-[var(--secondary)] p-8 rounded-[20px] flex flex-col gap-6 border border-[#3a3a43] max-w-[500px] w-full relative overflow-hidden shadow-xl">
                    {/* Decorative Circle */}
                    <div className="absolute -right-10 -top-10 w-[150px] h-[150px] bg-[#8c6dfd] rounded-full blur-[80px] opacity-20"></div>

                    <div>
                        <span className="text-[#808191] text-sm uppercase tracking-wider font-semibold">Total Balance</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-5xl font-bold font-epilogue text-white">
                                ₹ {wallet.balance?.toLocaleString()}
                            </span>
                            <span className="text-lg text-[#4acd8d] font-semibold">INR</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-[#808191] text-xs uppercase tracking-wide">Wallet ID</span>
                        <div className="bg-[#1c1c24] p-4 rounded-xl flex justify-between items-center border border-[#3a3a43]">
                            <span className="text-sm font-mono text-[#4acd8d] break-all">{wallet._id}</span>
                            <ExternalLink size={16} className="text-[#808191] cursor-pointer hover:text-white" />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => openTransfer('ADD')}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#1dc071] hover:bg-[#169457] text-white py-3 rounded-[10px] font-bold transition-all"
                        >
                            <PlusCircle size={18} /> Add Funds
                        </button>
                        <button
                            onClick={() => openTransfer('WITHDRAW')}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#2c2f32] border border-[#3a3a43] hover:bg-[#3a3a43] text-white py-3 rounded-[10px] font-bold transition-all"
                        >
                            <ArrowDownCircle size={18} /> Withdraw
                        </button>
                    </div>
                </div>

                {/* Inline Transfer Section */}
                {showTransfer && (
                    <div className="bg-[var(--secondary)] p-8 rounded-[20px] border border-[#3a3a43] w-full max-w-[400px] animate-in fade-in slide-in-from-left-4 duration-300">
                        <h3 className="text-xl font-bold font-epilogue text-white mb-2">
                            {bookingType === 'ADD' ? 'Top-up Wallet' : 'Withdraw Funds'}
                        </h3>
                        <p className="text-[#808191] text-sm mb-6">
                            {bookingType === 'ADD'
                                ? 'Add money to your wallet to invest in projects.'
                                : 'Transfer funds back to your bank account via standard simulation.'}
                        </p>

                        <form onSubmit={handleInitiateTransaction} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[#808191] text-sm font-medium">Amount (INR)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-[var(--background)] border border-[#3a3a43] text-white text-lg p-4 rounded-[10px] outline-none focus:border-[#8c6dfd] transition-colors"
                                    autoFocus
                                />
                                {errorMessage && (
                                    <span className="text-[#ef4444] text-sm">{errorMessage}</span>
                                )}
                            </div>

                            <div className="flex gap-3 mt-4">
                                <CustomButton
                                    btnType="button"
                                    title="Cancel"
                                    styles="bg-transparent border border-[#3a3a43] text-[#808191] flex-1"
                                    handleClick={() => setShowTransfer(false)}
                                />
                                <CustomButton
                                    btnType="submit"
                                    title={bookingType === 'ADD' ? 'Confirm Deposit' : 'Confirm Withdraw'}
                                    styles={`flex-1 ${bookingType === 'ADD' ? 'bg-[#8c6dfd]' : 'bg-[#e3a008]'}`}
                                />
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <PaymentConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={executeTransaction}
                amount={amount}
                title="Wallet Deposit"
                isLoading={isLoading}
            />
        </div>
    )
}

export default Wallet
