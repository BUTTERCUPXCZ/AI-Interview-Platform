import React from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardData } from '@/hooks/useDashboard'
import {
    PlayCircle,
    Calendar,
    TrendingUp,
    Target,
    Trophy,
    BookOpen,
    Star,
    ArrowUpRight,
    Clock,
    Code,
    Database,
    Lightbulb,
    Award,
    BarChart3,
    Loader2,
    AlertCircle
} from 'lucide-react'

const Dashboard = () => {
    const { user } = useAuth();
    const { data: dashboardData, isLoading, error, refetch } = useDashboardData(user?.id);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar />
                    <main className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Fetching your performance data...</p>
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
                    <Navbar />
                    <header className="bg-card border-b border-border px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-foreground">Dashboard Error</h1>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold mb-2">Failed to load dashboard</h2>
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

    // Use dashboard data or fallback to default values
    const {
        profile = {
            name: 'User',
            email: user?.email || '',
            experienceLevel: 'Beginner',
            skillTags: [],
            joinDate: new Date().toISOString().split('T')[0]
        },
        stats = {
            averageScore: 0,
            totalSessions: 0,
            strongestSkill: 'No data yet',
            improvementArea: 'Complete your first interview',
            completionRate: 0,
            totalQuestionsAnswered: 0
        },
        recentSessions = [],
        skillScores = {},
        recommendedTopics = []
    } = dashboardData || {};

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
                    <div className="grid gap-6">

                        {/* Quick Stats Row */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Trophy className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Average Score</p>
                                        <p className="text-2xl font-bold">{stats.averageScore}%</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <Star className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Strongest Skill</p>
                                        <p className="text-sm font-medium">{stats.strongestSkill}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <Target className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Area to Improve</p>
                                        <p className="text-sm font-medium">{stats.improvementArea}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Main Grid */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left Column */}
                            <div className="space-y-6 lg:col-span-2">
                                {/* Recent Sessions */}
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Recent Sessions</h3>
                                        <Button variant="ghost" size="sm">
                                            View All
                                            <ArrowUpRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {recentSessions.map((session) => (
                                            <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Code className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{session.domain}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {session.date}
                                                            <Clock className="h-3 w-3 ml-2" />
                                                            {session.duration}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${session.score >= 80 ? 'text-green-500' : session.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        {session.score}%
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{session.questions} questions</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Progress Overview */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Skill Progress Overview</h3>
                                    <div className="space-y-4">
                                        {Object.entries(skillScores).map(([skill, score]) => (
                                            <div key={skill} className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">{skill}</span>
                                                    <span className="text-sm text-muted-foreground">{score}%</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-300 ${score >= 80 ? 'bg-green-500' :
                                                            score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Profile Summary */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Profile Summary</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src="/avatars/default.png" alt={profile.name} />
                                                <AvatarFallback>
                                                    {profile.name.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{profile.name}</p>
                                                <p className="text-sm text-muted-foreground">{profile.experienceLevel} Developer</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skillTags.map((skill: string) => (
                                                    <span key={skill} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-border">
                                            <p className="text-xs text-muted-foreground">
                                                Member since {new Date(profile.joinDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Recommended Topics */}
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                                        <h3 className="text-lg font-semibold">Recommended Topics</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {recommendedTopics.map((topic, index) => (
                                            <div key={index} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-sm">{topic.title}</h4>
                                                    <span className={`text-xs px-2 py-1 rounded-md ${topic.difficulty === 'Advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                        topic.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                        }`}>
                                                        {topic.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">{topic.description}</p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {topic.estimatedTime}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Dashboard