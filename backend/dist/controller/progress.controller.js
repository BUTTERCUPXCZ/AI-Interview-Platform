import { PrismaClient } from "@prisma/client";
import { CacheService } from "../services/cacheService.js";
const prisma = new PrismaClient();
// Get comprehensive progress analytics for a user
export const getProgressAnalytics = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        // Try to get cached progress data first
        const cachedProgress = await CacheService.getUserProgress(userId.toString());
        if (cachedProgress) {
            console.log("📦 Progress data served from cache");
            return res.json(cachedProgress);
        }
        // Get user sessions with questions
        const sessions = await prisma.interviewSession.findMany({
            where: {
                userId: userId,
                status: "COMPLETED"
            },
            include: {
                questions: {
                    select: {
                        id: true,
                        score: true,
                        userAnswer: true
                    }
                }
            },
            orderBy: {
                startedAt: "asc"
            }
        });
        if (sessions.length === 0) {
            return res.json({
                stats: {
                    overallScore: 0,
                    overallImprovement: 0,
                    totalSessions: 0,
                    sessionGrowth: 0,
                    strongestSkill: "No data yet",
                    strongestSkillScore: 0,
                    improvementArea: "Complete your first interview"
                },
                skillTrends: [],
                radarData: [],
                sessionHistory: [],
                domainComparison: [],
                recommendations: []
            });
        }
        // Calculate progress statistics
        const stats = calculateProgressStats(sessions);
        // Generate skill trends over time (monthly aggregation)
        const skillTrends = generateSkillTrends(sessions);
        // Create radar chart data for current vs previous period
        const radarData = generateRadarData(sessions);
        // Format session history with improvements
        const sessionHistory = formatSessionHistory(sessions);
        // Calculate domain comparison data
        const domainComparison = calculateDomainComparison(sessions);
        // Generate AI recommendations based on performance
        const recommendations = generateProgressRecommendations(sessions);
        const progressData = {
            stats,
            skillTrends,
            radarData,
            sessionHistory,
            domainComparison,
            recommendations
        };
        // Cache the progress data for future requests
        await CacheService.setUserProgress(userId.toString(), progressData);
        console.log("💾 Progress data cached successfully");
        res.json(progressData);
    }
    catch (error) {
        console.error("Error fetching progress analytics:", error);
        res.status(500).json({
            error: "Failed to fetch progress analytics",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Calculate overall progress statistics
function calculateProgressStats(sessions) {
    const sessionsWithScores = sessions.filter(s => s.totalScore != null);
    if (sessionsWithScores.length === 0) {
        return {
            overallScore: 0,
            overallImprovement: 0,
            totalSessions: sessions.length,
            sessionGrowth: 0,
            strongestSkill: "No data",
            strongestSkillScore: 0,
            improvementArea: "No data"
        };
    }
    // Calculate overall score
    const overallScore = sessionsWithScores.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / sessionsWithScores.length;
    // Calculate improvement (compare last month vs previous month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastMonthSessions = sessionsWithScores.filter(s => new Date(s.startedAt) >= lastMonth && new Date(s.startedAt) < now);
    const previousMonthSessions = sessionsWithScores.filter(s => new Date(s.startedAt) >= twoMonthsAgo && new Date(s.startedAt) < lastMonth);
    const lastMonthAvg = lastMonthSessions.length > 0
        ? lastMonthSessions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / lastMonthSessions.length
        : overallScore;
    const previousMonthAvg = previousMonthSessions.length > 0
        ? previousMonthSessions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / previousMonthSessions.length
        : overallScore;
    const overallImprovement = lastMonthAvg - previousMonthAvg;
    // Calculate session growth
    const sessionGrowth = lastMonthSessions.length - previousMonthSessions.length;
    // Find strongest skill and improvement area
    const domainScores = {};
    sessionsWithScores.forEach(session => {
        const domain = formatDomainName(session.domain);
        if (!domainScores[domain]) {
            domainScores[domain] = { total: 0, count: 0 };
        }
        domainScores[domain].total += (session.totalScore ?? 0);
        domainScores[domain].count += 1;
    });
    const domainAverages = Object.entries(domainScores).map(([domain, data]) => ({
        domain,
        average: data.total / data.count
    }));
    const strongest = domainAverages.length > 0
        ? domainAverages.reduce((max, curr) => max.average > curr.average ? max : curr)
        : { domain: "No data", average: 0 };
    const weakest = domainAverages.length > 0
        ? domainAverages.reduce((min, curr) => min.average < curr.average ? min : curr)
        : { domain: "No data", average: 0 };
    return {
        overallScore: Math.round(overallScore * 10) / 10,
        overallImprovement: Math.round(overallImprovement * 10) / 10,
        totalSessions: sessions.length,
        sessionGrowth,
        strongestSkill: strongest.domain,
        strongestSkillScore: Math.round(strongest.average),
        improvementArea: weakest.domain
    };
}
// Generate skill trends data for charts
function generateSkillTrends(sessions) {
    const trends = [];
    const sessionsWithScores = sessions.filter(s => s.totalScore !== null);
    if (sessionsWithScores.length === 0)
        return trends;
    // Group sessions by month
    const monthlyData = {};
    sessionsWithScores.forEach(session => {
        const date = new Date(session.startedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const domain = formatDomainName(session.domain);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {};
        }
        if (!monthlyData[monthKey][domain]) {
            monthlyData[monthKey][domain] = [];
        }
        monthlyData[monthKey][domain].push(session.totalScore ?? 0);
    });
    // Convert to chart format
    Object.keys(monthlyData).sort().forEach(monthKey => {
        const trendPoint = { date: monthKey };
        Object.entries(monthlyData[monthKey]).forEach(([domain, scores]) => {
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            trendPoint[domain] = Math.round(average);
        });
        trends.push(trendPoint);
    });
    return trends.slice(-10); // Return last 10 months
}
// Generate radar chart data
function generateRadarData(sessions) {
    const radarData = [];
    const sessionsWithScores = sessions.filter(s => s.totalScore !== null);
    if (sessionsWithScores.length === 0)
        return radarData;
    // Split sessions into current and previous periods
    const midpoint = Math.floor(sessionsWithScores.length / 2);
    const previousSessions = sessionsWithScores.slice(0, midpoint);
    const currentSessions = sessionsWithScores.slice(midpoint);
    // Calculate averages for each domain in both periods
    const domainScores = {};
    currentSessions.forEach(session => {
        const domain = formatDomainName(session.domain);
        if (!domainScores[domain]) {
            domainScores[domain] = { current: [], previous: [] };
        }
        domainScores[domain].current.push(session.totalScore ?? 0);
    });
    previousSessions.forEach(session => {
        const domain = formatDomainName(session.domain);
        if (!domainScores[domain]) {
            domainScores[domain] = { current: [], previous: [] };
        }
        domainScores[domain].previous.push(session.totalScore ?? 0);
    });
    // Convert to radar format
    Object.entries(domainScores).forEach(([domain, scores]) => {
        const currentAvg = scores.current.length > 0
            ? scores.current.reduce((sum, score) => sum + score, 0) / scores.current.length
            : 0;
        const previousAvg = scores.previous.length > 0
            ? scores.previous.reduce((sum, score) => sum + score, 0) / scores.previous.length
            : currentAvg;
        radarData.push({
            skill: domain,
            current: Math.round(currentAvg),
            previous: Math.round(previousAvg),
            fullMark: 100
        });
    });
    return radarData;
}
// Format session history with improvement calculations
function formatSessionHistory(sessions) {
    const history = [];
    const sessionsWithScores = sessions.filter(s => s.totalScore !== null);
    sessionsWithScores.forEach((session, index) => {
        // Calculate improvement compared to previous session in same domain
        let improvement = 0;
        const domain = session.domain;
        // Find previous session in same domain
        for (let i = index - 1; i >= 0; i--) {
            if (sessionsWithScores[i].domain === domain && sessionsWithScores[i].totalScore !== null) {
                improvement = (session.totalScore ?? 0) - (sessionsWithScores[i].totalScore ?? 0);
                break;
            }
        }
        const duration = session.endedAt && session.startedAt
            ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60))
            : session.duration || 0;
        history.push({
            id: session.id,
            date: formatDate(session.startedAt),
            domain: formatDomainName(session.domain),
            type: formatInterviewType(session.interviewType || "Technical"),
            score: Math.round(session.totalScore ?? 0),
            duration: `${duration} min`,
            questions: (session.questions || []).length,
            improvement: Math.round(improvement)
        });
    });
    return history.reverse().slice(0, 20); // Return latest 20 sessions
}
// Calculate domain comparison data
function calculateDomainComparison(sessions) {
    const comparison = [];
    const sessionsWithScores = sessions.filter(s => s.totalScore !== null);
    if (sessionsWithScores.length === 0)
        return comparison;
    // Split into current and previous periods
    const midpoint = Math.floor(sessionsWithScores.length / 2);
    const previousSessions = sessionsWithScores.slice(0, midpoint);
    const currentSessions = sessionsWithScores.slice(midpoint);
    // Calculate domain averages
    const domainData = {};
    currentSessions.forEach(session => {
        const domain = formatDomainName(session.domain);
        if (!domainData[domain]) {
            domainData[domain] = { current: [], previous: [], total: 0 };
        }
        domainData[domain].current.push(session.totalScore ?? 0);
        domainData[domain].total++;
    });
    previousSessions.forEach(session => {
        const domain = formatDomainName(session.domain);
        if (!domainData[domain]) {
            domainData[domain] = { current: [], previous: [], total: 0 };
        }
        domainData[domain].previous.push(session.totalScore ?? 0);
        domainData[domain].total++;
    });
    // Convert to comparison format
    Object.entries(domainData).forEach(([domain, data]) => {
        const currentAvg = data.current.length > 0
            ? data.current.reduce((sum, score) => sum + score, 0) / data.current.length
            : 0;
        const previousAvg = data.previous.length > 0
            ? data.previous.reduce((sum, score) => sum + score, 0) / data.previous.length
            : currentAvg;
        comparison.push({
            domain,
            current: Math.round(currentAvg),
            previous: Math.round(previousAvg),
            sessions: data.total
        });
    });
    return comparison;
}
// Generate progress recommendations
function generateProgressRecommendations(sessions) {
    const recommendations = [];
    // Get domain performance
    const sessionsWithScores = sessions.filter(s => s.totalScore !== null);
    const domainScores = {};
    sessionsWithScores.forEach(session => {
        const domain = formatDomainName(session.domain);
        if (!domainScores[domain]) {
            domainScores[domain] = [];
        }
        domainScores[domain].push(session.totalScore ?? 0);
    });
    // Calculate domain averages
    const domainAverages = Object.entries(domainScores).map(([domain, scores]) => ({
        domain,
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));
    // Sort by performance (lowest first for improvement opportunities)
    domainAverages.sort((a, b) => a.average - b.average);
    // Add recommendations for lowest performing domains
    domainAverages.slice(0, 2).forEach(({ domain, average }) => {
        const recs = getDomainRecommendations(domain, average);
        recommendations.push(...recs);
    });
    // Add advanced recommendations for highest performing domains
    domainAverages.slice(-2).forEach(({ domain, average }) => {
        if (average > 85) {
            const advancedRecs = getAdvancedRecommendations(domain);
            recommendations.push(...advancedRecs);
        }
    });
    return recommendations.slice(0, 4); // Return top 4 recommendations
}
// Get recommendations for specific domain
function getDomainRecommendations(domain, score) {
    const priority = score < 50 ? "High" : score < 70 ? "Medium" : "Low";
    const difficulty = score < 50 ? "Beginner" : score < 70 ? "Intermediate" : "Advanced";
    const recommendations = {
        "Frontend": [
            {
                title: "React Fundamentals",
                description: "Master component lifecycle, state management, and hooks",
                difficulty,
                estimatedTime: "2-3 hours",
                priority,
                category: "Frontend"
            }
        ],
        "Backend": [
            {
                title: "API Design Patterns",
                description: "Learn RESTful design and best practices",
                difficulty,
                estimatedTime: "1.5-2 hours",
                priority,
                category: "Backend"
            }
        ],
        "System Design": [
            {
                title: "Scalability Fundamentals",
                description: "Understanding load balancing and caching strategies",
                difficulty,
                estimatedTime: "3-4 hours",
                priority,
                category: "System Design"
            }
        ],
        "Data Structures": [
            {
                title: "Advanced Data Structures",
                description: "Trees, graphs, and their applications",
                difficulty,
                estimatedTime: "2-3 hours",
                priority,
                category: "Data Structures"
            }
        ]
    };
    return recommendations[domain] || [];
}
// Get advanced recommendations for strong domains
function getAdvancedRecommendations(domain) {
    const advanced = {
        "Frontend": [
            {
                title: "Advanced React Patterns",
                description: "Render props, compound components, and performance optimization",
                difficulty: "Advanced",
                estimatedTime: "3-4 hours",
                priority: "Medium",
                category: "Frontend"
            }
        ],
        "Backend": [
            {
                title: "Microservices Architecture",
                description: "Design patterns for distributed systems",
                difficulty: "Advanced",
                estimatedTime: "4-5 hours",
                priority: "Medium",
                category: "Backend"
            }
        ]
    };
    return advanced[domain] || [];
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
        "frontend": "Frontend",
        "backend": "Backend",
        "fullstack": "Full Stack",
        "data-science": "Data Science",
        "mobile": "Mobile",
        "devops": "DevOps"
    };
    return domainMap[domain] || domain;
}
function formatInterviewType(type) {
    const typeMap = {
        "TECHNICAL": "Technical",
        "BEHAVIORAL": "Behavioral",
        "SYSTEM_DESIGN": "System Design",
        "technical": "Technical",
        "behavioral": "Behavioral",
        "system-design": "System Design"
    };
    return typeMap[type] || type;
}
function formatDate(date) {
    return new Date(date).toISOString().split("T")[0];
}
