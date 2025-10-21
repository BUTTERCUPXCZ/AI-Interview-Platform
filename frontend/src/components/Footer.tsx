import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <footer className="relative py-16 px-4 bg-background overflow-hidden border-t border-white/10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl text-center relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-bold text-2xl text-white mb-3">AceDev<span className='text-[#00e676]'>AI</span></div>
          <p className="mt-2 text-base text-white/80 max-w-2xl mx-auto">
            Empowering tech enthusiasts to ace their interviews and land dream jobs.
          </p>
          <p className="mt-6 text-sm text-white/60">
            © 2024 AceDevAI. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
