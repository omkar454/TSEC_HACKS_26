import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import DisplayCampaigns from '../components/DisplayCampaigns'

const Home = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchTerm = searchParams.get('search') || '';

    useEffect(() => {
        setIsLoading(true);
        // Mock fetch
        setTimeout(() => {
            const allCampaigns = [
                {
                    id: 1,
                    title: "Mango",
                    description: "build a pc",
                    target: "20000",
                    deadline: "/",
                    amountCollected: "5000",
                    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                    category: "Education",
                    owner: "0xAF...593b5",
                    state: "Voting Active"
                },
                {
                    id: 2,
                    title: "Glasses One Two Three",
                    description: "Hi there! I'm looking for some help t...",
                    target: "50000",
                    deadline: "28",
                    amountCollected: "0.0",
                    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1160&q=80",
                    category: "Design",
                    owner: "0xAF...593b5",
                    state: "Funding Open"
                },
                {
                    id: 3,
                    title: "The Helpers",
                    description: "the story begin when it ends. we ke...",
                    target: "100000",
                    deadline: "335",
                    amountCollected: "0.0",
                    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                    category: "Real Estate",
                    owner: "0xAF...593b5",
                    state: "Revenue Live"
                }
            ];

            if (searchTerm) {
                const filtered = allCampaigns.filter(c =>
                    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setCampaigns(filtered);
            } else {
                setCampaigns(allCampaigns);
            }
            setIsLoading(false);
        }, 1000);
    }, [searchTerm]);

    return (
        <DisplayCampaigns
            title="All Campaigns"
            isLoading={isLoading}
            campaigns={campaigns}
        />
    )
}

export default Home
