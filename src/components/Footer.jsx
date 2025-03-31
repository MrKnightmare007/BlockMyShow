import React from 'react';

function Footer() {
  return (
    <footer className="bg-blue-600 dark:bg-gray-800 text-white py-6 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">BlockMyShow</h3>
            <p className="text-blue-100 dark:text-gray-300 text-sm mt-1">Secure blockchain-based ticketing</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-blue-100 dark:text-gray-300 hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="text-blue-100 dark:text-gray-300 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-blue-100 dark:text-gray-300 hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="text-blue-100 dark:text-gray-300 hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-blue-500 dark:border-gray-700 text-center text-sm text-blue-100 dark:text-gray-300">
          &copy; {new Date().getFullYear()} BlockMyShow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;