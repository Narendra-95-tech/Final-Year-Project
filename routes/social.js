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

// Travel Journal Routes
router.get('/journal', isLoggedIn, async (req, res) => {
    try {
        const journals = await Journal.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.render('social/journal', { 
            title: 'My Travel Journal - WanderLust',
            description: 'Document your travel experiences and memories',
            currentUrl: req.originalUrl,
            journals,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error loading journal:', error);
        req.flash('error', 'Failed to load your journal. Please try again.');
        res.redirect('back');
    }
});

router.post('/journal', isLoggedIn, upload.array('images', 10), async (req, res, next) => {
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
      return res.redirect('/social/journal');
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

module.exports = router;
