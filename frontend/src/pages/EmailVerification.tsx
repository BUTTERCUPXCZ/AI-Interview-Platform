import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/auth'

const EmailVerification = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token')
      return
    }

    const doVerify = async () => {
      setStatus('loading')
      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully. Redirecting to login...')
        setTimeout(() => navigate('/login'), 3000)
      } catch (err: unknown) {
        const text = err instanceof Error ? err.message : 'Verification failed'
        setStatus('error')
        setMessage(text)
      }
    }

    doVerify()
  }, [searchParams, navigate])

  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Email Verification</h1>
        {status === 'loading' && <p className="text-white/80">Verifying your email...</p>}
        {status === 'success' && <p className="text-green-400">{message}</p>}
        {status === 'error' && <p className="text-red-400">{message}</p>}
      </div>
    </div>
  )
}

export default EmailVerification