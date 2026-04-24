import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Message endpoint');
});

export default router;