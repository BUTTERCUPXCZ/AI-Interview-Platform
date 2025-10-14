import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Home,
    Users,
    FileText,
    BarChart3,
} from 'lucide-react'

interface SidebarProps {
    className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
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

    const handleNavigation = (href: string) => {
        navigate(href)
    }

    return (
        <div className={cn(
            "flex h-full w-64 flex-col bg-card border-r border-border",
            className
        )}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2 font-semibold">
                    <span className="text-lg">AI Interview</span>
                </div>


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

                </nav>
            </div>
        </div>
    )
}

export default Sidebar