import express from 'express';

import {
    signup,
    login,
    logout,
    updateprofile
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js';
import { generalLimiter, authLimiter } from '../middleware/rate.limiter.js';

const router = express.Router();

router.post('/signup', authLimiter, signup);

router.post('/login',authLimiter, login);

router.post('/logout', logout);

router.post('/update-profile', protectRoute, updateprofile);

router.get('/check', protectRoute, (req, res) => res.status(200).json({message:'Protected route'}));


export default router;