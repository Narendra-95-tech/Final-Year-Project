# PWA Setup Instructions

## IMPORTANT: Add VAPID Keys to .env

The VAPID keys were generated. Add these to your `.env` file:

```env
# Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

**Note:** Check your terminal output from `npx web-push generate-vapid-keys` for the actual keys.

---

## Testing Push Notifications Locally:

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Open http://localhost:8080**

3. **Wait 10 seconds** - notification prompt will appear

4. **Click "Enable Notifications"**

5. **Allow permission** - you'll get a welcome notification!

---

## Sending Test Notifications:

### Via Browser Console:
```javascript
// Send to specific user
fetch('/api/push/send', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    userId: 'USER_ID_HERE',
    title: '✅ Booking Confirmed!',
    body: 'Your stay at Sunset Villa is confirmed',
    url: '/bookings'
  })
}).then(r => r.json()).then(console.log);
```

### Broadcast to All Users:
```javascript
fetch('/api/push/broadcast', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    title: '🎉 New Feature!',
    body: 'Check out our AI Trip Planner',
    url: '/trip-planner'
  })
}).then(r => r.json()).then(console.log);
```

---

## Integration with Booking Flow:

In `controllers/listingsBookings.js`, add after successful booking:

```javascript
// At the top of the file
const { sendBookingConfirmation } = require('../routes/push');

// After booking is created
if (req.user) {
  await sendBookingConfirmation(req.user._id.toString(), {
    listingTitle: listing.title,
    bookingId: booking._id
  });
}
```

---

## Deployment Checklist:

- [ ] Add VAPID keys to Render environment variables
- [ ] Test notifications on deployed site (HTTPS required)
- [ ] Verify service worker is registered
- [ ] Test on mobile device (Android Chrome recommended)

---

## Troubleshooting:

**Notifications not appearing?**
- Check browser permission (Settings → Site Settings → Notifications)
- Ensure HTTPS (required for push notifications)
- Check console for errors

**"User not subscribed" error?**
- User must click "Enable Notifications" first
- Check `/api/push/stats` to see subscriber count

---

## Demo for College Defense:

1. Open app on phone
2. Show notification prompt
3. Enable notifications
4. Receive welcome notification
5. Explain: "This uses the same Web Push API as Facebook and WhatsApp"

**Wow Factor:** Send a live notification during presentation! 🚀
