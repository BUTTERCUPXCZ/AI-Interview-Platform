import { Brain, MessageSquare, BarChart3, Clock, Target, Zap } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Questions',
    description: 'Get intelligent, role-specific questions that adapt to your skill level and learning pace.',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Feedback',
    description: 'Receive instant, detailed feedback on your answers to improve your interview performance.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your improvement with detailed analytics and performance metrics over time.',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Practice anytime, anywhere. Our platform is available 24/7 to fit your schedule.',
  },
  {
    icon: Target,
    title: 'Role-Specific Practice',
    description: 'Tailored questions for Frontend, Backend, Data Science, Mobile Dev, and DevOps roles.',
  },
  {
    icon: Zap,
    title: 'Interview Simulations',
    description: 'Experience realistic interview scenarios with time constraints and pressure simulation.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-24 px-4 bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-white/70 max-w-2xl">
            Our platform provides comprehensive tools to help you prepare for technical interviews
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants} transition={{ duration: 0.5 }}>
                <Card
                  className="group relative h-full backdrop-blur-sm bg-card/40 border border-white/10 hover:border-[#00e676]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,230,118,0.15)]"
                >
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 shrink-0 bg-[#00e676]/10 group-hover:bg-[#00e676]/20 transition-colors duration-300"
                    >
                      <Icon className="h-6 w-6 text-[#00e676]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="flex-grow text-white/80">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
