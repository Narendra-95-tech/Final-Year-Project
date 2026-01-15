const Listing = require('../../../models/listing');
const User = require('../../../models/user');

describe('Listing Model', () => {
    let testUser;

    beforeEach(async () => {
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
        });
    });

    it('should create a valid listing', async () => {
        const listingData = {
            title: 'Test Listing',
            description: 'A beautiful test property',
            price: 5000,
            location: 'Mumbai',
            country: 'India',
            owner: testUser._id,
            propertyType: 'Apartment',
            guests: 2,
        };

        const listing = await Listing.create(listingData);

        expect(listing.title).toBe('Test Listing');
        expect(listing.price).toBe(5000);
        expect(listing.owner.toString()).toBe(testUser._id.toString());
    });

    it('should fail without required fields', async () => {
        const listing = new Listing({});

        await expect(listing.save()).rejects.toThrow();
    });

    it('should have default values', async () => {
        const listing = await Listing.create({
            title: 'Test',
            price: 1000,
            location: 'Test',
            country: 'Test',
            owner: testUser._id,
        });

        expect(listing.propertyType).toBe('Apartment');
        expect(listing.guests).toBe(1);
        expect(listing.bedrooms).toBe(1);
    });

    it('should validate price is a number', async () => {
        const listing = new Listing({
            title: 'Test',
            price: 'not a number',
            location: 'Test',
            country: 'Test',
            owner: testUser._id,
        });

        await expect(listing.save()).rejects.toThrow();
    });
});
