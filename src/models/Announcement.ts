// models/Announcement.ts
import mongoose, { Schema, models } from 'mongoose';

const announcementSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
    },
    isEmergency: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Announcement = models.Announcement || mongoose.model('Announcement', announcementSchema);

export default Announcement;