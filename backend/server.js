const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
// Add this right after require('dotenv').config();
console.log('Environment Variables:', {
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME
});

const app = express();

app.get('/', (req, res) => {
    res.send('Rental Price Validator Backend is Running!');
});


// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL Pool


const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => console.error('Connection error', err.stack));

// API to Save Rental Data
app.post('/api/rentals', async (req, res) => {
    const { area, rentalPrices } = req.body;
    const averagePrice = rentalPrices.reduce((a, b) => a + b, 0) / rentalPrices.length;

    try {
        const result = await pool.query(
            'INSERT INTO rentals (area, rental_prices, average_price) VALUES ($1, $2, $3) RETURNING *',
            [area, rentalPrices, averagePrice]
        );
        res.status(201).json({ message: 'Rental data saved successfully!', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save rental data', error });
    }
});

// API to Validate Rental Price
app.post('/api/validate', async (req, res) => {
    const { area, rentPrice } = req.body;

    try {
        const result = await pool.query('SELECT * FROM rentals WHERE area = $1', [area]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No data found for the specified area' });
        }

        const rental = result.rows[0];
        const averagePrice = rental.average_price;

        let verdict = 'Equal to average';
        if (rentPrice > averagePrice) {
            verdict = 'Overpriced';
        } else if (rentPrice < averagePrice) {
            verdict = 'Underpriced';
        }

        res.status(200).json({ area, averagePrice, verdict });
    } catch (error) {
        res.status(500).json({ message: 'Failed to validate rental price', error });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

