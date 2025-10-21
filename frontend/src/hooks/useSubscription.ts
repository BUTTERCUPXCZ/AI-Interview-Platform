import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

export const useSubscription = () => {
    const createCheckout = async (priceId: string, planType: 'FREE' | 'PRO' = 'PRO') => {
        // Call backend to create checkout session
        const resp = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/subscription/create-checkout`, 
            { priceId, planType }, 
            { withCredentials: true }
        );
        
        const { url, success } = resp.data;

        // If it's a free plan, just return success
        if (success && planType === 'FREE') {
            return { success: true };
        }

        // Redirect to Stripe checkout URL
        if (url) {
            window.location.href = url;
        } else {
            throw new Error('No checkout URL received from server');
        }
    };

    return { createCheckout };
};

// Hook to get current subscription status
export const useSubscriptionStatus = () => {
    return useQuery({
        queryKey: ['subscription-status'],
        queryFn: async () => {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/subscription/status`,
                { withCredentials: true }
            );
            return response.data;
        },
        staleTime: 10 * 1000, // Cache for 10 seconds (reduced from 5 minutes for faster updates)
        retry: false
    });
};

// Helper to check if user has PRO plan
export const useIsPro = () => {
    const { data } = useSubscriptionStatus();
    return data?.planType === 'PRO';
};
