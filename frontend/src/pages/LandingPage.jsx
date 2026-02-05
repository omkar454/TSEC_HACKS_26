import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointer2, TrendingUp, ShieldCheck, Zap, Globe, Users } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-[#13131a] overflow-x-hidden text-white font-epilogue">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center justify-center text-center min-h-[90vh]">

                {/* Hero Section */}
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
                        <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Reimagining Creative Funding
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                        Empower Ideas with <br />
                        <span className="bg-gradient-to-r from-[#8c6dfd] via-[#b69bfd] to-[#e4dcfd] bg-clip-text text-transparent">
                            Decentralized Trust
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[#808191] max-w-2xl mx-auto leading-relaxed">
                        The next-generation platform connecting visionary creators with global investors.
                        Secure, transparent, and built for the future of the creator economy.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 rounded-xl bg-[#8c6dfd] hover:bg-[#7a5af8] text-white font-semibold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(140,109,253,0.3)] hover:shadow-[0_0_30px_rgba(140,109,253,0.5)] transform hover:-translate-y-1"
                        >
                            Start Creating
                        </button>
                        <button
                            onClick={() => navigate('/explore')}
                            className="px-8 py-4 rounded-xl glass-card hover:bg-white/5 text-white font-semibold text-lg transition-all duration-300"
                        >
                            Explore Campaigns
                        </button>
                    </div>
                </div>

                {/* Stats / trust signals */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-20 opacity-80 animate-fade-in-up delay-200">
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-white">100+</h3>
                        <p className="text-sm text-[#808191]">Projects Funded</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-white">$2M+</h3>
                        <p className="text-sm text-[#808191]">Capital Raised</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-white">50k+</h3>
                        <p className="text-sm text-[#808191]">Global Backers</p>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<ShieldCheck className="w-8 h-8 text-[#8c6dfd]" />}
                        title="Secure & Transparent"
                        description="Every transaction is recorded on our immutable ledger, ensuring complete transparency for creators and investors."
                    />
                    <FeatureCard
                        icon={<Globe className="w-8 h-8 text-[#2ac1bc]" />}
                        title="Global Reach"
                        description="Access a worldwide pool of investors and supporters. Your ideas know no borders."
                    />
                    <FeatureCard
                        icon={<Zap className="w-8 h-8 text-[#e37d86]" />}
                        title="Instant Settlements"
                        description="Smart contracts ensure funds are released instantly when milestones are met. No waiting periods."
                    />
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 bg-[#13131a] pt-12 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-[#808191] text-sm">
                        © 2026 TSEC Hacks. Building the future of funding.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="glass-card p-8 rounded-2xl flex flex-col items-start space-y-4 hover:bg-white/[0.03] transition-colors group">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-[#808191] leading-relaxed">
            {description}
        </p>
    </div>
);

export default LandingPage;
