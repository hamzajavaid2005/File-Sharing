const Footer = () => {
    return (
        <footer className="w-full bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                        © {new Date().getFullYear()} File Share. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                            Terms of Service
                        </a>
                        <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
