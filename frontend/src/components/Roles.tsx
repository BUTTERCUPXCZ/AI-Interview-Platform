import { Code, Database, LineChart, Smartphone, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const roles = [
  {
    icon: Code,
    title: 'Frontend Development',
    description: 'Master React, Vue, Angular, and modern web technologies. Practice UI/UX questions and component design.',
    topics: ['React', 'TypeScript', 'CSS', 'Web APIs'],
  },
  {
    icon: Server,
    title: 'Backend Development',
    description: 'Deep dive into APIs, databases, system design, and server-side technologies.',
    topics: ['Node.js', 'Python', 'SQL', 'System Design'],
  },
  {
    icon: Server,
    title: 'Full Stack Development',
    description: 'Master building complete web applications from frontend interfaces to backend systems, integrating APIs, databases, and deployment workflows.',
    topics: ['Frontend Development', 'Backend Development', 'Database Design', 'API Integration', 'Deployment'],
  },
  {
    icon: LineChart,
    title: 'Data Science',
    description: 'Practice ML algorithms, statistics, data analysis, and model deployment questions.',
    topics: ['Python', 'ML', 'Statistics', 'Pandas'],
  },
  {
    icon: Smartphone,
    title: 'Mobile Development',
    description: 'Prepare for iOS and Android interviews with platform-specific and cross-platform questions.',
    topics: ['React Native', 'Swift', 'Kotlin', 'Flutter'],
  },
  {
    icon: Database,
    title: 'DevOps',
    description: 'Master CI/CD, cloud infrastructure, containerization, and automation practices.',
    topics: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
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

export function Roles() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="roles" className="relative py-24 px-4 bg-background overflow-hidden">
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
            Specialized Training for Every Role
          </h2>
          <p className="text-xl text-white/70 max-w-2xl">
            Choose your path and get role-specific interview questions curated by industry experts
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div key={index} variants={itemVariants} transition={{ duration: 0.5 }}>
                <Card
                  className="group relative h-full backdrop-blur-sm bg-card/40 border border-white/10 hover:border-[#00e676]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,230,118,0.15)]"
                >
                  <CardHeader className="flex-shrink-0">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 shrink-0 bg-[#00e676]/10 group-hover:bg-[#00e676]/20 transition-colors duration-300"
                    >
                      <Icon className="h-6 w-6 text-[#00e676]" />
                    </div>
                    <CardTitle className="text-xl text-white">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    <p className="mb-4 flex-grow text-white/80">{role.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.topics.map((topic, topicIndex) => (
                        <Badge
                          key={topicIndex}
                          variant="secondary"
                          className="backdrop-blur-sm bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 transition-colors duration-200"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
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
