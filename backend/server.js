const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

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
    database: process.env.DB_NAME,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => console.error('Connection error', err.stack));

// Helper function to calculate median
const calculateMedian = (arr) => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Helper function to calculate range
const calculateRange = (mean, stdDev = 0.2) => {
    return {
        low: mean - mean * stdDev,
        high: mean + mean * stdDev,
    };
};

// API to Save Rental Data
app.post('/api/rentals', async (req, res) => {
    const { area, rentalPrices } = req.body;

    if (!rentalPrices || rentalPrices.length < 4) {
        return res.status(400).json({ message: 'Provide at least 4 rental prices' });
    }

    const mean = rentalPrices.reduce((a, b) => a + b, 0) / rentalPrices.length;
    const median = calculateMedian(rentalPrices);
    const range = calculateRange(mean);

    try {
        const result = await pool.query(
            'INSERT INTO rentals (area, rental_prices, mean_price, median_price, price_range) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [area, rentalPrices, mean, median, JSON.stringify(range)]
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

        const priceRange = rental.price_range;
        const meanPrice = rental.mean_price;
        const medianPrice = rental.median_price;

        // Validation logic
        let verdict = 'Fair';
        if (rentPrice < priceRange.low) {
            verdict = 'Underpriced';
        } else if (rentPrice > priceRange.high) {
            verdict = 'Overpriced';
        }

        const response = { 
            area, 
            rentPrice, 
            meanPrice, 
            medianPrice, 
            priceRange, 
            verdict 
        };
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Failed to validate rental price', error });
    }
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


