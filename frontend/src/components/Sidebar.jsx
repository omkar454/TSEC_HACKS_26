import React, { useState } from 'react';
import { LayoutDashboard, Megaphone, MonitorPlay, Wallet, User, LogOut, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Icon = ({ styles, name, imgUrl, isActive, disabled, handleClick }) => (
    <div className={`w-[48px] h-[48px] rounded-[10px] ${isActive && isActive === name && 'bg-[var(--background)]'} flex justify-center items-center ${!disabled && 'cursor-pointer'} ${styles}`} onClick={handleClick}>
        {!isActive ? (
            <img src={imgUrl} alt="fund_logo" className="w-1/2 h-1/2" />
        ) : (
            <img src={imgUrl} alt="fund_logo" className={`w-1/2 h-1/2 ${isActive !== name && 'grayscale'}`} />
        )}
    </div>
);

const Sidebar = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isActive, setIsActive] = useState('dashboard');

    const navlinks = [
        {
            name: 'dashboard',
            imgUrl: LayoutDashboard,
            link: '/',
        },
        {
            name: 'campaign',
            imgUrl: Megaphone,
            link: '/create-campaign',
        },
        {
            name: 'payment',
            imgUrl: MonitorPlay, // Creator Studio / Transparency
            link: '/dashboard',
        },
        {
            name: 'withdraw',
            imgUrl: Wallet,
            link: '/',
        },
        {
            name: 'profile',
            imgUrl: User,
            link: '/profile',
        },
        {
            name: 'logout',
            imgUrl: LogOut,
            link: '/',
            disabled: false,
        },
    ];

    return (
        <div className="flex justify-between items-center flex-col sticky top-5 h-[93vh]">
            <div
                className="w-[52px] h-[52px] rounded-[10px] glass-panel flex justify-center items-center cursor-pointer hover:shadow-lg transition-transform hover:scale-105"
                onClick={() => navigate('/')}
            >
                {/* Changed Brand Icon to 'L' for Lazarus if desired, keeping V for now as placeholder or update */}
                <div className="w-[60%] h-[60%] bg-[#8c6dfd] rounded-full flex items-center justify-center font-bold text-white text-xl">L</div>
            </div>

            <div className="flex-1 flex flex-col justify-between items-center glass-panel rounded-[20px] w-[76px] py-4 mt-12">
                <div className="flex flex-col justify-center items-center gap-3">
                    {navlinks.map((link) => (
                        <div
                            key={link.name}
                            onClick={() => {
                                if (link.name === 'logout') {
                                    setIsActive(link.name);
                                    logout();
                                    navigate('/login');
                                    return;
                                }
                                if (!link.disabled) {
                                    setIsActive(link.name);
                                    navigate(link.link);
                                }
                            }}
                            className={`w-[48px] h-[48px] rounded-[10px] ${isActive === link.name && 'bg-[var(--background)]'} flex justify-center items-center cursor-pointer ${link.disabled && link.name !== 'logout' && 'cursor-not-allowed opacity-50'}`}
                        >
                            <link.imgUrl color={isActive === link.name ? '#1dc071' : '#808191'} />
                        </div>
                    ))}
                </div>

                <div
                    className="w-[48px] h-[48px] rounded-[10px] bg-[var(--secondary)] shadow-secondary shadow-lg flex justify-center items-center cursor-pointer"
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? <Sun color="#808191" /> : <Moon color="#808191" />}
                </div>
            </div>
        </div>
    )
}

export default Sidebar
