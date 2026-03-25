import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the entire module as a raw object
import * as yfRaw from 'yahoo-finance2';

// --- BRUTE FORCE EXPORT RESOLVER ---
// Render.com sometimes nests module exports weirdly. 
// This checks every possible location for the 'quote' function.
let quoteFn = null;
if (typeof yfRaw.quote === 'function') {
    quoteFn = yfRaw.quote;
} else if (yfRaw.default && typeof yfRaw.default.quote === 'function') {
    quoteFn = yfRaw.default.quote;
} else if (yfRaw.default && yfRaw.default.default && typeof yfRaw.default.default.quote === 'function') {
    quoteFn = yfRaw.default.default.quote;
}

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        if (!quoteFn) {
            throw new Error('Critical: Could not locate the Yahoo Finance quote function.');
        }

        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'No symbols provided' });

        // Format symbols for Yahoo (e.g., BTC/USD -> BTC-USD)
        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase().replace('/', '-'));

        // Fetch using our safely extracted function
        const results = await quoteFn(symbolArray);
        
        // Ensure the response is always formatted as an array
        const resultsArray = Array.isArray(results) ? results : [results];

        // Format data to match what the frontend expects
        const cleanData = resultsArray.map(stock => ({
            symbol: stock.symbol,
            price: stock.regularMarketPrice || stock.preMarketPrice || stock.ask || 0
        }));

        res.json(cleanData);
    } catch (error) {
        console.error('Yahoo API Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});