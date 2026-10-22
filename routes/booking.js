const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.js");
const { isLoggedIn } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");

router.get("/my-trips", isLoggedIn, wrapAsync(bookingController.getUserBookings));
router.post(
  "/listings/:id/book",
  isLoggedIn,
  wrapAsync(bookingController.createBooking),
);
router.post(
  "/:bookingId/cancel",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking),
);

module.exports = router;
