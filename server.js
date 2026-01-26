import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { User } from './models/User.js';
import { Shelter } from './models/Shelter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'http://localhost:5000',
        'http://localhost:4173',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:4173',
        'https://safeevac-app-temp-937.netlify.app',
        /^https:\/\/.*\.netlify\.app$/, // Allow all netlify subdomains
        /^https:\/\/.*\.ngrok-free\.app$/, // Allow all ngrok tunnels
        /^http:\/\/192\.168\.\d+\.\d+:5000$/,
        /^http:\/\/192\.168\.\d+\.\d+:4173$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:5000$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:4173$/
    ],
    credentials: true
}));
app.use(express.json());

// Disable caching for all routes
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safe';
mongoose.connect(MONGODB_URI, {
    directConnection: MONGODB_URI.includes('127.0.0.1') ? true : false,
    serverSelectionTimeoutMS: 30000
})
    .then(() => console.log(`MongoDB connected to: ${MONGODB_URI.split('@').pop().split('/')[0]}`))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: { name, email } });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.password !== password) { // In production, use bcrypt
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get User Profile
app.get('/api/profile/:email', async (req, res) => {
    console.log(`GET /api/profile/${req.params.email}`);
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            console.log("User not found in DB");
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            name: user.name,
            email: user.email,
            password: user.password,
            emergencyEmail1: user.emergencyEmail1 || '',
            emergencyEmail2: user.emergencyEmail2 || ''
        });
    } catch (error) {
        console.error("Profile GET Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update User Profile
app.put('/api/profile/:email', async (req, res) => {
    console.log(`PUT /api/profile/${req.params.email}`);
    try {
        const { name, password, emergencyEmail1, emergencyEmail2 } = req.body;
        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            { name, password, emergencyEmail1, emergencyEmail2 },
            { new: true }
        );
        if (!user) {
            console.log("User not found for update");
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile updated', user });
    } catch (error) {
        console.error("Profile PUT Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// SOS Alert Route
app.post('/api/sos', async (req, res) => {
    console.log("SOS Alert Triggered");
    try {
        const { email, location } = req.body;

        // Find user to get emergency email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const targetEmails = [];
        if (user.emergencyEmail1) targetEmails.push(user.emergencyEmail1);
        if (user.emergencyEmail2) targetEmails.push(user.emergencyEmail2);

        if (targetEmails.length === 0) {
            return res.status(400).json({ message: 'No emergency emails configured in profile.' });
        }

        // Create transporter

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });

        // Email content
        const mailOptions = {
            from: `SafeEvac Alert <${process.env.EMAIL_USER || 'safeevac@gmail.com'}>`,
            to: targetEmails.join(', '),
            subject: '🚨 SOS ALERT! SafeEvac User Needs Help',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY SOS ALERT</h1>
                    </div>
                    
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                            <strong>${user.name}</strong> has triggered an emergency SOS alert and needs immediate assistance.
                        </p>
                        
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #991b1b; font-weight: bold;">⏰ Alert Time:</p>
                            <p style="margin: 5px 0 0 0; color: #333;">${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #1e40af; font-weight: bold;">📍 Current Location:</p>
                            <p style="margin: 5px 0 0 0; color: #333;">${location}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${location.includes('http') ? location.split('Link: ')[1] || location : 'https://www.google.com/maps?q=' + location}" 
                               style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                📍 View Location on Google Maps
                            </a>
                        </div>
                        
                        <div style="background-color: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #854d0e; font-weight: bold;">⚠️ What to do:</p>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
                                <li>Try to contact ${user.name} immediately</li>
                                <li>Check their location using the map link above</li>
                                <li>If you cannot reach them, contact local emergency services</li>
                                <li>Share their location with authorities if needed</li>
                            </ul>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                            This is an automated emergency alert from SafeEvac.<br>
                            You are receiving this because you are listed as an emergency contact.
                        </p>
                    </div>
                </div>
            `
        };

        // Try to send email
        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to: ${targetEmails.join(', ')}`);
            res.json({ message: `SOS Alert sent to ${targetEmails.join(', ')}` });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);

            // Fallback: Log to console
            console.log(`---------------------------------------------------`);
            console.log(`[EMAIL FAILED - LOGGED TO CONSOLE]`);
            console.log(`TO: ${targetEmails.join(', ')}`);
            console.log(`FROM: service@safeevac.com`);
            console.log(`SUBJECT: SOS ALERT! SafeEvac User Needs Help`);
            console.log(`BODY:`);
            console.log(`Emergency Alert! ${user.name} has triggered an SOS.`);
            console.log(`Current Location: ${location}`);
            console.log(`---------------------------------------------------`);

            // Still return success to user, but note email failed
            res.json({
                message: `SOS Alert logged (email service unavailable). Emergency contacts: ${targetEmails.join(', ')}`,
                warning: 'Email service not configured. Check server console for details.'
            });
        }

    } catch (error) {
        console.error("SOS Error:", error);
        res.status(500).json({ message: 'Failed to process SOS', error: error.message });
    }
});

// Add Shelter
app.post('/api/shelters', async (req, res) => {
    try {
        const shelterData = req.body;
        const newShelter = new Shelter(shelterData);
        await newShelter.save();
        res.status(201).json(newShelter);
    } catch (error) {
        res.status(500).json({ message: 'Error adding shelter', error: error.message });
    }
});

// Get Shelters
app.get('/api/shelters', async (req, res) => {
    try {
        const shelters = await Shelter.find();
        res.json(shelters);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shelters', error: error.message });
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, 'dist')));

    app.get('/(.*)', (req, res) => {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
}

// Only start the server if file is executed directly (local development)
if (process.env.NODE_ENV !== 'production' || process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
export const handler = serverless(app);
export default app;
