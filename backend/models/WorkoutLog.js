const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
    },

    distance: {
      type: Number,
      default: null,
    },

    minutes: {
      type: Number,
      default: null,
    },

    caloriesBurned: {
      type: Number,
      default: 0,
    },

    date: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutLog', WorkoutSchema);
