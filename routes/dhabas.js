const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const wrapAsync = require("../utils/wrapAsync");
const dhabaController = require("../controllers/dhabas_simple");
const { isLoggedIn, isOwner, validateDhaba, normalizeDhabaForm, isEmailVerified } = require("../middleware");

// ============================
// DHABA ROUTES
// ============================

// GET all dhabas or POST new dhaba
router
  .route("/")
  .get(wrapAsync(dhabaController.index))
  .post(
    isLoggedIn,
    isEmailVerified,
    upload.array("dhaba[image]", 5),
    normalizeDhabaForm,
    validateDhaba,
    wrapAsync(dhabaController.createDhaba)
  );

// New Dhaba Form
router.get("/new", isLoggedIn, isEmailVerified, dhabaController.renderNewForm);

// ============================
// SINGLE DHABA ROUTES
// ============================
router
  .route("/:id")
  .get(wrapAsync(dhabaController.showDhaba))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("dhaba[image]", 5),
    normalizeDhabaForm,
    validateDhaba,
    wrapAsync(dhabaController.updateDhaba)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(dhabaController.destroyDhaba));

// Edit Form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(dhabaController.renderEditForm));

module.exports = router;
