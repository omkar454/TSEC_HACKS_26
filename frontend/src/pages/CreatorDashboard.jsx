import React, { useState } from 'react'
import { Plus, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import CustomButton from '../components/CustomButton'
import FormField from '../components/FormField'

const CreatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('expenses');
    const [expenses, setExpenses] = useState([
        { id: 1, title: 'Camera Rental', amount: '₹ 20,000', status: 'Approved', date: '2023-10-12' },
        { id: 2, title: 'Travel Tickets', amount: '₹ 8,000', status: 'Pending', date: '2023-10-15' },
    ]);
    const [showUpload, setShowUpload] = useState(false);

    return (
        <div className="flex flex-col gap-6 text-[var(--text-primary)]">
            <h1 className="font-epilogue font-bold text-[24px]">Creator Studio</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-[#808191] text-sm mb-2">Total Raised</h3>
                    <p className="text-[24px] font-bold text-[var(--text-primary)]">₹ 50,000</p>
                </div>
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-[#808191] text-sm mb-2">Available to Spend</h3>
                    <p className="text-[24px] font-bold text-[#4acd8d]">₹ 35,000</p>
                </div>
                <div className="glass-panel p-6 rounded-[20px]">
                    <h3 className="text-[#808191] text-sm mb-2">Revenue Distributed</h3>
                    <p className="text-[24px] font-bold text-[#8c6dfd]">₹ 1,000</p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center mt-6">
                <h2 className="font-epilogue font-semibold text-[18px]">Expense Management</h2>
                <CustomButton
                    btnType="button"
                    title="Upload New Bill"
                    styles="bg-[#8c6dfd] flex items-center gap-2"
                    handleClick={() => setShowUpload(true)}
                />
            </div>

            {/* Expense List */}
            <div className="glass-panel rounded-[20px] p-6 min-h-[300px]">
                {showUpload ? (
                    <UploadBillForm onClose={() => setShowUpload(false)} />
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-4 text-[#808191] text-sm mb-2 px-4">
                            <span>Description</span>
                            <span>Amount</span>
                            <span>Date</span>
                            <span>Status</span>
                        </div>
                        {expenses.length === 0 ? (
                            <div className="py-10 text-center text-[#808191]">
                                <p>No expenses recorded.</p>
                                <p className="text-xs mt-1">Upload a bill to ask for community approval.</p>
                            </div>
                        ) : (
                            expenses.map((expense) => (
                                <div key={expense.id} className="grid grid-cols-4 items-center bg-[var(--background)] p-4 rounded-[10px] text-[var(--text-primary)]">
                                    <span className="font-medium">{expense.title}</span>
                                    <span>{expense.amount}</span>
                                    <span className="text-[#808191]">{expense.date}</span>
                                    <span className={`flex items-center gap-2 ${expense.status === 'Approved' ? 'text-[#4acd8d]' : 'text-[#f0ad4e]'}`}>
                                        {expense.status === 'Approved' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                        {expense.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const UploadBillForm = ({ onClose }) => {
    const [file, setFile] = useState(null);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Expense Request</h3>
                <button onClick={onClose} className="text-[#808191] hover:text-white">Cancel</button>
            </div>

            <form className="flex flex-col gap-6 max-w-[600px]">
                <FormField
                    labelName="Expense Description"
                    placeholder="e.g. Venue Booking for Shoot"
                    inputType="text"
                />
                <FormField
                    labelName="Amount (₹)"
                    placeholder="5000"
                    inputType="number"
                />

                <div className="flex flex-col gap-2">
                    <span className="font-epilogue font-medium text-[14px] text-[#808191]">Scan Bill / Receipt</span>
                    <div className="border-2 border-dashed border-[#3a3a43] rounded-[10px] h-[150px] flex flex-col items-center justify-center cursor-pointer hover:border-[#8c6dfd] transition-colors">
                        <Upload className="text-[#808191] mb-2" />
                        <span className="text-[#808191] text-sm">Drag or click to upload</span>
                    </div>
                </div>

                <CustomButton
                    btnType="submit"
                    title="Submit for Verification"
                    styles="bg-[#4acd8d]"
                />
            </form>
        </div>
    )
}

export default CreatorDashboard
