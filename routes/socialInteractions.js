const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware');
const User = require('../models/user');
const Journal = require('../models/journal');
const Notification = require('../models/notification');

// Follow/Unfollow a user
router.post('/follow/:userId', isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user._id;
        
        if (userId === currentUser.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(userId);
        const user = await User.findById(currentUser);

        if (!userToFollow) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already following
        const isFollowing = user.following.includes(userId);
        
        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(currentUser, { $pull: { following: userId } });
            await User.findByIdAndUpdate(userId, { $pull: { followers: currentUser } });
            
            // Remove follow notification if exists
            await Notification.findOneAndDelete({
                user: userId,
                sender: currentUser,
                type: 'follow'
            });
            
            return res.json({ success: true, message: 'Unfollowed successfully', following: false });
        } else {
            // Follow
            user.following.push(userId);
            userToFollow.followers.push(currentUser);
            
            await Promise.all([user.save(), userToFollow.save()]);
            
            // Create notification
            await Notification.createNotification(
                userId,
                currentUser,
                'follow',
                { link: `/users/${currentUser}` }
            );
            
            return res.json({ success: true, message: 'Followed successfully', following: true });
        }
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ success: false, message: 'Error processing follow action' });
    }
});

// Like/Unlike a journal post
router.post('/like/:journalId', isLoggedIn, async (req, res) => {
    try {
        const { journalId } = req.params;
        const userId = req.user._id;
        
        const journal = await Journal.findById(journalId);
        if (!journal) {
            return res.status(404).json({ success: false, message: 'Journal not found' });
        }
        
        const isLiked = journal.likes.includes(userId);
        
        if (isLiked) {
            // Unlike
            journal.likes = journal.likes.filter(id => id.toString() !== userId.toString());
            await journal.save();
            
            // Remove like notification if exists
            await Notification.findOneAndDelete({
                user: journal.author,
                sender: userId,
                type: 'like',
                'metadata.postId': journalId
            });
            
            return res.json({ success: true, liked: false, likeCount: journal.likes.length });
        } else {
            // Like
            journal.likes.push(userId);
            await journal.save();
            
            // Create notification (only if not the author)
            if (journal.author.toString() !== userId.toString()) {
                await Notification.createNotification(
                    journal.author,
                    userId,
                    'like',
                    {
                        link: `/social/journal/${journal._id}`,
                        metadata: { postId: journal._id }
                    }
                );
            }
            
            return res.json({ success: true, liked: true, likeCount: journal.likes.length });
        }
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ success: false, message: 'Error processing like action' });
    }
});

// Get user notifications
router.get('/notifications', isLoggedIn, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('sender', 'username avatar')
            .lean();
            
        // Mark notifications as read
        await Notification.updateMany(
            { _id: { $in: notifications.filter(n => !n.read).map(n => n._id) } },
            { $set: { read: true } }
        );
        
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});

// Get user profile
router.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username })
            .select('-hash -salt -email -notifications -savedPosts -preferences -lastActive')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar')
            .lean();
            
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Get user's journal posts
        const posts = await Journal.find({ author: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
            
        // Get user's liked posts
        const likedPosts = await Journal.find({ likes: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('author', 'username avatar')
            .lean();
            
        res.json({
            success: true,
            user,
            stats: {
                posts: posts.length,
                followers: user.followers.length,
                following: user.following.length
            },
            posts,
            likedPosts
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

module.exports = router;
