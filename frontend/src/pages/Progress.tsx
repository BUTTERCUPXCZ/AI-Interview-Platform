import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Sidebar from '@/components/Sidebar'
import {
    TrendingUp,
    Target,
    Award,
    Calendar,
    Filter,
    Download,
    ChevronUp,
    ChevronDown,
    BarChart3,
    PieChart,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react'

// Mock data - in a real app, this would come from your API
const mockSkillTrendsData = [
    { date: '2024-01', Frontend: 65, Backend: 58, 'System Design': 45, 'Data Structures': 70, Algorithms: 62, Communication: 75 },
    { date: '2024-02', Frontend: 68, Backend: 61, 'System Design': 50, 'Data Structures': 74, Algorithms: 65, Communication: 78 },
    { date: '2024-03', Frontend: 72, Backend: 65, 'System Design': 55, 'Data Structures': 78, Algorithms: 68, Communication: 80 },
    { date: '2024-04', Frontend: 75, Backend: 68, 'System Design': 60, 'Data Structures': 82, Algorithms: 72, Communication: 82 },
    { date: '2024-05', Frontend: 78, Backend: 72, 'System Design': 65, 'Data Structures': 85, Algorithms: 75, Communication: 84 },
    { date: '2024-06', Frontend: 82, Backend: 75, 'System Design': 70, 'Data Structures': 88, Algorithms: 78, Communication: 86 },
    { date: '2024-07', Frontend: 85, Backend: 78, 'System Design': 75, 'Data Structures': 92, Algorithms: 82, Communication: 88 },
    { date: '2024-08', Frontend: 87, Backend: 80, 'System Design': 78, 'Data Structures': 94, Algorithms: 85, Communication: 90 },
    { date: '2024-09', Frontend: 90, Backend: 82, 'System Design': 82, 'Data Structures': 96, Algorithms: 88, Communication: 92 },
    { date: '2024-10', Frontend: 92, Backend: 85, 'System Design': 85, 'Data Structures': 98, Algorithms: 90, Communication: 94 }
]

const mockRadarData = [
    { skill: 'Frontend', current: 92, previous: 87, fullMark: 100 },
    { skill: 'Backend', current: 85, previous: 80, fullMark: 100 },
    { skill: 'System Design', current: 85, previous: 78, fullMark: 100 },
    { skill: 'Data Structures', current: 98, previous: 94, fullMark: 100 },
    { skill: 'Algorithms', current: 90, previous: 85, fullMark: 100 },
    { skill: 'Communication', current: 94, previous: 90, fullMark: 100 }
]

const mockSessionHistory = [
    { id: 1, date: '2024-10-08', domain: 'Frontend Development', type: 'Technical', score: 92, duration: '45 min', questions: 12, improvement: 5 },
    { id: 2, date: '2024-10-05', domain: 'System Design', type: 'System Design', score: 85, duration: '60 min', questions: 8, improvement: 7 },
    { id: 3, date: '2024-10-02', domain: 'Data Structures', type: 'Technical', score: 98, duration: '40 min', questions: 15, improvement: 2 },
    { id: 4, date: '2024-09-28', domain: 'Backend Development', type: 'Technical', score: 85, duration: '50 min', questions: 10, improvement: 2 },
    { id: 5, date: '2024-09-25', domain: 'Algorithms', type: 'Technical', score: 90, duration: '55 min', questions: 14, improvement: 3 },
    { id: 6, date: '2024-09-22', domain: 'Communication', type: 'Behavioral', score: 94, duration: '35 min', questions: 8, improvement: 2 },
    { id: 7, date: '2024-09-18', domain: 'Frontend Development', type: 'Technical', score: 87, duration: '42 min', questions: 11, improvement: -2 },
    { id: 8, date: '2024-09-15', domain: 'System Design', type: 'System Design', score: 78, duration: '65 min', questions: 6, improvement: 3 }
]

const mockRecommendations = [
    {
        title: "Advanced React Patterns",
        description: "Focus on hooks, context, and performance optimization",
        difficulty: "Advanced",
        estimatedTime: "2-3 hours",
        priority: "High",
        category: "Frontend"
    },
    {
        title: "Microservices Architecture",
        description: "Understanding distributed systems and service communication",
        difficulty: "Advanced",
        estimatedTime: "4-5 hours",
        priority: "Medium",
        category: "System Design"
    },
    {
        title: "Database Optimization",
        description: "Learn indexing strategies and query optimization techniques",
        difficulty: "Intermediate",
        estimatedTime: "1.5 hours",
        priority: "Medium",
        category: "Backend"
    },
    {
        title: "Algorithm Complexity Analysis",
        description: "Practice Big O notation and optimization techniques",
        difficulty: "Intermediate",
        estimatedTime: "1-2 hours",
        priority: "Low",
        category: "Algorithms"
    }
]

const mockComparisonData = [
    { domain: 'Frontend', current: 92, previous: 87, sessions: 15 },
    { domain: 'Backend', current: 85, previous: 80, sessions: 12 },
    { domain: 'System Design', current: 85, previous: 78, sessions: 8 },
    { domain: 'Data Structures', current: 98, previous: 94, sessions: 18 },
    { domain: 'Algorithms', current: 90, previous: 85, sessions: 14 },
    { domain: 'Communication', current: 94, previous: 90, sessions: 10 }
]

const Progress = () => {
    const [selectedDomains, setSelectedDomains] = useState<string[]>(['Frontend', 'Backend', 'System Design'])
    const [chartType, setChartType] = useState<'line' | 'bar'>('line')
    const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m')

    const getFilteredData = () => {
        const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
        return mockSkillTrendsData.slice(-months)
    }

    const getTrendIcon = (improvement: number) => {
        if (improvement > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
        if (improvement < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
        return <Minus className="h-4 w-4 text-gray-500" />
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600'
        if (score >= 80) return 'text-blue-600'
        if (score >= 70) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800'
            case 'Medium': return 'bg-yellow-100 text-yellow-800'
            case 'Low': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const toggleDomain = (domain: string) => {
        setSelectedDomains(prev =>
            prev.includes(domain)
                ? prev.filter(d => d !== domain)
                : [...prev, domain]
        )
    }

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff']

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Progress & Analytics</h1>

                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">89.2</div>
                                    <div className="flex items-center text-xs text-green-600">
                                        <ArrowUp className="h-3 w-3 mr-1" />
                                        +5.2% from last month
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">77</div>
                                    <div className="flex items-center text-xs text-blue-600">
                                        <ArrowUp className="h-3 w-3 mr-1" />
                                        +8 this month
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Strongest Skill</CardTitle>
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Data Structures</div>
                                    <div className="text-xs text-muted-foreground">98% average score</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Improvement Area</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">System Design</div>
                                    <div className="text-xs text-muted-foreground">Focus recommended</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Skill Trends Chart */}
                            <Card className="col-span-1">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Skill Trends Over Time</CardTitle>
                                            <CardDescription>Track your progress across different skill categories</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={chartType === 'line' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setChartType('line')}
                                            >
                                                <TrendingUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant={chartType === 'bar' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setChartType('bar')}
                                            >
                                                <BarChart3 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {['Frontend', 'Backend', 'System Design', 'Data Structures', 'Algorithms', 'Communication'].map((domain, index) => (
                                            <Button
                                                key={domain}
                                                variant={selectedDomains.includes(domain) ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => toggleDomain(domain)}
                                                className="text-xs"
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full mr-2"
                                                    style={{ backgroundColor: colors[index] }}
                                                />
                                                {domain}
                                            </Button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        {chartType === 'line' ? (
                                            <LineChart data={getFilteredData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip />
                                                <Legend />
                                                {selectedDomains.map((domain, index) => (
                                                    <Line
                                                        key={domain}
                                                        type="monotone"
                                                        dataKey={domain}
                                                        stroke={colors[index]}
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                    />
                                                ))}
                                            </LineChart>
                                        ) : (
                                            <BarChart data={getFilteredData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip />
                                                <Legend />
                                                {selectedDomains.map((domain, index) => (
                                                    <Bar
                                                        key={domain}
                                                        dataKey={domain}
                                                        fill={colors[index]}
                                                    />
                                                ))}
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Radar Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Skill Breakdown</CardTitle>
                                    <CardDescription>Radar view of your skill levels compared to previous period</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={mockRadarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                                            <PolarRadiusAxis domain={[0, 100]} tick={false} />
                                            <Radar
                                                name="Current"
                                                dataKey="current"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.3}
                                                strokeWidth={2}
                                            />
                                            <Radar
                                                name="Previous"
                                                dataKey="previous"
                                                stroke="#82ca9d"
                                                fill="#82ca9d"
                                                fillOpacity={0.2}
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                            />
                                            <Legend />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Domain Comparison */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Domain Comparison</CardTitle>
                                <CardDescription>Compare your performance across different domains</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {mockComparisonData.map((domain) => (
                                        <div key={domain.domain} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{domain.domain}</h4>
                                                {getTrendIcon(domain.current - domain.previous)}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Current Score</span>
                                                    <span className={`font-medium ${getScoreColor(domain.current)}`}>
                                                        {domain.current}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Sessions</span>
                                                    <span className="text-sm">{domain.sessions}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Improvement</span>
                                                    <span className={`text-sm ${domain.current > domain.previous ? 'text-green-600' : 'text-red-600'}`}>
                                                        {domain.current > domain.previous ? '+' : ''}{domain.current - domain.previous}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Session History Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Session History</CardTitle>
                                <CardDescription>Your recent interview sessions and performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Date</th>
                                                <th className="text-left p-2">Domain</th>
                                                <th className="text-left p-2">Type</th>
                                                <th className="text-left p-2">Score</th>
                                                <th className="text-left p-2">Duration</th>
                                                <th className="text-left p-2">Questions</th>
                                                <th className="text-left p-2">Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockSessionHistory.map((session) => (
                                                <tr key={session.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {new Date(session.date).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <Badge variant="outline">{session.domain}</Badge>
                                                    </td>
                                                    <td className="p-2">{session.type}</td>
                                                    <td className="p-2">
                                                        <span className={`font-medium ${getScoreColor(session.score)}`}>
                                                            {session.score}%
                                                        </span>
                                                    </td>
                                                    <td className="p-2">{session.duration}</td>
                                                    <td className="p-2">{session.questions}</td>
                                                    <td className="p-2">
                                                        <div className="flex items-center gap-1">
                                                            {getTrendIcon(session.improvement)}
                                                            <span className="text-sm">
                                                                {session.improvement > 0 ? '+' : ''}{session.improvement}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Recommendations</CardTitle>
                                <CardDescription>Personalized suggestions to improve your skills</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {mockRecommendations.map((rec, index) => (
                                        <div key={index} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex items-start justify-between">
                                                <h4 className="font-medium">{rec.title}</h4>
                                                <Badge className={getPriorityColor(rec.priority)}>
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-muted-foreground">
                                                        Difficulty: <span className="font-medium">{rec.difficulty}</span>
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        Time: <span className="font-medium">{rec.estimatedTime}</span>
                                                    </span>
                                                </div>
                                                <Badge variant="outline">{rec.category}</Badge>
                                            </div>
                                            <Button size="sm" className="w-full mt-2">
                                                Start Learning
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Progress