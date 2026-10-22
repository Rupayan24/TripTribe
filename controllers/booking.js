const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.body;

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    req.flash("error", "Please provide valid check-in and check-out dates.");
    return res.redirect(`/listings/${id}`);
  }

  if (startDate < now) {
    req.flash("error", "Check-in date cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  if (startDate >= endDate) {
    req.flash("error", "Check-out date must be strictly after check-in date.");
    return res.redirect(`/listings/${id}`);
  }

  // Start MongoDB ACID Transaction session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const listing = await Listing.findById(id).session(session);
    if (!listing) {
      await session.abortTransaction();
      session.endSession();
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    if (listing.owner && listing.owner.equals(req.user._id)) {
      await session.abortTransaction();
      session.endSession();
      req.flash("error", "You cannot book your own property.");
      return res.redirect(`/listings/${id}`);
    }

    // Overlap condition: (existing.checkIn < new.checkOut) AND (existing.checkOut > new.checkIn)
    const conflict = await Booking.findOne({
      listing: id,
      status: "confirmed",
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    }).session(session);

    if (conflict) {
      await session.abortTransaction();
      session.endSession();
      req.flash(
        "error",
        "Selected dates are already booked by another traveler.",
      );
      return res.redirect(`/listings/${id}`);
    }

    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * listing.price;

    const newBooking = new Booking({
      listing: id,
      guest: req.user._id,
      checkIn: startDate,
      checkOut: endDate,
      totalNights: diffDays,
      totalPrice,
      status: "confirmed",
    });

    await newBooking.save({ session });

    await session.commitTransaction();
    session.endSession();

    req.flash("success", "Reservation confirmed successfully!");
    res.redirect("/bookings/my-trips");
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    req.flash("error", "Booking failed: " + err.message);
    res.redirect(`/listings/${id}`);
  }
};

module.exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });

  res.render("bookings/myTrips.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    _id: bookingId,
    guest: req.user._id,
  });
  if (!booking) {
    req.flash("error", "Reservation not found or unauthorized.");
    return res.redirect("/bookings/my-trips");
  }

  booking.status = "cancelled";
  await booking.save();

  req.flash("success", "Reservation cancelled.");
  res.redirect("/bookings/my-trips");
};
