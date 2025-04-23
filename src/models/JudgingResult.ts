import mongoose, { Schema, models } from 'mongoose';

const judgingResultSchema = new Schema({
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
    scores: {
        type: Map,
        of: Number,
        default: {},
    },
    overallScore: {
        type: Number,
        required: [true, 'Overall score is required'],
    },
    comments: {
        type: String,
        default: '',
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

const JudgingResult = models.JudgingResult || mongoose.model('JudgingResult', judgingResultSchema);

export default JudgingResult;