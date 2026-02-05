import React from 'react'

const CustomButton = ({ btnType, title, handleClick, styles }) => {
    return (
        <button
            type={btnType}
            className={`font-epilogue font-semibold text-[16px] leading-[26px] text-white min-h-[52px] px-4 rounded-[10px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg ${styles}`}
            onClick={handleClick}
        >
            {title}
        </button>
    )
}

export default CustomButton
