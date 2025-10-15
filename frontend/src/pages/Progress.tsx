import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/useAuthContext'
import { useProgressData } from '@/hooks/useProgress'
import {
    TrendingUp,
    Target,
    Award,
    Calendar,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Minus,
    Loader2,
    AlertCircle
} from 'lucide-react'

// Mock data - in a real app, this would come from your API
// This will be replaced with real data from useProgressData hook

const Progress = () => {
    const { user } = useAuth();
    const { data: progressData, isLoading, error, refetch } = useProgressData(user?.id);

    const [selectedDomains, setSelectedDomains] = useState<string[]>(['Frontend', 'Backend', 'System Design'])
    const [chartType, setChartType] = useState<'line' | 'bar'>('line')
    const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m')

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-card border-b border-border px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-foreground">Progress & Analytics</h1>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading your progress analytics...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">

                    <main className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2">Failed to load progress data</h2>
                            <p className="text-muted-foreground mb-4">
                                {error instanceof Error ? error.message : 'Something went wrong'}
                            </p>
                            <Button onClick={() => refetch()}>
                                Try Again
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Use progress data or fallback to default values
    const {
        stats = {
            overallScore: 0,
            overallImprovement: 0,
            totalSessions: 0,
            sessionGrowth: 0,
            strongestSkill: 'No data yet',
            strongestSkillScore: 0,
            improvementArea: 'Complete your first interview'
        },
        skillTrends = [],
        radarData = [],
        sessionHistory = [],
        domainComparison = [],
        recommendations = []
    } = progressData || {};

    const getFilteredData = () => {
        const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
        return skillTrends.slice(-months)
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
                <Navbar />
                {/* Header */}


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
                                    <div className="text-2xl font-bold">{stats.overallScore}</div>
                                    <div className={`flex items-center text-xs ${stats.overallImprovement > 0 ? 'text-green-600' : stats.overallImprovement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {stats.overallImprovement > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> :
                                            stats.overallImprovement < 0 ? <ArrowDown className="h-3 w-3 mr-1" /> :
                                                <Minus className="h-3 w-3 mr-1" />}
                                        {stats.overallImprovement > 0 ? '+' : ''}{stats.overallImprovement}% from last month
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalSessions}</div>
                                    <div className={`flex items-center text-xs ${stats.sessionGrowth > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {stats.sessionGrowth > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                                        {stats.sessionGrowth > 0 ? '+' : ''}{stats.sessionGrowth} this month
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Strongest Skill</CardTitle>
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.strongestSkill}</div>
                                    <div className="text-xs text-muted-foreground">{stats.strongestSkillScore}% average score</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Improvement Area</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.improvementArea}</div>
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
                                        <div className="flex items-center gap-2 mr-4">
                                            <span className="text-xs text-muted-foreground">Time Range:</span>
                                            <Button
                                                variant={timeRange === '3m' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setTimeRange('3m')}
                                                className="text-xs"
                                            >
                                                3M
                                            </Button>
                                            <Button
                                                variant={timeRange === '6m' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setTimeRange('6m')}
                                                className="text-xs"
                                            >
                                                6M
                                            </Button>
                                            <Button
                                                variant={timeRange === '1y' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setTimeRange('1y')}
                                                className="text-xs"
                                            >
                                                1Y
                                            </Button>
                                        </div>
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
                                        <RadarChart data={radarData}>
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
                                    {domainComparison.map((domain) => (
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
                                            {sessionHistory.map((session) => (
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
                                    {recommendations.map((rec, index) => (
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