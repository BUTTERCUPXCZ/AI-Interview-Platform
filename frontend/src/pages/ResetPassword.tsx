import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Field, FieldGroup, FieldLabel } from '../components/ui/field'
import { requestPasswordReset, resetPassword } from '../api/auth'
import { cn } from '../lib/utils'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)
    try {
      await requestPasswordReset(email)
      setMessage({ type: 'success', text: 'If the email exists, an OTP has been sent.' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to request OTP' })
    } finally { setIsSubmitting(false) }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)
    try {
      await resetPassword(email, otp, newPassword)
      setMessage({ type: 'success', text: 'Password reset successful. Redirecting to login...' })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reset password' })
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold text-[#00e676]">Reset Password</h1>
          <p className="text-white/70">Request an OTP and reset your password</p>
        </div>
        <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Reset Password</CardTitle>
            <CardDescription className="text-white/70 ml-1">Enter your email to receive an OTP, then set a new password</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={cn(
                "mb-4 p-3 text-sm text-center text-white rounded-md",
                message.type === 'error'
                  ? "bg-red-500/20 border border-red-500/50"
                  : "bg-green-500/20 border border-green-500/50"
              )}>{message.text}</div>
            )}
            <form onSubmit={handleRequestOtp} className="mb-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email" className="text-white">Email</FieldLabel>
                  <Input id="email" name="email" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]" />
                </Field>
                <Field>
                  <Button type="submit" className="w-full bg-[#00e676]" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Request OTP'}</Button>
                </Field>
              </FieldGroup>
            </form>

            <form onSubmit={handleReset}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="otp" className="text-white">OTP</FieldLabel>
                  <Input id="otp" name="otp" value={otp} onChange={e => setOtp(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="newPassword" className="text-white">New Password</FieldLabel>
                  <Input id="newPassword" name="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00e676]" />
                </Field>
                <Field>
                  <Button type="submit" className="w-full bg-[#00e676]" disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword
