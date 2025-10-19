import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription
} from '../components/ui/field'
import { cn } from '../lib/utils'
import { requestPasswordReset, resetPassword } from '../api/auth'

type ForgotPasswordFormProps = React.ComponentProps<"div">

function ForgotPasswordForm({ className, ...props }: ForgotPasswordFormProps) {
    const navigate = useNavigate();

    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        setIsSubmitting(true)

        try {
            await requestPasswordReset(email)

            setMessage({ type: 'success', text: 'OTP has been sent to your email. Please check your inbox.' })
            setStep('otp')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.'
            setMessage({
                type: 'error',
                text: errorMessage
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (otp.length !== 6) {
            setMessage({
                type: 'error',
                text: 'Please enter a valid 6-digit OTP.'
            })
            return
        }

        setMessage({ type: 'success', text: 'OTP verified! Please set your new password.' })
        setStep('password')
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (newPassword !== confirmPassword) {
            setMessage({
                type: 'error',
                text: 'Passwords do not match.'
            })
            return
        }

        if (newPassword.length < 6) {
            setMessage({
                type: 'error',
                text: 'Password must be at least 6 characters long.'
            })
            return
        }

        setIsSubmitting(true)

        try {
            await resetPassword(email, otp, newPassword)

            setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' })
            
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please try again.'
            setMessage({
                type: 'error',
                text: errorMessage
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        
        if (name === 'email') setEmail(value)
        if (name === 'otp') setOtp(value)
        if (name === 'newPassword') setNewPassword(value)
        if (name === 'confirmPassword') setConfirmPassword(value)
        
        // Clear message when user starts typing
        if (message) setMessage(null)
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl text-white">Forgot Password</CardTitle>
                    <CardDescription className="text-white/70 ml-1">
                        {step === 'email' 
                            ? "Enter your email address and we'll send you an OTP to reset your password"
                            : step === 'otp'
                            ? "Enter the OTP sent to your email"
                            : "Set your new password"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {message && (
                        <div className={cn(
                            "mb-4 p-3 text-sm text-center text-white rounded-md",
                            message.type === 'error' 
                                ? "bg-red-500/20 border border-red-500/50"
                                : "bg-green-500/20 border border-green-500/50"
                        )}>
                            {message.text}
                        </div>
                    )}
                    
                    {step === 'email' ? (
                        <form onSubmit={handleEmailSubmit}>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="email" className="text-white">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]"
                                    />
                                </Field>
                                <Field>
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#00e676] hover:bg-[#02cb6a] text-black font-semibold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Reset OTP'}
                                    </Button>
                                    <FieldDescription className="text-center text-white/70">
                                        Remember your password?{' '}
                                        <Link to="/login" className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80">
                                            Back to login
                                        </Link>
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </form>
                    ) : step === 'otp' ? (
                        <form onSubmit={handleOtpSubmit}>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="otp" className="text-white">OTP Code</FieldLabel>
                                    <Input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        maxLength={6}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]"
                                    />
                                </Field>
                                <Field>
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#00e676] hover:bg-[#02cb6a] text-black font-semibold"
                                        disabled={isSubmitting}
                                    >
                                        Verify OTP
                                    </Button>
                                    <FieldDescription className="text-center text-white/70">
                                        <button 
                                            type="button"
                                            onClick={() => setStep('email')}
                                            className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80"
                                        >
                                            Back to email
                                        </button>
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit}>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="newPassword" className="text-white">New Password</FieldLabel>
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="confirmPassword" className="text-white">Confirm Password</FieldLabel>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]"
                                    />
                                </Field>
                                <Field>
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#00e676] hover:bg-[#02cb6a] text-black font-semibold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                    </Button>
                                    <FieldDescription className="text-center text-white/70">
                                        <button 
                                            type="button"
                                            onClick={() => setStep('otp')}
                                            className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80"
                                        >
                                            Back to OTP
                                        </button>
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </form>
                    )}
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

const ForgotPassword = () => {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-3xl font-bold text-[#00e676]">AceDevAI</h1>
                    <p className="text-white/70">Reset your password</p>
                </div>
                <ForgotPasswordForm />
            </div>
        </div>
    )
}

export default ForgotPassword