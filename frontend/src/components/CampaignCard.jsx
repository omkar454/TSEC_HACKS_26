import { useState, useEffect } from 'react'
import { Folder } from 'lucide-react'

const CampaignCard = ({ owner, title, description, target, deadline, rawDeadline, amountCollected, image, category, state, handleClick }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const calculateTimeLeft = (deadlineDate) => {
        const difference = +new Date(deadlineDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return timeLeft;
    };

    useEffect(() => {
        if (!rawDeadline) return;

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(rawDeadline));
        }, 1000);

        return () => clearInterval(timer);
    }, [rawDeadline]);

    const getStateColor = (state) => {
        switch (state) {
            case 'Funding Open': return 'bg-[#4acd8d]';
            case 'Voting Active': return 'bg-[#8c6dfd]';
            case 'Revenue Live': return 'bg-[#eab308]';
            default: return 'bg-[#808191]';
        }
    }

    return (
        <div className="sm:w-[288px] w-full rounded-[15px] glass-card cursor-pointer hover:shadow-xl hover:shadow-[#8c6dfd]/10 transition-all hover:-translate-y-2" onClick={handleClick}>
            <div className="relative">
                <img src={image} alt="fund" className="w-full h-[158px] object-cover rounded-[15px]" />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-[10px] uppercase font-bold ${getStateColor(state)}`}>
                    {state || 'Funding Open'}
                </div>
            </div>
            <div className="flex flex-col p-4">
                <div className="flex flex-row items-center mb-[18px]">
                    <Folder className="w-[17px] h-[17px] text-[#808191]" />
                    <p className="ml-[12px] mt-[2px] font-epilogue font-medium text-[12px] text-[#808191]">{category}</p>
                </div>

                <div className="block">
                    <h3 className="font-epilogue font-semibold text-[16px] text-[var(--text-primary)] text-left leading-[26px] truncate">{title}</h3>
                    <p className="mt-[5px] font-epilogue font-normal text-[#808191] text-left leading-[18px] truncate">{description}</p>
                </div>

                <div className="flex justify-between flex-wrap mt-[15px] gap-2">
                    <div className="flex flex-col">
                        <h4 className="font-epilogue font-semibold text-[14px] text-[#b2b3bd] leading-[22px]">{amountCollected}</h4>
                        <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[#808191] sm:max-w-[120px] truncate">Raised of {target}</p>
                    </div>
                    <div className="flex flex-col">
                        <h4 className="font-epilogue font-semibold text-[14px] text-[#b2b3bd] leading-[22px]">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</h4>
                        <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[#808191] sm:max-w-[120px] truncate">Time Left</p>
                    </div>
                </div>

                <div className="flex items-center mt-[20px] gap-[12px]">
                    <div className="w-[30px] h-[30px] rounded-full flex justify-center items-center bg-[var(--background)]">
                        <span className="text-xs text-[#808191]">O</span>
                    </div>
                    <p className="flex-1 font-epilogue font-normal text-[12px] text-[#808191] truncate">by <span className="text-[#b2b3bd]">{owner}</span></p>
                </div>
            </div>
        </div >
    )
}

export default CampaignCard
