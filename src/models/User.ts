// models/User.ts
import mongoose, { Schema, models, Model } from 'mongoose';

interface IUser {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'participant';
    registrationDate: Date;
    isJudge?: boolean;
    judgeProfile?: mongoose.Types.ObjectId | null;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'participant'],
        default: 'participant',
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    isJudge: {
        type: Boolean,
        default: false,
    },
    judgeProfile: {
        type: Schema.Types.ObjectId,
        ref: 'Judge',
        default: null,
    },
});

// Check if model exists to prevent recompilation during hot reload in development
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', userSchema);

export default User;