/**
 * Formats a UTC date string to Indian Standard Time (Asia/Kolkata)
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} - Formatted date string
 */
export const formatToIST = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";

    try {
        const options = {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            ...(includeTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {})
        };

        return new Intl.DateTimeFormat('en-IN', options).format(new Date(dateString));
    } catch (error) {
        console.error("Error formatting date to IST:", error);
        return dateString;
    }
};

/**
 * Calculates time remaining until a deadline based on IST
 * @param {string} deadline - ISO date string
 * @returns {object} - { days, hours, minutes, seconds }
 */
export const calculateCountdownIST = (deadline) => {
    if (!deadline) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const difference = +new Date(deadline) - +new Date();

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
};
