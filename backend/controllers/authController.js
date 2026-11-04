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
