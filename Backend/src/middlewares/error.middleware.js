import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
    // Log the full error details for server-side debugging
    console.error('Detailed Error Logging:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Request Body:', req.body);
    console.error('Request Method:', req.method);
    console.error('Request URL:', req.url);

    // Determine the status code
    const statusCode = err.statusCode || 500;

    // Prepare the error response
    const errorResponse = {
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err.details || {}
        })
    };

    // Special handling for Mongoose validation errors
    if (err.name === 'ValidationError') {
        errorResponse.message = Object.values(err.errors)
            .map(error => error.message)
            .join(', ');
        errorResponse.validationErrors = Object.keys(err.errors);
    }

    // Return the error response
    return res.status(statusCode).json(errorResponse);
};
