import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLogout } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'
import {
    User,
    Lock,
    Bell,
    Shield,
    Settings,
    LogOut,
    Save,
    Eye,
    EyeOff,
    Star,
    Crown
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Switch } from '../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Separator } from '../components/ui/separator'

interface UserProfile {
    firstName: string
    lastName: string
    email: string
    experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
    skillTags: string[]
    bio: string
}

interface NotificationSettings {
    emailNotifications: boolean
    pushNotifications: boolean
    interviewReminders: boolean
    weeklyReports: boolean
    marketingEmails: boolean
}

interface AccountSettings {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

const ProfilePage = () => {
    const { user } = useAuth()
    const logout = useLogout()

    // Profile state
    const [profile, setProfile] = useState<UserProfile>({
        firstName: user?.Firstname || '',
        lastName: user?.Lastname || '',
        email: user?.email || '',
        experienceLevel: 'Intermediate',
        skillTags: ['JavaScript', 'React', 'Node.js'],
        bio: 'Passionate developer looking to improve my interview skills and land my dream job.'
    })

    // Notification settings state
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: false,
        interviewReminders: true,
        weeklyReports: true,
        marketingEmails: false
    })

    // Account settings state
    const [accountSettings, setAccountSettings] = useState<AccountSettings>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [newSkillTag, setNewSkillTag] = useState('')

    // Available skill tags
    const availableSkills = [
        'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python',
        'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
        'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
        'Git', 'Agile', 'Scrum', 'System Design', 'Algorithms', 'Data Structures'
    ]

    // Handlers
    const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const handleNotificationUpdate = (field: keyof NotificationSettings, value: boolean) => {
        setNotifications(prev => ({ ...prev, [field]: value }))
    }

    const handleAddSkillTag = () => {
        if (newSkillTag && !profile.skillTags.includes(newSkillTag)) {
            handleProfileUpdate('skillTags', [...profile.skillTags, newSkillTag])
            setNewSkillTag('')
        }
    }

    const handleRemoveSkillTag = (skill: string) => {
        handleProfileUpdate('skillTags', profile.skillTags.filter(s => s !== skill))
    }

    const handleSaveProfile = async () => {
        setIsLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsLoading(false)
        // Show success message
    }

    const handleSaveNotifications = async () => {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsLoading(false)
    }

    const handlePasswordChange = async () => {
        if (accountSettings.newPassword !== accountSettings.confirmPassword) {
            alert('New passwords do not match')
            return
        }
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsLoading(false)
        setAccountSettings({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }

    const handleLogout = () => {
        logout.mutate()
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                    <div className="container mx-auto py-6 px-6 space-y-6 ml-6 mr-20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile & Settings</h1>
                                <p className="text-muted-foreground">
                                    Manage your account settings and preferences
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="gap-2">
                                    <Crown className="h-4 w-4" />
                                    Upgrade to Pro
                                </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="profile" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="profile" className="gap-2">
                                    <User className="h-4 w-4" />
                                    Profile
                                </TabsTrigger>
                                <TabsTrigger value="account" className="gap-2">
                                    <Shield className="h-4 w-4" />
                                    Account
                                </TabsTrigger>
                                <TabsTrigger value="notifications" className="gap-2">
                                    <Bell className="h-4 w-4" />
                                    Notifications
                                </TabsTrigger>
                                <TabsTrigger value="preferences" className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    Preferences
                                </TabsTrigger>
                            </TabsList>

                            {/* Profile Tab */}
                            <TabsContent value="profile" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>
                                            Update your personal details and experience level
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={profile.firstName}
                                                    onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    value={profile.lastName}
                                                    onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => handleProfileUpdate('email', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="experience">Experience Level</Label>
                                            <Select
                                                value={profile.experienceLevel}
                                                onValueChange={(value) => handleProfileUpdate('experienceLevel', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select experience level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                                    <SelectItem value="Expert">Expert</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bio">Bio</Label>
                                            <textarea
                                                id="bio"
                                                className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                                value={profile.bio}
                                                onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Skills & Interests</CardTitle>
                                        <CardDescription>
                                            Add skills and areas you want to focus on during interviews
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Select value={newSkillTag} onValueChange={setNewSkillTag}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select a skill to add" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSkills
                                                        .filter(skill => !profile.skillTags.includes(skill))
                                                        .map(skill => (
                                                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleAddSkillTag} disabled={!newSkillTag}>
                                                Add Skill
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {profile.skillTags.map(skill => (
                                                <div
                                                    key={skill}
                                                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                                                >
                                                    <span>{skill}</span>
                                                    <button
                                                        onClick={() => handleRemoveSkillTag(skill)}
                                                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Account Tab */}
                            <TabsContent value="account" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Change Password</CardTitle>
                                        <CardDescription>
                                            Update your password to keep your account secure
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="currentPassword"
                                                    type={showPasswords.current ? "text" : "password"}
                                                    value={accountSettings.currentPassword}
                                                    onChange={(e) => setAccountSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                                >
                                                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={showPasswords.new ? "text" : "password"}
                                                    value={accountSettings.newPassword}
                                                    onChange={(e) => setAccountSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                                >
                                                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmPassword"
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    value={accountSettings.confirmPassword}
                                                    onChange={(e) => setAccountSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                >
                                                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <Button onClick={handlePasswordChange} disabled={isLoading} className="gap-2">
                                            <Lock className="h-4 w-4" />
                                            {isLoading ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Subscription</CardTitle>
                                        <CardDescription>
                                            Manage your subscription and billing preferences
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Star className="h-5 w-5 text-yellow-500" />
                                                <div>
                                                    <p className="font-medium">Free Plan</p>
                                                    <p className="text-sm text-muted-foreground">5 interviews per month</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="gap-2">
                                                <Crown className="h-4 w-4" />
                                                Upgrade to Pro
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Notifications Tab */}
                            <TabsContent value="notifications" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Notification Preferences</CardTitle>
                                        <CardDescription>
                                            Choose how and when you want to be notified
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Email Notifications</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive notifications via email
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailNotifications}
                                                onCheckedChange={(checked) => handleNotificationUpdate('emailNotifications', checked)}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Push Notifications</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive push notifications in your browser
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.pushNotifications}
                                                onCheckedChange={(checked) => handleNotificationUpdate('pushNotifications', checked)}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Interview Reminders</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Get reminded about upcoming interview sessions
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.interviewReminders}
                                                onCheckedChange={(checked) => handleNotificationUpdate('interviewReminders', checked)}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Weekly Reports</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive weekly progress reports
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.weeklyReports}
                                                onCheckedChange={(checked) => handleNotificationUpdate('weeklyReports', checked)}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Marketing Emails</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive updates about new features and tips
                                                </p>
                                            </div>
                                            <Switch
                                                checked={notifications.marketingEmails}
                                                onCheckedChange={(checked) => handleNotificationUpdate('marketingEmails', checked)}
                                            />
                                        </div>

                                        <Button onClick={handleSaveNotifications} disabled={isLoading} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {isLoading ? 'Saving...' : 'Save Preferences'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent value="preferences" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Account Actions</CardTitle>
                                        <CardDescription>
                                            Manage your account and data
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                                            <div>
                                                <p className="font-medium">Sign Out</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Sign out of your account on this device
                                                </p>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                onClick={handleLogout}
                                                disabled={logout.isPending}
                                                className="gap-2"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                {logout.isPending ? 'Signing out...' : 'Sign Out'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default ProfilePage