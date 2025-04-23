import mongoose, { Schema, models } from 'mongoose';

const judgingEventSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['demo_participants', 'demo_judges', 'pitching'],
        required: [true, 'Judging type is required'],
    },
    status: {
        type: String,
        enum: ['setup', 'active', 'completed'],
        default: 'setup',
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required'],
    },
    settings: {
        minJudgesPerProject: {
            type: Number,
            default: 2,
        },
        roomCount: {
            type: Number,
            default: 1,
        },
        criteriaWeights: {
            type: Map,
            of: Number,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const JudgingEvent = models.JudgingEvent || mongoose.model('JudgingEvent', judgingEventSchema);

export default JudgingEvent;
