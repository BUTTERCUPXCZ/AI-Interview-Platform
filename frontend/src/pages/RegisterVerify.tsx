import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Field, FieldGroup, FieldDescription } from '../components/ui/field'
import { cn } from '../lib/utils'
import { sendVerification } from '../api/auth'

const RegisterVerify = () => {
  const location = useLocation()
  const email = location.state?.email || ''
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleResend = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'No email address found. Please register again.' })
      return
    }

    setIsResending(true)
    setMessage(null)

    try {
      await sendVerification(email)
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold text-[#00e676]">AceDevAI</h1>
          <p className="text-white/70">Verify your email</p>
        </div>

        <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00e676]/10 border border-[#00e676]/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-8 w-8 text-[#00e676]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <CardTitle className="text-xl text-white">Check your email</CardTitle>
            <CardDescription className="text-white/70">
              We've sent a verification link to{' '}
              {email ? (
                <span className="font-semibold text-[#00e676]">{email}</span>
              ) : (
                'your email address'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div
                className={cn(
                  'mb-4 p-3 text-sm text-center text-white rounded-md',
                  message.type === 'error'
                    ? 'bg-red-500/20 border border-red-500/50'
                    : 'bg-green-500/20 border border-green-500/50'
                )}
              >
                {message.text}
              </div>
            )}

            <FieldGroup>
              <Field>
                <div className="rounded-md bg-white/5 border border-white/10 p-4 text-sm text-white/80">
                  <p className="mb-2">📧 Please check your email inbox</p>
                  <p className="mb-2">📂 Check your spam folder if you don't see it</p>
                  <p>🔗 Click the verification link to activate your account</p>
                </div>
              </Field>

              <Field>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/10 hover:bg-[#00e676]/10 hover:border-[#00e676]/50 text-white"
                  onClick={handleResend}
                  disabled={isResending || !email}
                >
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </Button>
              </Field>

              <Field>
                <FieldDescription className="text-center text-white/70">
                  Already verified?{' '}
                  <Link
                    to="/login"
                    className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80"
                  >
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <FieldDescription className="px-6 text-center text-white/60">
          Need help?{' '}
          <a
            href="#"
            className="underline underline-offset-4 hover:no-underline text-[#00e676] hover:text-[#00e676]/80"
          >
            Contact support
          </a>
        </FieldDescription>
      </div>
    </div>
  )
}

export default RegisterVerify