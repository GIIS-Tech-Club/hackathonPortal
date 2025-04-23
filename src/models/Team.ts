// models/Team.ts
import mongoose, { Schema, models } from 'mongoose';
import crypto from 'crypto';

const teamSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Team description is required'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    inviteCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(3).toString('hex').toUpperCase()
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    leader: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Team leader is required'],
    },
    maxSize: {
        type: Number,
        default: 4,
        min: [1, 'Team must have at least 1 member'],
        max: [4, 'Team cannot have more than 4 members'],
    },
    category: {
        type: String,
        enum: ['web', 'mobile', 'ai', 'data', 'game', 'iot', 'other'],
        default: 'other',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    rejectionReason: {
        type: String,
    },
    seatLocation: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    tableNumber: {
        type: String,
        default: null,
    },
    tableMap: {
        type: String,
        default: null,
    },
    demoScore: {
        type: Number,
        default: 0,
    },
    demoScoreConfidence: {
        type: Number,
        default: 0,
    },
    timesJudged: {
        type: Number,
        default: 0,
    },
});

const Team = models.Team || mongoose.model('Team', teamSchema);

export default Team;