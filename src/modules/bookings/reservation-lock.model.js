import mongoose from 'mongoose';

/**
 * ReservationLock model ensures atomic concurrency control
 * against simultaneous duplicate bookings for the same bungalow.
 */
const reservationLockSchema = new mongoose.Schema(
  {
    bungalow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bungalow',
      required: true,
      index: true,
    },
    // Normalized date key string e.g., "YYYY-MM-DD" for each night reserved
    dateKey: {
      type: String,
      required: true,
    },
    bookingId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index guarantees that no two active bookings can reserve the same bungalow on the same night
reservationLockSchema.index({ bungalow: 1, dateKey: 1 }, { unique: true });

export const ReservationLock = mongoose.model('ReservationLock', reservationLockSchema);
