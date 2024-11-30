import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const verifyJWT = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            
            // Get user from token
            const user = await User.findById(decoded._id).select('-password -refreshToken');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Attach user to request object
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
