import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import { generateToken } from "../utils/generateToken.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import cloudinary from "../config/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create(
            {
                fullName,
                email,
                password: hashedPassword,
            }
        )

        const token = generateToken(user._id, res);

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userData: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                token: token,
            }
        });

        try {
            await sendWelcomeEmail(user.email, user.fullName, process.env.CLIENT_URL);
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }

    } catch (error) {
        console.error(`Error while creating user ${error.message}`);
        return res.status(500).json({
            success:false,
            message: 'Internal server error'
        });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = generateToken(user._id, res);

        res.status(200).json({
            success: true,
            message: 'Login Successfully',
            userData: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                token: token,
            }
        })
    } catch (error) {
        console.error(`Error in login controller ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }

    
}

export const logout = (_, res) => {
    res.cookie('jwt', "", {maxAge: 0});
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
}

export const updateprofile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        if (!profilePic) return res.status(400).json({
            success: false,
            message: 'Profile pic is required'
        });

        const userId = req.user._id;

        const uploadResponse = await cloudinary.uploader.upload(profilePic);

        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });

        res.status(200).json(updatedUser);
        
    } catch (error) {
        console.error(`Error in update profile ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Inrernal server error'
        });
    }
}

