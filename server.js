const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

let users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
let tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));

app.use(bodyParser.json());
app.use(express.static('public'));

// Generate a token
function generateToken() {
    return crypto.randomBytes(20).toString('hex');
}

// Send email function
function sendResetEmail(email, token) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    let mailOptions = {
        to: email,
        from: 'passwordreset@example.com',
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n +`
              `Please click on the following link, or paste this into your browser to complete the process:\n\n +`
              `http://localhost:${PORT}/reset-password.html?token=${token}\n\n +`
              `If you did not request this, please ignore this email and your password will remain unchanged.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// Registration endpoint
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (users[email]) {
        res.json({ success: false, message: 'Email already registered.' });
        return;
    }

    users[email] = { name, email, password };
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ success: true });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!users[email] || users[email].password !== password) {
        res.json({ success: false, message: 'Invalid email or password.' });
        return;
    }

    res.json({ success: true, user: users[email] });
});

// Forgot password endpoint
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!users[email]) {
        res.json({ success: false, message: 'Email not registered.' });
        return;
    }

    const token = generateToken();
    tokens[token] = email;
    fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));

    sendResetEmail(email, token);
    res.json({ success: true, message: 'Password reset link sent to your email.' });
});

// Reset password endpoint
app.post('/reset-password', (req, res) => {
    const { token, password } = req.body;
    const email = tokens[token];

    if (!email) {
        res.json({ success: false, message: 'Invalid or expired token.' });
        return;
    }

    users[email].password = password;
    delete tokens[token];
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));

    res.json({ success: true, message: 'Password has been reset.' });
});

// Profile update endpoint
app.post('/profile', (req, res) => {
    const { name, address, phone, email } = req.body;

    if (!users[email]) {
        res.json({ success: false, message: 'User not found.' });
        return;
    }

    users[email] = { ...users[email], name, address, phone };
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ success: true, message: 'Profile updated successfully.' });
});

app.listen(PORT, () => {
    console.log('Server running on http://localhost:${PORT}');
});