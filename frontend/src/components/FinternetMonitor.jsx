import React, { useEffect, useState } from 'react';
import { Activity, X, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import finternetService from '../services/finternetService';

const FinternetMonitor = () => {
    const [events, setEvents] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = finternetService.subscribe((type, data) => {
            setIsVisible(true);
            const newEvent = {
                id: Date.now(),
                type,
                timestamp: new Date().toLocaleTimeString(),
                data
            };

            setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50

            // Auto-hide logs if inactive for long (optional, but keeping it visible is cooler)
            // setTimeout(() => setIsVisible(false), 8000); 
        });
        return () => unsubscribe();
    }, []);

    if (events.length === 0) return null;

    // Filter to show the latest active transaction status
    const latestEvent = events[0];
    const isProcessing = latestEvent?.type === 'START';

    return (
        <div className={`fixed z-[9999] bottom-5 right-5 w-[350px] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>

            {/* Header / Minimizer */}
            <div className="flex justify-between items-center bg-[#0d0d12] border border-[#3a3a43] p-3 rounded-t-[10px] shadow-2xl">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-[#8c6dfd] font-mono text-xs font-bold uppercase tracking-widest">Finternet Gateway</span>
                </div>
                <button onClick={() => setIsVisible(false)} className="text-[#808191] hover:text-white">
                    <X size={14} />
                </button>
            </div>

            {/* Terminal Window */}
            <div className="bg-[#13131a]/95 backdrop-blur-xl border-x border-b border-[#3a3a43] rounded-b-[10px] p-4 font-mono text-xs max-h-[300px] overflow-y-auto shadow-2xl custom-scrollbar">
                {events.map((evt) => (
                    <div key={evt.id} className="mb-4 border-b border-[#3a3a43]/50 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1 text-[#808191] opacity-70">
                            <span>[{evt.timestamp}]</span>
                            <span className={`font-bold ${evt.type === 'START' ? 'text-yellow-500' :
                                    evt.type === 'SUCCESS' ? 'text-[#4acd8d]' : 'text-red-500'
                                }`}>{evt.type}</span>
                        </div>

                        {evt.type === 'START' && (
                            <div className="text-white">
                                <p className="flex items-center gap-2">
                                    <Activity size={12} className="animate-spin" />
                                    Processing request...
                                </p>
                                <div className="mt-1 pl-2 border-l-2 border-yellow-500/30">
                                    <p className="text-[#808191]">Amount: <span className="text-white">{(Number(evt.data.amount) || 0).toFixed(2)} {evt.data.currency}</span></p>
                                    <p className="text-[#808191]">Memo: {evt.data.description}</p>
                                </div>
                            </div>
                        )}

                        {evt.type === 'SUCCESS' && (
                            <div className="text-white">
                                <p className="flex items-center gap-2 text-[#4acd8d]">
                                    <Check size={12} />
                                    Transaction Confirmed
                                </p>
                                <div className="mt-2 bg-[#000]/30 p-2 rounded border border-[#4acd8d]/20 text-[10px] text-[#4acd8d] break-all">
                                    <p>ID: {evt.data._id || evt.data.id || 'N/A'}</p>
                                    <p>STATUS: {evt.data.status || 'COMPLETED'}</p>
                                </div>
                            </div>
                        )}

                        {evt.type === 'ERROR' && (
                            <div className="text-red-400">
                                <p className="flex items-center gap-2">
                                    <AlertTriangle size={12} />
                                    Gateway Error
                                </p>
                                <p className="mt-1 pl-2 border-l-2 border-red-500/30">
                                    {evt.data.message}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FinternetMonitor;
