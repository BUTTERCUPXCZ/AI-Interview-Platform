import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/useAuthContext';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceId: 'price_1SKUgaBQ6sV3m28sv4RkRPpI',
    description: 'Perfect for getting started',
    features: [
      '2 practice interview per week',
      'Basic AI feedback',
      'Access to 1 role specialization',
      'Community support',
      'Progress tracking',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    priceId: 'price_1SKUizBQ6sV3m28s7eCCJGQw',
    description: 'For serious job seekers',
    features: [
      'Unlimited practice interviews',
      'Advanced AI feedback & analysis',
      'Access to all 5 role specializations',
      'Priority support',
      'Detailed performance analytics',
      'Mock interview recordings',
      'Custom interview scenarios',
    ],
    cta: 'Get Pro',
    popular: true,
  },
  {
    name: 'Team',
    price: '$99',
    priceId: undefined, // Team plan uses contact sales
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Team performance dashboard',
      'Custom training programs',
      'Dedicated account manager',
      'API access',
      'White-label options',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { createCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    try {
      setLoading(plan.name);

      // If user is not logged in, redirect to login
      if (!user) {
        navigate('/login');
        return;
      }

      // Handle Free plan - just redirect to dashboard
      if (plan.name === 'Free') {
        navigate('/dashboard');
        return;
      }

      // Handle Pro plan - create Stripe checkout
      if (plan.name === 'Pro' && plan.priceId) {
        await createCheckout(plan.priceId);
      }

      // Team plan - contact sales (you can implement this later)
      if (plan.name === 'Team') {
        window.location.href = 'mailto:sales@acedevai.com?subject=Team Plan Inquiry';
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };  return (
    <section id="pricing" className="relative py-24 px-4 bg-background overflow-hidden">
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
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-white/70 max-w-2xl">
            Choose the perfect plan for your interview preparation journey
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div key={index} variants={itemVariants} transition={{ duration: 0.6 }}>
              <Card
                className={`relative flex flex-col h-full backdrop-blur-sm transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-card/40 border-2 border-[#00e676] shadow-[0_0_40px_rgba(0,230,118,0.2)] scale-105' 
                    : 'bg-card/40 border border-white/10 hover:border-[#00e676]/50 hover:shadow-[0_0_30px_rgba(0,230,118,0.15)] hover:scale-[1.02]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="px-3 py-1 bg-[#00e676] text-[#111827] font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-white/80">{plan.description}</CardDescription>
                  <div className="pt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.price !== '$0' && (
                      <span className="text-white/70">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3 flex flex-col">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-5 w-5 shrink-0 mt-0.5 text-[#00e676]" />
                        <span className="text-sm text-white/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex-shrink-0">
                  <Button
                    className={`w-full transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-[#00e676] hover:bg-[#02cb6a] text-[#1c1b1b] font-bold' 
                        : 'border-[#00e676] text-[#00e676] hover:bg-[#00e676]/10'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.name}
                  >
                    {loading === plan.name ? 'Loading...' : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-center mt-8"
        >
          <p className="text-sm text-white/60 text-center">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
