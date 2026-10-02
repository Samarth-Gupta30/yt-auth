import userModel from '../models/user.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import sessionModel from '../models/session.model.js';
import { sendEmail } from '../services/email.service.js';
import otpModel from '../models/otp.model.js';
import { generateOtp, getOPTHtml } from '../utils/utils.js';

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    const isAlreadyRegistered = await userModel.findOne({ 
      $or: [{ username }, { email }]
    });

    if (isAlreadyRegistered) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await userModel.create({ username, email, password: hashedPassword });

    const otp = generateOtp();
    const html = getOPTHtml(otp);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await otpModel.create({ email, user: user._id, otpHash });

    await sendEmail(
      email, 
      'Verify your email', 
      `Your OTP for account verification is: ${otp}`, 
      html
    );

    return res.status(201).json({ 
      message: 'User registered successfully. Please check your email for the OTP.', 
      user: {
        username: user.username,
        email: user.email,
        id: user._id,
        verified: user.verified
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { otp, email } = req.body;

    if (!otp || !email) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpDoc = await otpModel.findOne({ email, otpHash });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await userModel.findByIdAndUpdate(
      otpDoc.user,
      { verified: true },
      { new: true }
    );

    await otpModel.deleteMany({ user: otpDoc.user });

    return res.status(200).json({ 
      message: 'Email verified successfully', 
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.verified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');   

    await sessionModel.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    const accessToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('refreshtoken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({ 
      message: 'Login successful',
      accessToken,
      user: {
        username: user.username,
        email: user.email,
        id: user._id
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMe(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'User found', 
      user: {
        username: user.username,
        email: user.email,
        id: user._id
      } 
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshtoken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await sessionModel.findOne({ refreshTokenHash, revoked: false });

    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token session' });
    }          

    const accessToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: '7d' }); 
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie('refreshtoken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ 
      message: 'Access token refreshed successfully',
      accessToken
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshtoken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await sessionModel.findOne({ refreshTokenHash, revoked: false });

    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    session.revoked = true;
    await session.save();

    res.clearCookie('refreshtoken');
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function logoutAll(req, res) {
  try {
    const refreshToken = req.cookies.refreshtoken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    await sessionModel.updateMany({ user: decoded.id, revoked: false }, { revoked: true });

    res.clearCookie('refreshtoken');
    return res.status(200).json({ message: 'Logout from all sessions successful' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}