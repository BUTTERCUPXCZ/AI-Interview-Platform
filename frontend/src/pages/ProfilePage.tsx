import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/useAuthContext'
import { useLogout } from '@/hooks/useAuth'
import {
    useUserProfile,
    useUpdateProfile,
    useUpdateNotifications,
    useChangePassword,
    useUpdateSkills
} from '@/hooks/useProfile'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
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
    Crown,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UserProfile {
    firstName: string
    lastName: string
    email: string
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
    skillTags: string[]
    bio: string
    phoneNumber: string
    location: string
    linkedinProfile: string
    githubProfile: string
    portfolioWebsite: string
    timezone: string
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

    // Database hooks
    const { data: profileData, isLoading: profileLoading, error: profileError } = useUserProfile(user?.id)
    const updateProfileMutation = useUpdateProfile()
    const updateNotificationsMutation = useUpdateNotifications()
    const changePasswordMutation = useChangePassword()
    const updateSkillsMutation = useUpdateSkills()

    // Local state for form management
    const [profile, setProfile] = useState<UserProfile>({
        firstName: '',
        lastName: '',
        email: '',
        experienceLevel: 'INTERMEDIATE',
        skillTags: [],
        bio: '',
        phoneNumber: '',
        location: '',
        linkedinProfile: '',
        githubProfile: '',
        portfolioWebsite: '',
        timezone: 'UTC'
    })

    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: false,
        interviewReminders: true,
        weeklyReports: true,
        marketingEmails: false
    })

    const [accountSettings, setAccountSettings] = useState<AccountSettings>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // UI state
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [newSkillTag, setNewSkillTag] = useState('')
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Update local state when profile data loads
    useEffect(() => {
        if (profileData) {
            setProfile({
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                email: profileData.email || '',
                experienceLevel: profileData.experienceLevel as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
                skillTags: profileData.skillTags || [],
                bio: profileData.bio || '',
                phoneNumber: profileData.phoneNumber || '',
                location: profileData.location || '',
                linkedinProfile: profileData.linkedinProfile || '',
                githubProfile: profileData.githubProfile || '',
                portfolioWebsite: profileData.portfolioWebsite || '',
                timezone: profileData.timezone || 'UTC'
            })
            setNotifications({
                emailNotifications: profileData.emailNotifications,
                pushNotifications: profileData.pushNotifications,
                interviewReminders: profileData.interviewReminders,
                weeklyReports: profileData.weeklyReports,
                marketingEmails: profileData.marketingEmails
            })
        }
    }, [profileData])

    // Available skill tags
    const availableSkills = [
        'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python',
        'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
        'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
        'Git', 'Agile', 'Scrum', 'System Design', 'Algorithms', 'Data Structures'
    ]

    // Handlers
    const handleProfileUpdate = (field: keyof UserProfile, value: string | string[]) => {
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
        if (!user?.id) return

        try {
            setSaveError(null)
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                data: {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    bio: profile.bio,
                    experienceLevel: profile.experienceLevel,
                    phoneNumber: profile.phoneNumber,
                    location: profile.location,
                    linkedinProfile: profile.linkedinProfile,
                    githubProfile: profile.githubProfile,
                    portfolioWebsite: profile.portfolioWebsite,
                    timezone: profile.timezone
                }
            })
            setSaveSuccess('Profile updated successfully!')
            setTimeout(() => setSaveSuccess(null), 3000)
        } catch {
            setSaveError('Failed to update profile. Please try again.')
            setTimeout(() => setSaveError(null), 5000)
        }
    }

    const handleSaveSkills = async () => {
        if (!user?.id) return

        try {
            setSaveError(null)
            await updateSkillsMutation.mutateAsync({
                userId: user.id,
                data: { skillTags: profile.skillTags }
            })
            setSaveSuccess('Skills updated successfully!')
            setTimeout(() => setSaveSuccess(null), 3000)
        } catch {
            setSaveError('Failed to update skills. Please try again.')
            setTimeout(() => setSaveError(null), 5000)
        }
    }

    const handleSaveNotifications = async () => {
        if (!user?.id) return

        try {
            setSaveError(null)
            await updateNotificationsMutation.mutateAsync({
                userId: user.id,
                data: notifications
            })
            setSaveSuccess('Notification settings updated successfully!')
            setTimeout(() => setSaveSuccess(null), 3000)
        } catch {
            setSaveError('Failed to update notification settings. Please try again.')
            setTimeout(() => setSaveError(null), 5000)
        }
    }

    const handlePasswordChange = async () => {
        if (!user?.id) return

        if (accountSettings.newPassword !== accountSettings.confirmPassword) {
            setSaveError('New passwords do not match')
            setTimeout(() => setSaveError(null), 5000)
            return
        }

        if (accountSettings.newPassword.length < 6) {
            setSaveError('Password must be at least 6 characters long')
            setTimeout(() => setSaveError(null), 5000)
            return
        }

        try {
            setSaveError(null)
            await changePasswordMutation.mutateAsync({
                userId: user.id,
                data: {
                    currentPassword: accountSettings.currentPassword,
                    newPassword: accountSettings.newPassword
                }
            })
            setAccountSettings({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setSaveSuccess('Password changed successfully!')
            setTimeout(() => setSaveSuccess(null), 3000)
        } catch {
            setSaveError('Failed to change password. Please check your current password.')
            setTimeout(() => setSaveError(null), 5000)
        }
    }

    const handleLogout = () => {
        logout.mutate()
    }

    // Show loading state
    if (profileLoading) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Loading profile...</span>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (profileError) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Alert className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load profile data. Please refresh the page or try again later.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                    <div className="container mx-auto py-6 px-6 space-y-6 ml-6 mr-20">

                        {/* Success/Error Messages */}
                        {saveSuccess && (
                            <Alert className="border-green-200 bg-green-50 text-green-800">
                                <AlertDescription>{saveSuccess}</AlertDescription>
                            </Alert>
                        )}
                        {saveError && (
                            <Alert className="border-red-200 bg-red-50 text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{saveError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="flex items-center justify-between mr-8">
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

                        <Tabs defaultValue="profile" className="space-y-4 mr-8">
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
                                                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                                                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                                                    <SelectItem value="EXPERT">Expert</SelectItem>
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                                <Input
                                                    id="phoneNumber"
                                                    value={profile.phoneNumber}
                                                    onChange={(e) => handleProfileUpdate('phoneNumber', e.target.value)}
                                                    placeholder="Enter your phone number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location</Label>
                                                <Input
                                                    id="location"
                                                    value={profile.location}
                                                    onChange={(e) => handleProfileUpdate('location', e.target.value)}
                                                    placeholder="City, Country"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                                            <Input
                                                id="linkedinProfile"
                                                value={profile.linkedinProfile}
                                                onChange={(e) => handleProfileUpdate('linkedinProfile', e.target.value)}
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="githubProfile">GitHub Profile</Label>
                                                <Input
                                                    id="githubProfile"
                                                    value={profile.githubProfile}
                                                    onChange={(e) => handleProfileUpdate('githubProfile', e.target.value)}
                                                    placeholder="https://github.com/username"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="portfolioWebsite">Portfolio Website</Label>
                                                <Input
                                                    id="portfolioWebsite"
                                                    value={profile.portfolioWebsite}
                                                    onChange={(e) => handleProfileUpdate('portfolioWebsite', e.target.value)}
                                                    placeholder="https://yourportfolio.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select
                                                value={profile.timezone}
                                                onValueChange={(value) => handleProfileUpdate('timezone', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC</SelectItem>
                                                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                                    <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                                                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
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

                                        <Button onClick={handleSaveSkills} disabled={updateSkillsMutation.isPending} className="gap-2 mt-4">
                                            <Save className="h-4 w-4" />
                                            {updateSkillsMutation.isPending ? 'Saving...' : 'Save Skills'}
                                        </Button>
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

                                        <Button onClick={handlePasswordChange} disabled={changePasswordMutation.isPending} className="gap-2">
                                            <Lock className="h-4 w-4" />
                                            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
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

                                        <Button onClick={handleSaveNotifications} disabled={updateNotificationsMutation.isPending} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
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