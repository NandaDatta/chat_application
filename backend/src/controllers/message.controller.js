import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import cloudinary  from '../config/cloudinary.js'

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error(`Error in getAllContacts controller ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error'
         });
    }
}

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        });

        res.status(200).json(messages)
    } catch (error) {
        console.error(`Error in getMessagesByUserId controller ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: 'Text or image is required' });
        }

        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: 'Cannot send message to yourself' });
        }

        const recieverExists = await User.findById({ _id: receiverId }).select('-password');
        if (!recieverExists) {
            return res.status(404).json({ message: 'Reciever not found' });
        }

        let imageUrl;
        if (image) {
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        // todo: send message in real-time if user is online - socket.io
        res.status(201).json({
            success: true,
            message: newMessage
        });

    } catch (error) {
        console.error(`Error in sendMessage controller ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // find all the messages where the logged-in user is either sender or receiver
        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId }, { receiverId: loggedInUserId }
            ]
        });

        const chatPartnerIds = [
            ...new Set(
                messages.map((msg) => 
                    msg.senderId.toString() === loggedInUserId.toString() 
                    ? msg.receiverId.toString() 
                    : msg.senderId.toString()
                )   
            )
        ];

        const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select('-password');

        res.status(200).json({
            success: true,
            chatPartners
        });

    } catch (error) {
        console.error(`Error in getChatPartners controller ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}