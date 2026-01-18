# Walkthrough: Fixing Calendar Overlap (Dhabas & Vehicles)

Successfully resolved the issue where the Flatpickr calendar was overlapping disparate page content on the Dhabas and Vehicles show pages. This was achieved by applying a consistent positioning strategy similar to the fix implemented for Listings.

## Changes Made

### 1. Structural Enhancements
- Wrapped date inputs in a `.date-input-group` container with `position: relative`. This ensures that Flatpickr's `static: true` positioning has a reliable anchor.
- Updated `views/dhabas/show.ejs` and `views/vehicles/show.ejs` with this new HTML structure.

### 2. Flatpickr Configuration
- Added `static: true` to all Flatpickr initializations in Dhabas and Vehicles.
- Set `monthSelectorType: "static"` for a cleaner, consistent look across all calendar instances.

### 3. CSS Overrides
- Implemented specific CSS for `.flatpickr-calendar.static` to ensure it appears directly below the input with appropriate spacing and shadow.
- This prevents the calendar from floating detached over the page and keeps it "inside" the booking widget or modal context.

## Verification Results

### Dhaba Reservation Modal
The calendar is now properly contained within the modal and anchored to the "Select Date" input.

![Dhaba Final Fix](file:///c:/Users/Asus/Desktop/Final-Year-Project/docs/dhaba_final_fix.png)

### Vehicle Booking Widget
The calendar is correctly positioned below the "Pick-up" and "Return" fields in the sidebar, intelligently flipping only when necessary for visibility.

![Vehicle Final Fix](file:///c:/Users/Asus/Desktop/Final-Year-Project/docs/vehicle_final_fix.png)

## Summary of Completed Tasks
- [x] Fixed Listings calendar overlap
- [x] Fixed Dhabas calendar overlap
- [x] Fixed Vehicles calendar overlap
- [x] Verified consistent behavior across the entire platform
