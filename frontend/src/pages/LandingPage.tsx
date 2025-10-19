

import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Roles } from '../components/Roles';
import { Pricing } from '../components/Pricing';
import { Footer } from '../components/Footer';

const LandingPage: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Roles />
          <Pricing />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default LandingPage;