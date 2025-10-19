import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0b0b0b] border-b border-white/5">
      <div className="container mx-auto p-8  h-16 flex items-center justify-between ">
        {/* Left: Logo + brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <span className="font-semibold text-white text-lg">AceDev<span className="text-[#00e676]">AI</span></span>
          </Link>
        </div>

        {/* Center: pill navigation (hidden on mobile) */}
        <div className="hidden md:flex items-center flex-1 justify-center">
          <div className="rounded-full bg-white/5 backdrop-blur px-4 py-2 flex items-center gap-6">
            <a href="#features" className="text-sm font-semibold text-white/80 hover:text-[#00e676]/90">
              Features
            </a>
            <a href="#roles" className="text-sm font-semibold text-white/80 hover:text-[#00e676]/90">
              Roles
            </a>
            <a href="#pricing" className="text-sm font-semibold text-white/80 hover:text-[#00e676]/90">
              Pricing
            </a>
      
          </div>
        </div>  

        {/* Right: auth actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" className="hidden md:inline-flex font-semibold text-gray-900 hover:text-gray-800 border rounded-2xl bg-[#00e676] hover:bg-[#00e676]/90 px-4">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button className="shrink-0 bg-white border font-semibold rounded-2xl text-black px-4">
            <Link to="/register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
