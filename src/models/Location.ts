// models/Location.ts
import mongoose, { Schema, models } from 'mongoose';

const locationSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        unique: true,
        trim: true,
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1'],
    },
    description: {
        type: String,
    },
    allocationPercentage: {
        type: Number,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Location = models.Location || mongoose.model('Location', locationSchema);

export default Location;