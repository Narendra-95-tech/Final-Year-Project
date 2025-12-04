const Dhaba = require("../models/dhaba");
const Review = require("../models/review");
const crypto = require("crypto");

module.exports.index = async (req, res) => {
  const { q, cuisine, category, sort, minRating, facilities } = req.query;

  const filter = {};

  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [
      { title: regex },
      { cuisine: regex },
      { location: regex },
      { country: regex },
      { description: regex }
    ];
  }

  if (cuisine && cuisine !== 'all' && cuisine.trim()) {
    filter.cuisine = cuisine.trim();
  }

  if (category && category !== 'all' && category.trim()) {
    filter.category = category.trim();
  }

  if (facilities && facilities.length > 0) {
    filter.facilities = { $in: facilities };
  }

  if (minRating && minRating.trim()) {
    filter.rating = { $gte: parseFloat(minRating.trim()) };
  }

  const sortMap = {
    rating: { rating: -1 },
    newest: { _id: -1 },
    title: { title: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 }
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
      category: category || "",
      facilities: facilities || [],
      minRating: minRating || "",
      sort: sort || ""
    });
  } catch (err) {
    console.error(err);
    res.render("error", { message: "Error loading dhabas" });
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("dhabas/new");
};

module.exports.createDhaba = async (req, res) => {
  try {
    const newDhaba = new Dhaba(req.body.dhaba);
    newDhaba.owner = req.user._id;

    if (req.file) {
      newDhaba.image = { url: req.file.path, filename: req.file.filename };
    }

    // Geocode location if Mapbox token is available
    if (req.body.dhaba.location && process.env.MAP_TOKEN) {
      try {
        const geocodingClient = require('@mapbox/mapbox-sdk/services/geocoding');
        const client = geocodingClient({ accessToken: process.env.MAP_TOKEN });
        const response = await client.forwardGeocode({
          query: req.body.dhaba.location,
          limit: 1,
        }).send();

        const center = response.body?.features?.[0]?.center;
        if (Array.isArray(center) && center.length === 2) {
          newDhaba.geometry = { type: "Point", coordinates: center };
        }
      } catch (geocodeErr) {
        console.error("Geocoding error:", geocodeErr.message);
      }
    }

    await newDhaba.save();
    req.flash("success", "New dhaba created!");
    res.redirect("/dhabas");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error creating dhaba");
    res.redirect("/dhabas/new");
  }
};

module.exports.showDhaba = async (req, res) => {
  const { id } = req.params;
  try {
    const dhaba = await Dhaba.findById(id).populate({
      path: "reviews",
      populate: { path: "author" }
    }).populate("owner");

    if (!dhaba) {
      req.flash("error", "Dhaba not found");
      return res.redirect("/dhabas");
    }

    res.render("dhabas/show", {
      dhaba,
      mapToken: process.env.MAP_TOKEN
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading dhaba");
    res.redirect("/dhabas");
  }
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  try {
    const dhaba = await Dhaba.findById(id);
    if (!dhaba) {
      req.flash("error", "Dhaba not found");
      return res.redirect("/dhabas");
    }

    if (!dhaba.owner.equals(res.locals.currUser._id)) {
      req.flash("error", "You are not the owner of this dhaba");
      return res.redirect(`/dhabas/${id}`);
    }

    res.render("dhabas/edit", { dhaba });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading edit form");
    res.redirect("/dhabas");
  }
};

module.exports.updateDhaba = async (req, res) => {
  const { id } = req.params;
  try {
    const dhaba = await Dhaba.findById(id);
    if (!dhaba) {
      req.flash("error", "Dhaba not found");
      return res.redirect("/dhabas");
    }

    if (!dhaba.owner.equals(res.locals.currUser._id)) {
      req.flash("error", "You are not the owner of this dhaba");
      return res.redirect(`/dhabas/${id}`);
    }

    // Update dhaba with new data
    Object.assign(dhaba, req.body.dhaba);

    if (req.file) {
      dhaba.image = { url: req.file.path, filename: req.file.filename };
    }

    // Update location if changed
    if (req.body.dhaba.location && process.env.MAP_TOKEN) {
      try {
        const geocodingClient = require('@mapbox/mapbox-sdk/services/geocoding');
        const client = geocodingClient({ accessToken: process.env.MAP_TOKEN });
        const response = await client.forwardGeocode({
          query: req.body.dhaba.location,
          limit: 1,
        }).send();

        const center = response.body?.features?.[0]?.center;
        if (Array.isArray(center) && center.length === 2) {
          dhaba.geometry = { type: "Point", coordinates: center };
        }
      } catch (geocodeErr) {
        console.error("Geocoding error:", geocodeErr.message);
      }
    }

    await dhaba.save();
    req.flash("success", "Dhaba updated successfully!");
    res.redirect(`/dhabas/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating dhaba");
    res.redirect(`/dhabas/${id}/edit`);
  }
};

module.exports.destroyDhaba = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedDhaba = await Dhaba.findByIdAndDelete(id);
    if (!deletedDhaba) {
      req.flash("error", "Dhaba not found");
      return res.redirect("/dhabas");
    }

    req.flash("success", "Dhaba deleted successfully!");
    res.redirect("/dhabas");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error deleting dhaba");
    res.redirect("/dhabas");
  }
};
