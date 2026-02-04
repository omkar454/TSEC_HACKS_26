import axios from 'axios';

const API_KEY = 'sk_hackathon_8df3418224e17990ca04ff76c5fbaff2';
const BASE_URL = 'https://api.fmm.finternetlab.io/api/v1';

const finternetApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
    },
});

// Event Emitter for Visual Monitor
const listeners = [];

const emit = (event, data) => {
    listeners.forEach(callback => callback(event, data));
};

export const finternetService = {
    /**
     * Subscribe to Finternet events
     * @param {function} callback - (event, data) => void
     */
    subscribe: (callback) => {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    },

    /**
     * Create a payment intent (Incoming Payment)
     * @param {number} amount - Amount to charge
     * @param {string} currency - Currency code (e.g., 'USDC', 'INR')
     * @param {string} description - Payment description
     */
    createPaymentIntent: async (amount, currency = 'USDC', description) => {
        emit('START', { type: 'PAYMENT', amount, currency, description });
        try {
            const response = await finternetApi.post('/payment-intents', {
                amount: Number(amount).toFixed(2),
                currency,
                type: 'CONDITIONAL',
                settlementMethod: 'OFF_RAMP_MOCK',
                settlementDestination: 'bank_account_123', // Mock destination
                description,
            });
            emit('SUCCESS', { ...response.data, description });
            return response.data;
        } catch (error) {
            console.error('Finternet Payment Intent Error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || error.message;
            emit('ERROR', { message: errorMsg, description });
            throw error;
        }
    },

    /**
     * Create a payout intent (Outgoing Payment / Disbursement)
     * @param {number} amount - Amount to pay out
     * @param {string} currency - Currency code
     * @param {string} description - Payout description
     */
    createPayoutIntent: async (amount, currency = 'USDC', description) => {
        emit('START', { type: 'PAYOUT', amount, currency, description });
        try {
            // Simulating payout using payment intent for now
            const response = await finternetApi.post('/payment-intents', {
                amount: Number(amount).toFixed(2),
                currency,
                type: 'CONDITIONAL',
                settlementMethod: 'ON_RAMP_MOCK', // Inverting for payout simulation
                settlementDestination: 'user_bank_account_456',
                description: `PAYOUT: ${description}`,
            });
            emit('SUCCESS', { ...response.data, description, isPayout: true });
            return response.data;
        } catch (error) {
            console.error('Finternet Payout Error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || error.message;
            emit('ERROR', { message: errorMsg, description });
            throw error;
        }
    }
};

export default finternetService;
