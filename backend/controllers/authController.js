import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {createAccount, findAccountByEmail} from "../models/accountModel.js";

export const register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        
        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !full_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({ message: "Invalid input" });
          }
        const cleanName = full_name.trim();
        const cleanEmail = email.trim().toLowerCase();
        
        const passwordHash = await bcrypt.hash(password, 12);

        const account = await createAccount(cleanName, cleanEmail, passwordHash);

        const token = jwt.sign({accountId: account.account_id}, process.env.JWT_SECRET, {expiresIn: "1d"});

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
        });

        return res.status(201).json({
            message: "Registration successful!",
            account: account
        });
         
    } catch (error) {
        console.error("Registration error: ", error);
        return res.status(500).json({
            message: "Server error during registration."
        });
    }
};

export const login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if(
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message:" Email and password are required."
            });
        }

        const account = await findAccountByEmail(email.trim().toLowerCase());

        if (!account || !account.is_active){
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        console.log("Password received:", typeof password);
        console.log("Hash received:", typeof account.password_hash);

        const passwordMatches = await bcrypt.compare(password, account.password_hash);
        if (!passwordMatches) { 
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
        { accountId: account.account_id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
        );

        
        res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
        });


        return res.json({
            message: "Login successful!",
            account: {
                account_id: account.account_id,
                full_name: account.full_name,
                email: account.email,
                role: account.role,
            },
        });
    }

     catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
        message: "Server error during login.",
        });

    }
};


export const logout = (req, res) => {
  
    res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    });


  return res.json({
    message: "Logged out successfully.",
  });
};

// Keep this import path aligned with the location of your existing emailService.js.
import { randomBytes, createHash } from 'node:crypto';
import { storePasswordResetToken, consumePasswordResetToken } from '../models/accountModel.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/emailService.js';

const resetMessage = 'If an active account exists for this email, a password reset link will be sent.';
const sha256 = (token) => createHash('sha256').update(token).digest('hex');

export const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  try {
    const account = await findAccountByEmail(email.trim().toLowerCase());
    if (account?.is_active) {
      const token = randomBytes(32).toString('hex');
      await storePasswordResetToken(account.account_id, sha256(token));
      const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
      if (!frontendUrl) throw new Error('FRONTEND_URL is missing');
      const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail({ email: account.email, fullName: account.full_name, resetUrl });
    }
    return res.json({ message: resetMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Unable to process your request right now.' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token) ||
      typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ message: 'Invalid reset link or password (8–72 characters required).' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const account = await consumePasswordResetToken(sha256(token), passwordHash);
    if (!account) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    // A notification failure must not undo a successful password change.
    try { await sendPasswordChangedEmail({ email: account.email, fullName: account.full_name }); }
    catch (error) { console.error('Password changed notification failed:', error); }
    return res.json({ message: 'Password updated. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Unable to reset password right now.' });
  }
};
