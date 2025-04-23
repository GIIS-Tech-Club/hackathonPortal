import mongoose, { Schema, models } from 'mongoose';
import crypto from 'crypto';

const judgeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: [true, 'Judge name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Judge email is required'],
        trim: true,
        lowercase: true,
    },
    accessCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(3).toString('hex').toUpperCase(),
    },
    assignedRoom: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        enum: ['participant', 'external'],
        required: [true, 'Judge type is required'],
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'JudgingEvent',
        required: [true, 'Judging event is required'],
    },
    currentAssignment: {
        type: Schema.Types.ObjectId,
        ref: 'JudgingAssignment',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Judge = models.Judge || mongoose.model('Judge', judgeSchema);

export default Judge;