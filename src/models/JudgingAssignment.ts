import mongoose, { Schema, models } from 'mongoose';

const judgingAssignmentSchema = new Schema({
    judge: {
        type: Schema.Types.ObjectId,
        ref: 'Judge',
        required: [true, 'Judge is required'],
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: [true, 'Team is required'],
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'skipped'],
        default: 'pending',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'JudgingEvent',
        required: [true, 'Judging event is required'],
    },
});

const JudgingAssignment = models.JudgingAssignment || mongoose.model('JudgingAssignment', judgingAssignmentSchema);

export default JudgingAssignment;