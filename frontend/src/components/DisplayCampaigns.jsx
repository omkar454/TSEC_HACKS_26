import React from 'react'
import { useNavigate } from 'react-router-dom'
import CampaignCard from './CampaignCard'
import { Loader } from 'lucide-react'

const DisplayCampaigns = ({ title, isLoading, campaigns }) => {
    const navigate = useNavigate();

    const handleNavigate = (campaign) => {
        navigate(`/campaign-details/${campaign.id}`, { state: campaign })
    }

    return (
        <div>
            <h1 className="font-epilogue font-semibold text-[18px] text-[var(--text-primary)] text-left">{title} ({campaigns.length})</h1>

            <div className="flex flex-wrap mt-[20px] gap-[26px]">
                {isLoading && (
                    <div className="flex justify-center items-center w-full">
                        <Loader className="w-[100px] h-[100px] object-contain animate-spin text-[#8c6dfd]" />
                    </div>
                )}

                {!isLoading && campaigns.length === 0 && (
                    <p className="font-epilogue font-semibold text-[14px] leading-[30px] text-[#818183]">
                        You have not created any campaigns yet
                    </p>
                )}

                {!isLoading && campaigns.length > 0 && campaigns.map((campaign) => <CampaignCard
                    key={campaign.id}
                    {...campaign}
                    handleClick={() => handleNavigate(campaign)}
                />)}
            </div>
        </div>
    )
}

export default DisplayCampaigns
