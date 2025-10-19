'use client';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackgroundRippleEffect } from './ui/background-ripple-effect';

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });
      // Only animate elements that exist
      if (document.querySelector('.hero-heading')) {
        tl.from('.hero-heading', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
          .from('.hero-text', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, '-=0.4')
          .from('.hero-button', { opacity: 0, y: 10, duration: 0.5, ease: 'power3.out' }, '-=0.3')
          .from('.hero-video', { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.2');
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center min-h-screen bg-background overflow-hidden"
    >
      <BackgroundRippleEffect rows={8} cols={27} cellSize={56} />

      {/* Top Section - Heading and CTA */}
      <div className="container mx-auto max-w-7xl relative z-10 px-4 pt-40 pb-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="hero-heading text-5xl md:text-7xl font-bold tracking-tight leading-tight text-white max-w-4xl">
            Master Technical Interviews
            <br />
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #00e676 0%, #ffffff 100%)' }}
            >
              Land the Role You Deserve
            </span>
          </h1>

          <p className="hero-text text-lg md:text-xl text-white/70 max-w-3xl leading-relaxed">
            Practice realistic, AI-driven mock interviews tailored to your target role.
            Receive instant, actionable feedback and polish answers, algorithms, and system design.
          </p>

          <div className="hero-button flex flex-col sm:flex-row gap-4 items-center pt-4">
            <Button
              size="lg"
              className="text-base px-8 py-6 bg-[#00e676] hover:bg-[#02cb6a] w-full sm:w-auto"
            >
              <Link to="/login" className="flex font-semibold items-center">
                Start Practicing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Section - Demo Video (Full Width at Bottom) */}
      <div className="hero-video w-full relative z-10 px-4 md:px-8 pb-0">
        <div className="container mx-auto max-w-7xl">
          <div className="relative rounded-t-2xl overflow-hidden shadow-[0_-20px_80px_-20px_rgba(0,230,118,0.3)] border-t border-x border-white/10 bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-sm">
            <div className="w-full overflow-hidden">
              <video
                className="w-full h-auto"
                style={{ 
                  marginTop: '-3%',
                  transform: 'scale(1.05)'
                }}
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/Demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/30 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
