export const CAMPAIGN_STATES = {
    FUNDING_OPEN: 'Funding Open',
    FUNDING_CLOSED: 'Funding Closed',
    IN_PRODUCTION: 'In Production',
    VOTING_ACTIVE: 'Voting Active',
    REVENUE_LIVE: 'Revenue Live',
    SETTLED: 'Settled',
    REFUNDED: 'Refunded'
};

export const EXPENSE_STATES = {
    VOTING_OPEN: 'Voting Open',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PAID: 'Paid'
};

export const EXPENSE_CATEGORIES = [
    'Equipment',
    'Logistics',
    'Talent',
    'Marketing',
    'Legal'
];

export const MOCK_CAMPAIGNS = [
    {
        id: 1,
        title: "Eco-Friendly Documentary",
        description: "A deep dive into climate change solutions...",
        target: 50000,
        raised: 30000,
        deadline: "12",
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3",
        category: "Education",
        owner: "0x123...456",
        state: "Voting Active",
        userContribution: 5000, // Mock: Current user contributed this
        quorum: 30 // 30% ownership quorum needed
    },
    {
        id: 2,
        title: "Indie Game: Cyber",
        description: "Pixel art cyberpunk RPG.",
        target: 100000,
        raised: 100000,
        deadline: "0",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3",
        category: "Gaming",
        owner: "0xABC...DEF",
        state: "Revenue Live",
        userContribution: 0,
        quorum: 40
    }
];
