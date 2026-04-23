const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../schemas/adminShema");
const dotenv = require("dotenv");


dotenv.config();

const adminAuth = async (req, res, next) => {
    try {

        const { adminToken } = req.cookies;

        if (!adminToken) {
            return res.status(401).json({ 'message': 'unauthorised access.' });
        }

        const isValidToken = await jwt.verify(adminToken, process.env.jwtSecretKey);

        if (!isValidToken) {
            return res.status(401).json({ 'message': 'Token invalid.' });
        }

        const isValidAdmin = await Admin.findOne({ _id: isValidToken.id });

        const { role } = isValidAdmin;

        if (isValidToken.role !== role) {
            return res.status(401).json({ 'message': 'unauthorised access.' });
        }

        req.admin = isValidAdmin;
        next();

    } catch (error) {
        return res.status(500).json({ 'message': 'Something went wrong.' })
    }
}

module.exports = {
    adminAuth
}