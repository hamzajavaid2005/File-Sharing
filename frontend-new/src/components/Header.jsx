import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiUser, FiLogOut } from 'react-icons/fi';

const Header = () => {
    const { isAuthenticated, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const linkClass = (path) =>
        `flex items-center px-4 py-2 text-sm font-medium transition-colors ${
            isActive(path)
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
        } rounded-md`;

    return (
        <header className="bg-white shadow-sm w-full">
            <div className="w-full px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <FiUpload className="h-6 w-6 text-primary-600" />
                        <span className="text-xl font-bold text-gray-900">File Share</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className={linkClass('/dashboard')}>
                                    <FiUpload className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                                <Link to="/profile" className={linkClass('/profile')}>
                                    <FiUser className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>
                                <button
                                    onClick={logout}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                    <FiLogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
