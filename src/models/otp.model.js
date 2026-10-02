import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    otpHash: {
      type: String,
      required: [true, 'OTP hash is required']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600 // OTP automatically deletes from MongoDB after 10 minutes (600s)
    }
  }
);

const otpModel = mongoose.model('Otp', otpSchema);

export default otpModel;