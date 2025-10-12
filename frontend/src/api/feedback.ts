import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface AICareerRecommendations {
    priorityAreas: {
        technical: {
            title: string;
            description: string;
            actions: string[];
        };
        communication: {
            title: string;
            description: string;
            actions: string[];
        };
    };
    learningRoadmap: {
        weeks1to2: {
            title: string;
            focus: string;
            tasks: string[];
        };
        weeks3to4: {
            title: string;
            focus: string;
            tasks: string[];
        };
        ongoing: {
            title: string;
            focus: string;
            tasks: string[];
        };
    };
    resources: {
        courses: string[];
        practice: string[];
        books: string[];
        communities: string[];
    };
}

export interface CareerRecommendationsResponse {
    success: boolean;
    sessionId: string;
    overallScore: number;
    recommendations: AICareerRecommendations;
}

/**
 * Generate AI-powered career recommendations for a specific interview session
 */
export const generateCareerRecommendations = async (sessionId: number | string): Promise<CareerRecommendationsResponse> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/interview/session/${sessionId}/ai-recommendations`,
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Error generating career recommendations:', error);
        throw error;
    }
};

/**
 * Get comprehensive feedback for an interview session
 */
export const getSessionFeedback = async (sessionId: number | string) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/interview/session/${sessionId}/feedback`,
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Error getting session feedback:', error);
        throw error;
    }
};

/**
 * Generate comprehensive session feedback
 */
export const generateComprehensiveFeedback = async (sessionId: number | string) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/interview/session/${sessionId}/comprehensive-feedback`,
            {},
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Error generating comprehensive feedback:', error);
        throw error;
    }
};

/**
 * Analyze interviewer behavior
 */
export const analyzeInterviewerBehavior = async (sessionId: number | string) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/interview/session/${sessionId}/interviewer-analysis`,
            {},
            { withCredentials: true }
        );
        return response.data;
    } catch (error) {
        console.error('Error analyzing interviewer behavior:', error);
        throw error;
    }
};