import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLock } from 'react-icons/fi';

const ResetPassword = () => {
    const [passwords, setPasswords] = useState({
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();
    const { token } = useParams();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.password !== passwords.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);
        try {
            await resetPassword(token, passwords.password);
            toast.success('Password reset successful!');
            navigate('/login');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="form-container">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Reset Your Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your new password
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={passwords.password}
                                onChange={handleChange}
                                className="input-field pl-10"
                                placeholder="Enter new password"
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={passwords.confirmPassword}
                                onChange={handleChange}
                                className="input-field pl-10"
                                placeholder="Confirm new password"
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
