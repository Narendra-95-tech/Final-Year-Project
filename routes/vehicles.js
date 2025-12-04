const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const wrapAsync = require("../utils/wrapAsync");
const vehicleController = require("../controllers/vehicles");
const Vehicle = require("../models/vehicle");
const { isLoggedIn, isOwner, validateVehicle, normalizeVehicleForm } = require("../middleware");

// ============================
// VEHICLE ROUTES
// ============================

// GET all vehicles or POST new vehicle
router
  .route("/")
  .get(wrapAsync(vehicleController.index))
  .post(
    isLoggedIn,
    upload.single("vehicle[image]"),
    normalizeVehicleForm,
    validateVehicle,
    wrapAsync(vehicleController.createVehicle)
  );

// New Vehicle Form
router.get("/new", isLoggedIn, vehicleController.renderNewForm);

// ============================
// SINGLE VEHICLE ROUTES
// ============================
router
  .route("/:id")
  .get(wrapAsync(vehicleController.showVehicle))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("vehicle[image]"),
    validateVehicle,
    wrapAsync(vehicleController.updateVehicle)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(vehicleController.destroyVehicle));

// Edit Form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(vehicleController.renderEditForm));

// Get Bookings for Calendar
router.get("/:id/bookings", wrapAsync(vehicleController.getVehicleBookings));

module.exports = router;
