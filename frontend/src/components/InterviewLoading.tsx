import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Loader2, Brain, Clock, FileText } from 'lucide-react'

interface InterviewLoadingProps {
    type: 'text' | 'coding' | 'session'
    message?: string
    progress?: number
}

const InterviewLoading = ({ type, message, progress }: InterviewLoadingProps) => {
    const [currentStep, setCurrentStep] = useState(0)
    const [dots, setDots] = useState('.')

    // Animate loading dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '.' : prev + '.')
        }, 500)
        return () => clearInterval(interval)
    }, [])

    // Simulate progress steps
    useEffect(() => {
        const steps = getStepsForType(type)
        if (progress === undefined) {
            const interval = setInterval(() => {
                setCurrentStep(prev => (prev + 1) % steps.length)
            }, 2000)
            return () => clearInterval(interval)
        }
    }, [type, progress])

    const getStepsForType = (type: string) => {
        switch (type) {
            case 'text':
                return [
                    { icon: Brain, text: 'Creating interview session' },
                    { icon: FileText, text: 'Generating first question' },
                    { icon: Clock, text: 'Setting up timer' }
                ]
            case 'coding':
                return [
                    { icon: Brain, text: 'Creating coding session' },
                    { icon: FileText, text: 'Generating coding question' },
                    { icon: Clock, text: 'Setting up environment' }
                ]
            default:
                return [
                    { icon: Brain, text: 'Initializing interview' },
                    { icon: FileText, text: 'Preparing questions' },
                    { icon: Clock, text: 'Almost ready' }
                ]
        }
    }

    const steps = getStepsForType(type)
    const currentStepData = steps[currentStep] || steps[0]
    const CurrentIcon = currentStepData.icon

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border shadow-lg">
                <div className="space-y-6">
                    {/* Main loading animation */}
                    <div className="relative">
                        <div className="w-16 h-16 mx-auto mb-4 relative">
                            <Loader2 className="w-16 h-16 animate-spin text-primary" />
                            <CurrentIcon className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
                        </div>
                    </div>

                    {/* Current step */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-foreground">
                            Getting Ready{dots}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {message || currentStepData.text}
                        </p>
                    </div>

                    {/* Progress bar if available */}
                    {progress !== undefined && (
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {/* Steps indicator */}
                    <div className="flex justify-center space-x-2">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon
                            const isActive = index === currentStep
                            const isCompleted = progress !== undefined ?
                                index < (progress / 100) * steps.length :
                                index < currentStep

                            return (
                                <div
                                    key={index}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? 'bg-primary text-primary-foreground scale-110'
                                            : isCompleted
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    <StepIcon className="w-4 h-4" />
                                </div>
                            )
                        })}
                    </div>

                    {/* Tips */}
                    <div className="text-xs text-muted-foreground">
                        <p>💡 Tip: Make sure you have a quiet environment for the best interview experience</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default InterviewLoading