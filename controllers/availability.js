const Listing = require('../models/listing');
const Booking = require('../models/booking');

// Advanced Availability Analytics
module.exports.getAvailabilityAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { days = 90 } = req.query;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        // Get all bookings in the period
        const bookings = await Booking.find({
            listing: id,
            status: { $ne: 'Cancelled' },
            startDate: { $lte: futureDate },
            endDate: { $gte: now }
        });

        // Calculate blocked days
        const blockedDates = new Set();
        if (listing.unavailableDates) {
            listing.unavailableDates.forEach(date => {
                const d = new Date(date);
                if (d >= now && d <= futureDate) {
                    blockedDates.add(d.toISOString().split('T')[0]);
                }
            });
        }

        // Calculate booked days
        const bookedDates = new Set();
        bookings.forEach(booking => {
            let curr = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            while (curr <= end) {
                if (curr >= now && curr <= futureDate) {
                    bookedDates.add(curr.toISOString().split('T')[0]);
                }
                curr.setDate(curr.getDate() + 1);
            }
        });

        const totalDays = parseInt(days);
        const blockedCount = blockedDates.size;
        const bookedCount = bookedDates.size;
        const availableCount = totalDays - blockedCount - bookedCount;
        const occupancyRate = ((bookedCount / totalDays) * 100).toFixed(1);

        // Revenue calculations
        const basePrice = listing.price || 0;
        const estimatedLoss = blockedCount * basePrice;
        const projectedRevenue = bookedCount * basePrice;
        const potentialRevenue = availableCount * basePrice;

        res.json({
            success: true,
            analytics: {
                totalDays,
                blockedDays: blockedCount,
                bookedDays: bookedCount,
                availableDays: availableCount,
                occupancyRate: parseFloat(occupancyRate),
                basePrice,
                estimatedLoss,
                projectedRevenue,
                potentialRevenue,
                totalPotential: projectedRevenue + potentialRevenue
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ success: false, message: 'Failed to calculate analytics' });
    }
};

// Bulk Update Availability
module.exports.bulkUpdateAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, dates, startDate, endDate } = req.body;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        let updatedDates = listing.unavailableDates || [];

        switch (action) {
            case 'add':
                // Add dates to unavailable
                const newDates = dates.map(d => new Date(d));
                updatedDates = [...new Set([...updatedDates, ...newDates])];
                break;

            case 'remove':
                // Remove specific dates
                const datesToRemove = new Set(dates.map(d => new Date(d).toISOString()));
                updatedDates = updatedDates.filter(d => !datesToRemove.has(new Date(d).toISOString()));
                break;

            case 'clear':
                // Clear all blocked dates
                updatedDates = [];
                break;

            case 'range':
                // Add a range of dates
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const rangeDates = [];
                    let curr = new Date(start);
                    while (curr <= end) {
                        rangeDates.push(new Date(curr));
                        curr.setDate(curr.getDate() + 1);
                    }
                    updatedDates = [...new Set([...updatedDates, ...rangeDates])];
                }
                break;

            default:
                return res.status(400).json({ success: false, message: "Invalid action" });
        }

        listing.unavailableDates = updatedDates;
        await listing.save();

        res.json({
            success: true,
            message: "Bulk update completed successfully",
            count: updatedDates.length
        });
    } catch (err) {
        console.error('Bulk update error:', err);
        res.status(500).json({ success: false, message: 'Bulk update failed' });
    }
};

// Apply Recurring Pattern
module.exports.applyRecurringPattern = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, pattern, startDate, endDate, description } = req.body;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        // Add to recurring blocks
        listing.recurringBlocks = listing.recurringBlocks || [];
        listing.recurringBlocks.push({
            type,
            pattern,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            description: description || 'Recurring Block'
        });

        // Generate actual blocked dates from pattern
        const generatedDates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        let curr = new Date(start);

        while (curr <= end) {
            let shouldBlock = false;

            if (type === 'weekly') {
                // pattern contains day numbers (0-6)
                shouldBlock = pattern.includes(curr.getDay());
            } else if (type === 'monthly') {
                // pattern contains day of month (1-31)
                shouldBlock = pattern.includes(curr.getDate());
            }

            if (shouldBlock) {
                generatedDates.push(new Date(curr));
            }

            curr.setDate(curr.getDate() + 1);
        }

        // Merge with existing unavailable dates
        const existingDates = listing.unavailableDates || [];
        listing.unavailableDates = [...new Set([...existingDates, ...generatedDates])];

        await listing.save();

        res.json({
            success: true,
            message: "Recurring pattern applied successfully",
            datesAdded: generatedDates.length,
            blockId: listing.recurringBlocks[listing.recurringBlocks.length - 1]._id
        });
    } catch (err) {
        console.error('Recurring pattern error:', err);
        res.status(500).json({ success: false, message: 'Failed to apply recurring pattern' });
    }
};

// Remove Recurring Pattern
module.exports.removeRecurringPattern = async (req, res) => {
    try {
        const { id, blockId } = req.params;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        listing.recurringBlocks = listing.recurringBlocks.filter(
            block => block._id.toString() !== blockId
        );

        await listing.save();

        res.json({
            success: true,
            message: "Recurring pattern removed successfully"
        });
    } catch (err) {
        console.error('Remove recurring pattern error:', err);
        res.status(500).json({ success: false, message: 'Failed to remove recurring pattern' });
    }
};

// Pricing Variations Management
module.exports.getPricingVariations = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id).select('pricingVariations price');

        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        res.json({
            success: true,
            basePrice: listing.price,
            variations: listing.pricingVariations || []
        });
    } catch (err) {
        console.error('Get pricing variations error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch pricing variations' });
    }
};

module.exports.addPricingVariation = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, price, reason } = req.body;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        listing.pricingVariations = listing.pricingVariations || [];
        listing.pricingVariations.push({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            price: parseFloat(price),
            reason: reason || 'Custom Pricing'
        });

        await listing.save();

        res.json({
            success: true,
            message: "Pricing variation added successfully",
            variation: listing.pricingVariations[listing.pricingVariations.length - 1]
        });
    } catch (err) {
        console.error('Add pricing variation error:', err);
        res.status(500).json({ success: false, message: 'Failed to add pricing variation' });
    }
};

module.exports.removePricingVariation = async (req, res) => {
    try {
        const { id, variationId } = req.params;

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        listing.pricingVariations = listing.pricingVariations.filter(
            variation => variation._id.toString() !== variationId
        );

        await listing.save();

        res.json({
            success: true,
            message: "Pricing variation removed successfully"
        });
    } catch (err) {
        console.error('Remove pricing variation error:', err);
        res.status(500).json({ success: false, message: 'Failed to remove pricing variation' });
    }
};

// Export Availability (iCal format)
module.exports.exportAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        // Generate iCal format
        let ical = 'BEGIN:VCALENDAR\r\n';
        ical += 'VERSION:2.0\r\n';
        ical += 'PRODID:-//WanderLust//Availability Calendar//EN\r\n';
        ical += `X-WR-CALNAME:${listing.title} - Blocked Dates\r\n`;

        if (listing.unavailableDates && listing.unavailableDates.length > 0) {
            listing.unavailableDates.forEach((date, index) => {
                const d = new Date(date);
                const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');

                ical += 'BEGIN:VEVENT\r\n';
                ical += `UID:blocked-${id}-${index}@wanderlust.com\r\n`;
                ical += `DTSTART;VALUE=DATE:${dateStr}\r\n`;
                ical += `SUMMARY:Blocked - ${listing.title}\r\n`;
                ical += 'STATUS:CONFIRMED\r\n';
                ical += 'TRANSP:OPAQUE\r\n';
                ical += 'END:VEVENT\r\n';
            });
        }

        ical += 'END:VCALENDAR\r\n';

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="${listing.title.replace(/[^a-z0-9]/gi, '_')}_blocked_dates.ics"`);
        res.send(ical);
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ success: false, message: 'Failed to export availability' });
    }
};
