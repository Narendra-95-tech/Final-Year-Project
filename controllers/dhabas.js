const Dhaba = require("../models/dhaba");
const Review = require("../models/review");
const crypto = require("crypto");

const Dhaba = require("../models/dhaba");
const Review = require("../models/review");
const crypto = require("crypto");

module.exports.index = async (req, res) => {
  const { q, cuisine, sort } = req.query;

  const filter = {};

  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [
      { name: regex },
      { cuisine: regex },
      { location: regex },
      { description: regex }
    ];
  }

  if (cuisine && cuisine !== 'all' && cuisine.trim()) {
    const cuisineRegex = new RegExp(cuisine.trim(), "i");
    filter.cuisine = cuisineRegex;
  }

  const sortMap = {
    rating: { rating: -1 },
    newest: { _id: -1 },
    name: { name: 1 }
  };
  const sortOption = sortMap[sort] || {};

  try {
    const allDhabas = await Dhaba.find(filter).sort(sortOption).populate("owner");
    const trendingDhabas = await Dhaba.find({}).sort({ rating: -1 }).limit(6);

    res.render("dhabas/index", {
      allDhabas,
      trendingDhabas,
      query: q || "",
      cuisine: cuisine || "",
      sort: sort || ""
    });
  } catch (err) {
    console.error(err);
    res.render("error", { message: "Error loading dhabas" });
  }
};
  });
};

module.exports.renderNewForm = (req, res) => {
  const createToken = crypto.randomBytes(16).toString("hex");
  req.session.createToken = createToken;
  res.render("dhabas/new", { createToken });
};

module.exports.createDhaba = async (req, res) => {
  const payload = req.body.dhaba || {};
  const ownerId = req.user?._id || null;

  // Convert checkbox values from "on" to boolean for services and facilities
  if (payload.services) {
    payload.services = {
      dineIn: payload.services.dineIn === 'on' || payload.services.dineIn === true,
      takeaway: payload.services.takeaway === 'on' || payload.services.takeaway === true,
      homeDelivery: payload.services.homeDelivery === 'on' || payload.services.homeDelivery === true,
      catering: payload.services.catering === 'on' || payload.services.catering === true
    };
  }

  // Handle facilities - can be array from checkboxes or object
  if (payload.facilities) {
    if (Array.isArray(payload.facilities)) {
      // Already an array from new form
      payload.facilities = payload.facilities;
    } else if (typeof payload.facilities === 'object') {
      // Object format from old form
      payload.facilities = {
        ac: payload.facilities.ac === 'on' || payload.facilities.ac === true,
        parking: payload.facilities.parking === 'on' || payload.facilities.parking === true,
        wifi: payload.facilities.wifi === 'on' || payload.facilities.wifi === true,
        outdoorSeating: payload.facilities.outdoorSeating === 'on' || payload.facilities.outdoorSeating === true,
        familySection: payload.facilities.familySection === 'on' || payload.facilities.familySection === true,
        liveMusic: payload.facilities.liveMusic === 'on' || payload.facilities.liveMusic === true,
        cardPayment: payload.facilities.cardPayment === 'on' || payload.facilities.cardPayment === true,
        washroom: payload.facilities.washroom === 'on' || payload.facilities.washroom === true
      };
    } else {
      // Single value, convert to array
      payload.facilities = [payload.facilities];
    }
  } else {
    payload.facilities = [];
  }

  // Handle cuisine as array if provided
  if (payload.cuisine && typeof payload.cuisine === 'string') {
    payload.cuisine = payload.cuisine.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  // Handle specialties as array if provided
  if (payload.specialties && typeof payload.specialties === 'string') {
    payload.specialties = payload.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  // Idempotency: ensure form processed only once per token
  const token = req.body.createToken;
  if (!token || req.session.createToken !== token) {
    req.flash("error", "Invalid or expired form submission.");
    return res.redirect("/dhabas/new");
  }
  req.session.createToken = null;

  // Duplicate guard: prevent identical records for same owner
  if (ownerId) {
    const existing = await Dhaba.findOne({
      owner: ownerId,
      name: payload.name,
      price: payload.price,
    });
    if (existing) {
      req.flash("success", "Dhaba already exists.");
      return res.redirect("/dhabas");
    }
  }

  const dhaba = new Dhaba(payload);
  dhaba.owner = ownerId;

  if (req.file) {
    dhaba.image = { url: req.file.path, filename: req.file.filename };
  }

  // Geocode from location if provided
  if (payload.location && typeof payload.location === "string" && process.env.MAP_TOKEN) {
    try {
      const geocodingClient = require('@mapbox/mapbox-sdk/services/geocoding');
      const client = geocodingClient({ accessToken: process.env.MAP_TOKEN });
      const response = await client.forwardGeocode({
        query: payload.location,
        limit: 1,
      }).send();

      const center = response.body?.features?.[0]?.center;
      if (Array.isArray(center) && center.length === 2) {
        dhaba.geometry = { type: "Point", coordinates: center };
      }
    } catch (e) {
      console.error("Geocoding error:", e.message);
      // Continue without geocoding - not critical
    }
  }

  try {
    await dhaba.save();
    req.flash("success", "New dhaba added!");
    res.redirect("/dhabas");
  } catch (e) {
    if (e && e.code === 11000) {
      req.flash("success", "Dhaba already exists.");
      return res.redirect("/dhabas");
    }
    throw e;
  }
};

module.exports.showDhaba = async (req, res) => {
  const dhaba = await Dhaba.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!dhaba) {
    req.flash("error", "Dhaba not found");
    return res.redirect("/dhabas");
  }

  // Backfill geometry from location if missing
  if ((!dhaba.geometry || !Array.isArray(dhaba.geometry.coordinates)) && dhaba.location && process.env.MAP_TOKEN) {
    try {
      const geocodingClient = require('@mapbox/mapbox-sdk/services/geocoding');
      const client = geocodingClient({ accessToken: process.env.MAP_TOKEN });
      const response = await client.forwardGeocode({
        query: dhaba.location,
        limit: 1,
      }).send();

      const center = response.body?.features?.[0]?.center;
      if (Array.isArray(center) && center.length === 2) {
        dhaba.geometry = { type: "Point", coordinates: center };
        await dhaba.save();
      }
    } catch (e) {
      console.error("Backfill geocoding error:", e.message);
      // Continue without geocoding - not critical
    }
  }

  res.render("dhabas/show", {
    dhaba,
    mapToken: process.env.MAP_TOKEN,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
};

module.exports.renderEditForm = async (req, res) => {
  const dhaba = await Dhaba.findById(req.params.id);
  if (!dhaba) {
    req.flash("error", "Dhaba not found");
    return res.redirect("/dhabas");
  }
  res.render("dhabas/edit", { dhaba });
};

module.exports.updateDhaba = async (req, res) => {
  const { id } = req.params;
  const payload = req.body.dhaba || {};

  // Convert checkbox values from "on" to boolean
  if (payload.services) {
    payload.services = {
      dineIn: payload.services.dineIn === 'on' || payload.services.dineIn === true,
      takeaway: payload.services.takeaway === 'on' || payload.services.takeaway === true,
      homeDelivery: payload.services.homeDelivery === 'on' || payload.services.homeDelivery === true,
      catering: payload.services.catering === 'on' || payload.services.catering === true
    };
  }

  if (payload.facilities) {
    payload.facilities = {
      ac: payload.facilities.ac === 'on' || payload.facilities.ac === true,
      parking: payload.facilities.parking === 'on' || payload.facilities.parking === true,
      wifi: payload.facilities.wifi === 'on' || payload.facilities.wifi === true,
      outdoorSeating: payload.facilities.outdoorSeating === 'on' || payload.facilities.outdoorSeating === true,
      familySection: payload.facilities.familySection === 'on' || payload.facilities.familySection === true,
      liveMusic: payload.facilities.liveMusic === 'on' || payload.facilities.liveMusic === true,
      cardPayment: payload.facilities.cardPayment === 'on' || payload.facilities.cardPayment === true,
      washroom: payload.facilities.washroom === 'on' || payload.facilities.washroom === true
    };
  }

  // Handle cuisine as array
  if (payload.cuisine && typeof payload.cuisine === 'string') {
    payload.cuisine = payload.cuisine.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  // Handle specialties as array
  if (payload.specialties && typeof payload.specialties === 'string') {
    payload.specialties = payload.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  const dhaba = await Dhaba.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!dhaba) {
    req.flash("error", "Dhaba not found");
    return res.redirect("/dhabas");
  }

  if (req.file) {
    dhaba.image = { url: req.file.path, filename: req.file.filename };
    await dhaba.save();
  }

  // Re-geocode if location changed
  if (payload.location && typeof payload.location === "string" && process.env.MAP_TOKEN) {
    try {
      const geocodingClient = require('@mapbox/mapbox-sdk/services/geocoding');
      const client = geocodingClient({ accessToken: process.env.MAP_TOKEN });
      const response = await client.forwardGeocode({
        query: payload.location,
        limit: 1,
      }).send();

      const center = response.body?.features?.[0]?.center;
      if (Array.isArray(center) && center.length === 2) {
        dhaba.geometry = { type: "Point", coordinates: center };
        await dhaba.save();
      }
    } catch (e) {
      console.error("Update geocoding error:", e.message);
      // Continue without geocoding - not critical
    }
  }

  req.flash("success", "Dhaba updated");
  res.redirect(`/dhabas/${dhaba._id}`);
};

module.exports.destroyDhaba = async (req, res) => {
  const { id } = req.params;
  await Dhaba.findByIdAndDelete(id);
  req.flash("success", "Dhaba deleted");
  res.redirect("/dhabas");
};
