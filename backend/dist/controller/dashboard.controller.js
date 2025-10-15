import { PrismaClient } from "@prisma/client";
import { CacheService } from "../services/cacheService";
const prisma = new PrismaClient();
// Get comprehensive dashboard data for a user
export const getDashboardData = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        // Try to get cached dashboard data first
        let cachedData = null;
        try {
            cachedData = await CacheService.getDashboardCache(userId.toString());
            if (cachedData) {
                console.log("📦 Dashboard data served from cache");
                return res.json(cachedData);
            }
        }
        catch (cacheError) {
            console.warn("Cache retrieval failed, proceeding with database query:", cacheError);
            // Continue with database query if cache fails
        }
        // Get user profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userSkills: {
                    include: {
                        skill: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Get user sessions with questions
        const sessions = await prisma.interviewSession.findMany({
            where: {
                userId: userId,
                status: "COMPLETED"
            },
            include: {
                questions: true
            },
            orderBy: {
                endedAt: "desc"
            },
            take: 10 // Get last 10 sessions
        });
        // Calculate dashboard statistics
        const stats = calculateDashboardStats(sessions);
        // Get recent sessions data
        const recentSessions = formatRecentSessions(sessions.slice(0, 5));
        // Calculate skill scores based on domain performance
        const skillScores = calculateSkillScores(sessions);
        // Generate recommended topics based on performance
        const recommendedTopics = generateRecommendedTopics(sessions, skillScores);
        // Format user profile
        const profile = {
            name: `${user.Firstname} ${user.Lastname}`,
            email: user.email,
            experienceLevel: determineExperienceLevel(stats.averageScore),
            skillTags: user.userSkills.map(us => us.skill.name),
            joinDate: formatDate(sessions[sessions.length - 1]?.startedAt || new Date())
        };
        const dashboardData = {
            profile,
            stats,
            recentSessions,
            skillScores,
            recommendedTopics
        };
        // Cache the dashboard data for future requests
        try {
            await CacheService.setDashboardCache(userId.toString(), dashboardData);
            console.log("💾 Dashboard data cached successfully");
        }
        catch (cacheError) {
            console.warn("Failed to cache dashboard data:", cacheError);
            // Continue serving the response even if caching fails
        }
        res.json(dashboardData);
    }
    catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            error: "Failed to fetch dashboard data",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
function calculateDashboardStats(sessions) {
    if (sessions.length === 0) {
        return {
            averageScore: 0,
            totalSessions: 0,
            strongestSkill: "No data",
            improvementArea: "No data",
            completionRate: 0,
            totalQuestionsAnswered: 0
        };
    }
    // Calculate average score
    const scoresWithValues = sessions.filter(s => s.totalScore !== null);
    const averageScore = scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + s.totalScore, 0) / scoresWithValues.length
        : 0;
    // Calculate completion rate
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
    const answeredQuestions = sessions.reduce((sum, s) => sum + (s.questions.filter((q) => q.userAnswer !== null).length || 0), 0);
    const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    // Find strongest and weakest domains
    const domainScores = {};
    sessions.forEach(session => {
        if (session.totalScore !== null) {
            const domain = session.domain;
            if (!domainScores[domain]) {
                domainScores[domain] = { total: 0, count: 0 };
            }
            domainScores[domain].total += session.totalScore;
            domainScores[domain].count += 1;
        }
    });
    const domainAverages = Object.entries(domainScores).map(([domain, data]) => ({
        domain,
        average: data.total / data.count
    }));
    const strongestSkill = domainAverages.length > 0
        ? domainAverages.reduce((max, curr) => max.average > curr.average ? max : curr).domain
        : "No data";
    const improvementArea = domainAverages.length > 0
        ? domainAverages.reduce((min, curr) => min.average < curr.average ? min : curr).domain
        : "No data";
    return {
        averageScore: Math.round(averageScore * 10) / 10,
        totalSessions: sessions.length,
        strongestSkill: formatDomainName(strongestSkill),
        improvementArea: formatDomainName(improvementArea),
        completionRate: Math.round(completionRate),
        totalQuestionsAnswered: answeredQuestions
    };
}
// Format recent sessions data
function formatRecentSessions(sessions) {
    return sessions.map(session => {
        const duration = session.endedAt && session.startedAt
            ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60))
            : session.duration || 0;
        return {
            id: session.id,
            date: formatDate(session.startedAt),
            domain: formatDomainName(session.domain),
            score: session.totalScore ? Math.round(session.totalScore) : 0,
            duration: `${duration} min`,
            questions: session.questions.length,
            status: session.status || "UNKNOWN"
        };
    });
}
// Calculate skill scores by domain
function calculateSkillScores(sessions) {
    const skillScores = {};
    const domainCounts = {};
    sessions.forEach(session => {
        if (session.totalScore !== null) {
            const domain = formatDomainName(session.domain);
            if (!skillScores[domain]) {
                skillScores[domain] = 0;
                domainCounts[domain] = 0;
            }
            skillScores[domain] += session.totalScore;
            domainCounts[domain] += 1;
        }
    });
    // Calculate averages
    Object.keys(skillScores).forEach(domain => {
        skillScores[domain] = Math.round((skillScores[domain] / domainCounts[domain]) * 10) / 10;
    });
    return skillScores;
}
// Generate recommended topics based on performance
function generateRecommendedTopics(sessions, skillScores) {
    const recommendations = [];
    // Find areas that need improvement (scores < 70)
    const improvementAreas = Object.entries(skillScores)
        .filter(([, score]) => score < 70)
        .sort(([, a], [, b]) => a - b);
    // Add recommendations for improvement areas
    improvementAreas.forEach(([domain, score]) => {
        const topics = getRecommendationsForDomain(domain, score);
        recommendations.push(...topics);
    });
    // Add advanced topics for strong areas (scores > 85)
    const strongAreas = Object.entries(skillScores)
        .filter(([, score]) => score > 85)
        .sort(([, a], [, b]) => b - a);
    strongAreas.slice(0, 2).forEach(([domain]) => {
        const advancedTopics = getAdvancedTopicsForDomain(domain);
        recommendations.push(...advancedTopics);
    });
    return recommendations.slice(0, 6); // Return top 6 recommendations
}
// Get recommendations for specific domain
function getRecommendationsForDomain(domain, score) {
    const level = score < 50 ? "Beginner" : score < 70 ? "Intermediate" : "Advanced";
    const domainRecommendations = {
        "Frontend": [
            {
                title: "React Fundamentals",
                description: "Master component lifecycle, state management, and hooks",
                difficulty: level,
                estimatedTime: "3 hours",
                domain: "Frontend"
            },
            {
                title: "CSS Grid & Flexbox",
                description: "Modern layout techniques for responsive design",
                difficulty: level,
                estimatedTime: "2 hours",
                domain: "Frontend"
            }
        ],
        "Backend": [
            {
                title: "RESTful API Design",
                description: "Learn to design scalable and maintainable APIs",
                difficulty: level,
                estimatedTime: "4 hours",
                domain: "Backend"
            },
            {
                title: "Database Optimization",
                description: "Indexing strategies and query optimization",
                difficulty: level,
                estimatedTime: "3 hours",
                domain: "Backend"
            }
        ],
        "System Design": [
            {
                title: "Microservices Architecture",
                description: "Understanding distributed systems and service communication",
                difficulty: level,
                estimatedTime: "5 hours",
                domain: "System Design"
            }
        ]
    };
    return domainRecommendations[domain] || [];
}
// Get advanced topics for strong domains
function getAdvancedTopicsForDomain(domain) {
    const advancedTopics = {
        "Frontend": [
            {
                title: "Advanced React Patterns",
                description: "Render props, compound components, and performance optimization",
                difficulty: "Advanced",
                estimatedTime: "4 hours",
                domain: "Frontend"
            }
        ],
        "Backend": [
            {
                title: "Advanced System Architecture",
                description: "Event sourcing, CQRS, and distributed system patterns",
                difficulty: "Advanced",
                estimatedTime: "6 hours",
                domain: "Backend"
            }
        ]
    };
    return advancedTopics[domain] || [];
}
// Helper functions
function formatDomainName(domain) {
    const domainMap = {
        "FRONTEND": "Frontend",
        "BACKEND": "Backend",
        "FULLSTACK": "Full Stack",
        "DATA_SCIENCE": "Data Science",
        "MOBILE": "Mobile",
        "DEVOPS": "DevOps",
        "TECHNICAL": "Technical",
        "BEHAVIORAL": "Behavioral",
        "SYSTEM_DESIGN": "System Design"
    };
    return domainMap[domain] || domain;
}
function determineExperienceLevel(averageScore) {
    if (averageScore >= 85)
        return "Senior";
    if (averageScore >= 70)
        return "Mid-level";
    if (averageScore >= 50)
        return "Junior";
    return "Beginner";
}
function formatDate(date) {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().split("T")[0];
}
