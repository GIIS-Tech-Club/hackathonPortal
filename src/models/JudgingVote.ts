// models/JudgingVote.ts
import mongoose, { Schema, models } from 'mongoose';

const judgingVoteSchema = new Schema({
    judge: {
        type: Schema.Types.ObjectId,
        ref: 'Judge',
        required: [true, 'Judge is required'],
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'JudgingEvent',
        required: [true, 'Judging event is required'],
    },
    winningTeam: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: [true, 'Winning team is required'],
    },
    losingTeam: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: [true, 'Losing team is required'],
    },
    isDraw: {
        type: Boolean,
        default: false,
    },
    assignment: {
        type: Schema.Types.ObjectId,
        ref: 'JudgingAssignment',
        required: [true, 'Assignment is required'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const JudgingVote = models.JudgingVote || mongoose.model('JudgingVote', judgingVoteSchema);

export default JudgingVote;