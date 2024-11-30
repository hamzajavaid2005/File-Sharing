import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyLoginCode, isAuthenticated } = useAuth();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/login');
            return;
        }
    }, [email, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleVerification = async (e) => {
        e.preventDefault();
        
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyLoginCode(email, verificationCode);
            console.log('Verification result:', result);
            
            if (result.success) {
                toast.success('Verification successful!');
                // The useEffect hook will handle the redirection
            } else {
                toast.error(result.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center mb-4">Verify Your Email</h2>
                <p className="text-gray-600 text-center mb-6">
                    Enter the verification code sent to {email}
                </p>

                <form onSubmit={handleVerification}>
                    <div className="mb-4">
                        <input
                            type="text"
                            maxLength="6"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter 6-digit code"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyEmail;
