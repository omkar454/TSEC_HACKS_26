import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext';
import CustomButton from './CustomButton';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    const handleSearch = () => {
        navigate(`/?search=${searchTerm}`);
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <div className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6">
            <div className="lg:flex-1 flex flex-row max-w-[458px] py-2 pl-4 pr-2 h-[52px] glass-panel rounded-[100px]">
                <input
                    type="text"
                    placeholder="Search for campaigns"
                    className="flex w-full font-epilogue font-normal text-[14px] placeholder:text-[#4b5264] text-[var(--text-primary)] bg-transparent outline-none border-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div
                    className="w-[72px] h-full rounded-[20px] bg-[#8c6dfd] flex justify-center items-center cursor-pointer"
                    onClick={handleSearch}
                >
                    <Search color="white" className="w-[15px] h-[15px] object-contain" />
                </div>
            </div>

            <div className="sm:flex hidden flex-row justify-end gap-4">
                {user ? (
                    <>
                        {!user.walletId ? (
                            <CustomButton
                                btnType="button"
                                title="Create Wallet"
                                styles="bg-[#8c6dfd]"
                                handleClick={() => navigate('/wallet')}
                            />
                        ) : (
                            <CustomButton
                                btnType="button"
                                title="Create A Campaign"
                                styles="bg-[#8c6dfd]"
                                handleClick={() => {
                                    navigate('/create-campaign')
                                }}
                            />
                        )}

                        <div className="relative">
                            <div
                                className="w-[52px] h-[52px] rounded-full bg-[var(--secondary)] flex justify-center items-center cursor-pointer hover:shadow-lg"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="w-[60%] h-[60%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-14 w-[150px] glass-panel rounded-xl flex flex-col p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="text-left w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[#8c6dfd]/20 hover:text-[#8c6dfd] rounded-[8px] transition-colors"
                                    >
                                        User Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                            navigate('/login');
                                        }}
                                        className="text-left w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[#ef4444]/20 hover:text-[#ef4444] rounded-[8px] transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <CustomButton
                        btnType="button"
                        title="Log In"
                        styles="bg-[#1dc071]"
                        handleClick={() => navigate('/login')}
                    />
                )}
            </div>
        </div>
    )
}

export default Navbar
