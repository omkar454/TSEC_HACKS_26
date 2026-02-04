import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react'
import CustomButton from './CustomButton';

const Navbar = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');

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
                <CustomButton
                    btnType="button"
                    title="Create A Campaign"
                    styles="bg-[#8c6dfd]"
                    handleClick={() => {
                        navigate('/create-campaign')
                    }}
                />

                <div
                    className="w-[52px] h-[52px] rounded-full bg-[var(--secondary)] flex justify-center items-center cursor-pointer hover:shadow-lg"
                    onClick={() => navigate('/profile')}
                >
                    <div className="w-[60%] h-[60%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
