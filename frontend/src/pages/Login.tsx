import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription,
    FieldSeparator
} from '../components/ui/field'
import { cn } from '../lib/utils'
import { useLogin } from '../hooks/useAuth'


type LoginFormProps = React.ComponentProps<"div">

// Narrow an Axios-like error shape for safe access without using `any`
const isAxiosErrorWithData = (
    err: unknown
): err is { response: { status?: number; data?: { code?: string; message?: string } } } => {
    if (typeof err !== 'object' || err === null) return false;
    const obj = err as Record<string, unknown>;
    if (!('response' in obj)) return false;
    const resp = obj['response'];
    if (typeof resp !== 'object' || resp === null) return false;
    const respObj = resp as Record<string, unknown>;
    // response may or may not include data, but response itself must be an object
    if (!('data' in respObj) && !('status' in respObj)) return true;
    const data = respObj['data'];
    if (data === undefined) return true;
    return typeof data === 'object' && data !== null;
}

function LoginForm({ className, ...props }: LoginFormProps) {
    const navigate = useNavigate();
    const loginMutation = useLogin();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const [errors, setErrors] = useState<string>('')
    const [needsVerification, setNeedsVerification] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors('')
        setNeedsVerification(false)

        try {
            await loginMutation.mutateAsync(formData)
            // Redirect to dashboard or home page after successful login
            navigate('/dashboard') // You can change this to your desired route
        } catch (err: unknown) {
            // Handle Axios-like responses with data
            if (isAxiosErrorWithData(err)) {
                const data = err.response.data ?? {};

                // Email-not-verified special handling
                if (data.code === 'EMAIL_NOT_VERIFIED') {
                    setNeedsVerification(true);
                    setErrors(data.message || 'Please verify your email before logging in.');
                    return;
                }

                // If backend indicates invalid credentials (401) or message contains 'invalid email' treat it as credential error
                const status = err.response.status;
                if (status === 401 || (typeof data.message === 'string' && /invalid email/i.test(data.message))) {
                    setErrors('Invalid email and password');
                    return;
                }

                // If backend provided a message, show it
                if (data.message) {
                    setErrors(String(data.message));
                    return;
                }
            }

            // Fallback error message
            const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
            setErrors(errorMessage);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear errors when user starts typing
        if (errors) setErrors('')
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl text-white">Welcome back</CardTitle>
                    <CardDescription className="text-white/70 ml-1">
                        Login with your Google account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {errors && (
                        <div className="mb-4 p-3 text-sm text-center text-white bg-red-500/20 border border-red-500/50 rounded-md">
                            {errors}
                            {needsVerification && (
                                <div className="mt-2">
                                    <Link 
                                        to="/register-verify" 
                                        state={{ email: formData.email }}
                                        className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80 font-semibold"
                                    >
                                        Resend verification email
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <Button variant="outline" type="button" className="w-full border-white/10 hover:bg-[#00e676]/10 hover:border-[#00e676]/50 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Login with Google
                                </Button>
                            </Field>
                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card *:data-[slot=field-separator-content]:text-white/60">
                                Or continue with
                            </FieldSeparator>
                            <Field>
                                <FieldLabel htmlFor="email" className="text-white">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={loginMutation.isPending}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]"
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password" className="text-white">Password</FieldLabel>
                                    <Link
                                        to="/forgot-password"
                                        className="ml-auto text-sm underline-offset-4 hover:underline text-[#00e676] hover:text-[#00e676]/80"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={loginMutation.isPending}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]"
                                />
                            </Field>
                            <Field>
                                <Button
                                    type="submit"
                                    className="w-full bg-[#00e676] hover:bg-[#02cb6a] text-black font-semibold"
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                                </Button>
                                <FieldDescription className="text-center text-white/70">
                                    Don&apos;t have an account?{' '}
                                    <Link to="/register" className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80">
                                        Sign up
                                    </Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center text-white/60">
                By clicking continue, you agree to our{' '}
                <a href="#" className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80">
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80">
                    Privacy Policy
                </a>
                .
            </FieldDescription>
        </div>
    )
}

const Login = () => {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-3xl font-bold text-[#00e676]">AceDev<span className="text-white">AI</span></h1>
                    <p className="text-white/70">Sign in to continue your journey</p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}

export default Login