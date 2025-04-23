import mongoose, { Schema, models } from 'mongoose';

const judgingCriteriaSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Criteria name is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Criteria description is required'],
    },
    weight: {
        type: Number,
        default: 1,
        min: [0, 'Weight cannot be negative'],
    },
    minScore: {
        type: Number,
        default: 1,
    },
    maxScore: {
        type: Number,
        default: 10,
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'JudgingEvent',
        required: [true, 'Judging event is required'],
    },
});

const JudgingCriteria = models.JudgingCriteria || mongoose.model('JudgingCriteria', judgingCriteriaSchema);

export default JudgingCriteria;