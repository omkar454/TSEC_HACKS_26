import React from 'react';

const BackgroundEffects = () => {
    return (
        <>
            {/* Dynamic Mist Layer - Subtle Purple Glow */}
            <div className="mist-layer" />

            {/* Animated Fireflies - Adapted from Vana Sage */}
            <div className="fireflies-container">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="firefly" />
                ))}
            </div>

            {/* Optional: Deep Background Gradient (if needed to override default bg) */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#13131a] via-[#1c1c24] to-[#13131a] -z-[5] pointer-events-none opacity-80" />
        </>
    );
};

export default BackgroundEffects;
