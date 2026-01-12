const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file (jpg, jpeg, or png)'), false);
        }
        cb(null, true);
    }
});
const Journal = require('../models/journal');
const Review = require('../models/review');
const Comment = require('../models/comment');

// Travel Journal & Feed Routes
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const { tab = 'community' } = req.query;
        let query = {};

        if (tab === 'mine') {
            query = { author: req.user._id };
        }

        const journals = await Journal.find(query)
            .sort({ createdAt: -1 })
            .populate('author', 'username avatar')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username avatar' },
                options: { sort: { createdAt: -1 } }
            })
            .populate('likes', 'username');

        res.render('social/journal', {
            title: tab === 'community' ? 'Community Feed - WanderLust' : 'My Travel Journal - WanderLust',
            description: 'Document your travel experiences and memories',
            currentUrl: req.originalUrl,
            journals,
            currentUser: req.user,
            activeTab: tab
        });
    } catch (error) {
        console.error('Error loading journal:', error);
        req.flash('error', 'Failed to load feed. Please try again.');
        res.redirect('back');
    }
});

router.post('/', isLoggedIn, upload.array('images', 10), async (req, res, next) => {
    const journal = new Journal({
        title: req.body.title,
        content: req.body.content,
        author: req.user._id,
        location: req.body.location,
        images: req.files.map(f => ({ url: f.path, filename: f.filename }))
    });
    try {
        await journal.save();
        req.flash('success', 'Successfully created a new journal entry!');
        return res.redirect('/social');
    } catch (e) {
        req.flash('error', 'Failed to create journal entry. Please try again.');
        return res.redirect('back');
    }
});

// Reviews Routes
router.post('/reviews', isLoggedIn, async (req, res, next) => {
    const review = new Review({
        ...req.body,
        author: req.user._id
    });
    try {
        await review.save();
        req.flash('success', 'Thank you for your review!');
    } catch (e) {
        req.flash('error', 'Failed to submit review. Please try again.');
    }
    return res.redirect('back');
});

// Photo Gallery Route
router.get('/gallery', isLoggedIn, async (req, res) => {
    try {
        const journals = await Journal.find({}).populate('author');
        const photos = [];
        journals.forEach(journal => {
            if (journal.images && journal.images.length > 0) {
                journal.images.forEach(image => {
                    photos.push({
                        url: image.url,
                        title: journal.title,
                        location: journal.location,
                        author: journal.author.username,
                        date: journal.createdAt
                    });
                });
            }
        });
        res.render('social/gallery', {
            title: 'Travel Gallery - WanderLust',
            description: 'Explore amazing travel photos shared by our community',
            currentUrl: req.originalUrl,
            photos,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
        req.flash('error', 'Failed to load the photo gallery. Please try again.');
        res.redirect('back');
    }
});

// Post a comment to a journal
router.post('/journal/:id/comments', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Comment content is required' });
        }

        const journal = await Journal.findById(id);

        if (!journal) {
            return res.status(404).json({ success: false, message: 'Journal not found' });
        }

        const comment = new Comment({
            content,
            author: req.user._id,
            journal: id
        });

        await comment.save();
        journal.comments.push(comment._id);
        await journal.save();

        // Populate for response
        await comment.populate('author', 'username avatar');

        res.json({
            success: true,
            message: 'Comment added successfully',
            comment: {
                _id: comment._id,
                content: comment.content,
                author: {
                    username: comment.author.username,
                    avatar: comment.author.avatar
                },
                createdAt: comment.createdAt
            }
        });
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ success: false, message: 'Error adding comment' });
    }
});

// Delete a journal post
router.delete('/journal/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const journal = await Journal.findById(id);

        if (!journal) {
            return res.status(404).json({ success: false, message: 'Journal not found' });
        }

        // Check ownership
        if (journal.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You can only delete your own stories' });
        }

        // Delete associated comments first
        if (journal.comments && journal.comments.length > 0) {
            await Comment.deleteMany({ _id: { $in: journal.comments } });
        }

        await Journal.findByIdAndDelete(id);

        res.json({ success: true, message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Delete journal error:', error);
        res.status(500).json({ success: false, message: 'Error deleting story' });
    }
});

module.exports = router;
