import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import DisplayCampaigns from '../components/DisplayCampaigns'
import api from '../utils/api'

const Home = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchTerm = searchParams.get('search') || '';

    useEffect(() => {
        const fetchCampaigns = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/projects');
                // Transform data if necessary to match component expectation
                // Backend returns array of projects. 
                // Need to map fields: currentFunding -> amountCollected, etc.
                const mappedCampaigns = data.map(p => ({
                    id: p._id,
                    title: p.title,
                    description: p.description,
                    target: p.fundingGoal,
                    rawDeadline: p.deadline,
                    deadline: p.deadline ? new Date(p.deadline).toLocaleDateString() : "Ongoing",
                    amountCollected: p.currentFunding,
                    image: p.imageUrl || "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
                    category: p.category,
                    owner: p.creatorId?.name || (typeof p.creatorId === 'object' ? "Unknown" : "Creator"),
                    state: p.status
                }));

                if (searchTerm) {
                    const filtered = mappedCampaigns.filter(c =>
                        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.category.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    setCampaigns(filtered);
                } else {
                    setCampaigns(mappedCampaigns);
                }
            } catch (error) {
                console.error("Failed to fetch campaigns:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaigns();
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
