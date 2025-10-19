import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuthContext'
import { useLogout } from '../hooks/useAuth'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { LogOut } from 'lucide-react'

const Navbar = () => {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuth()

    const logout = useLogout()

    const handleLogout = async () => {
        try {
            await logout.mutateAsync()
            navigate('/login')
        } catch (error) {
            console.error('Logout failed:', error)
            // Even if logout fails on server, navigate to login
            navigate('/login')
        }
    }



    if (!isAuthenticated || !user) {
        return null
    }

    return (
        <nav className="bg-card border-b border-border sticky top-0 z-50">
            <div className="w-full flex items-center justify-between px-6 py-4">
                {/* Left Side - Logo */}
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="flex items-center">
                        <span className="text-2xl font-bold text-foreground">
                           
                        </span>
                    </a>
                </div>

                {/* Right Side - Theme Toggle and Avatar */}
                <div className="flex items-center gap-3">

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-10 w-10 rounded-full p-0 hover:opacity-80 transition-opacity"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="/avatars/user.png" alt={user.Firstname} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user.Firstname?.[0]?.toUpperCase()}{user.Lastname?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user.Firstname} {user.Lastname}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    )
}

export default Navbar