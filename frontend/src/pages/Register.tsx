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
import { useRegister } from '../hooks/useAuth'

type RegisterFormProps = React.ComponentProps<"div">

function RegisterForm({ className, ...props }: RegisterFormProps) {
    const navigate = useNavigate();
    const registerMutation = useRegister();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    const [errors, setErrors] = useState<string>('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors('')

        // Client-side validation
        if (formData.password !== formData.confirmPassword) {
            setErrors('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setErrors('Password must be at least 6 characters long')
            return
        }

        try {
            await registerMutation.mutateAsync({
                Firstname: formData.firstName,
                Lastname: formData.lastName,
                email: formData.email,
                password: formData.password
            })
            // Redirect to dashboard or home page after successful registration
            navigate('/dashboard') // You can change this to your desired route
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
            setErrors(errorMessage)
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
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create your account</CardTitle>
                    <CardDescription>
                        Sign up with your Apple or Google account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {errors && (
                        <div className="mb-4 p-3 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {errors}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <Button variant="outline" type="button" className="w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Sign up with Google
                                </Button>
                            </Field>
                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                Or continue with
                            </FieldSeparator>
                            <Field>
                                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    disabled={registerMutation.isPending}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={registerMutation.isPending}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={registerMutation.isPending}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={registerMutation.isPending}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    disabled={registerMutation.isPending}
                                    required
                                />
                            </Field>
                            <Field>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={registerMutation.isPending}
                                >
                                    {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                                </Button>
                                <FieldDescription className="text-center">
                                    Already have an account?{' '}
                                    <Link to="/login" className="underline underline-offset-4 hover:no-underline">
                                        Sign in
                                    </Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our{' '}
                <a href="#" className="underline underline-offset-4 hover:no-underline">
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-4 hover:no-underline">
                    Privacy Policy
                </a>
                .
            </FieldDescription>
        </div>
    )
}

const Register = () => {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <RegisterForm />
            </div>
        </div>
    )
}

export default Register