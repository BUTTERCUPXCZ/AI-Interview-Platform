import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useTheme } from '@/components/theme-provider'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Home,
    Users,
    Settings,
    FileText,
    BarChart3,
    ChevronDown,
    LogOut,
    User,
    Mail,
    Calendar,
    Database,
    Shield,
    Bell,
    Sun,
    Moon
} from 'lucide-react'

interface SidebarProps {
    className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({})
    const { theme, setTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: Home,
            current: location.pathname === '/dashboard'
        },
        {
            name: 'Interview Setup',
            href: '/interview-setup',
            icon: Users,
            current: location.pathname === '/interview-setup'
        },
        {
            name: 'Progress & Analytics Page',
            href: '/progress',
            icon: BarChart3,
            current: location.pathname === '/progress'
        },
        {
            name: 'Profile',
            href: '/profile',
            icon: FileText,
            current: location.pathname === '/profile'
        }
    ]


    const toggleSection = (sectionName: string) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }))
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    const handleNavigation = (href: string) => {
        navigate(href)
    }

    return (
        <div className={cn(
            "flex h-full w-64 flex-col bg-card border-r border-border",
            className
        )}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <div className="flex items-center gap-2 font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Database className="h-4 w-4" />
                    </div>
                    <span className="text-lg">AI Interview</span>
                </div>

                {/* Theme Toggle Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-8 w-8 p-0"
                >
                    {theme === 'light' ? (
                        <Moon className="h-4 w-4" />
                    ) : (
                        <Sun className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
                <nav className="grid gap-1 p-4">
                    {/* Main Navigation */}
                    <div className="pb-2">
                        <h2 className="mb-2 px-2 text-sm font-semibold tracking-tight text-muted-foreground">
                            Main
                        </h2>
                        {navigation.map((item) => (
                            <Button
                                key={item.name}
                                variant={item.current ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2 h-9",
                                    item.current && "bg-secondary text-secondary-foreground"
                                )}
                                onClick={() => handleNavigation(item.href)}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Button>
                        ))}
                    </div>





                    <Separator className="my-2" />

                    {/* Additional Links */}
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => handleNavigation('/calendar')}>
                            <Calendar className="h-4 w-4" />
                            Calendar
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => handleNavigation('/notifications')}>
                            <Bell className="h-4 w-4" />
                            Notifications
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => handleNavigation('/settings')}>
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </nav>
            </div>

            {/* User Profile Section */}
            <div className="border-t border-border p-4">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt="User" />
                        <AvatarFallback>
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            John Doe
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            admin@example.com
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Logout</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Sidebar