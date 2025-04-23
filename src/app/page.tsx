// src/app/page.tsx
import Link from 'next/link';
import { FaRocket, FaUsers, FaLaptopCode } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-indigo-900 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaRocket className="text-3xl mr-2" />
            <h1 className="text-2xl font-bold">Hackathon Portal</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/login" className="hover:text-indigo-300 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition">
                  Register
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-indigo-900 to-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-4">Innovate. Initiate. Inspire.</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our hackathon and turn your ideas into reality. Collaborate with talented
            individuals and create something amazing!
          </p>
          <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-md text-lg font-semibold transition">
            Join Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">Why Join Our Hackathon?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <FaUsers className="text-5xl mx-auto mb-4 text-indigo-500" />
              <h4 className="text-xl font-bold mb-2">Team Building</h4>
              <p className="text-gray-300">
                Connect with other participants and form teams to tackle challenges together.
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <FaLaptopCode className="text-5xl mx-auto mb-4 text-indigo-500" />
              <h4 className="text-xl font-bold mb-2">Skill Showcase</h4>
              <p className="text-gray-300">
                Demonstrate your technical skills and creativity in a competitive environment.
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <FaRocket className="text-5xl mx-auto mb-4 text-indigo-500" />
              <h4 className="text-xl font-bold mb-2">Launch Your Ideas</h4>
              <p className="text-gray-300">
                Turn your innovative concepts into working prototypes during the event.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Hackathon Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}