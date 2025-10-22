import { useContext } from 'react';
import { AuthContext } from './AuthContextValue';

// Custom hook to use auth context - extracted to separate file for fast refresh compatibility
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
