import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module'; // Added this

// Initialize the "require" function for ES Modules
const require = createRequire(import.meta.url);
const yahooFinance = require('yahoo-finance2').default; // Use the reliable CJS loader

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'No symbols provided' });

        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());

        // Now yahooFinance.quote is guaranteed to be found
        const results = await yahooFinance.quote(symbolArray);
        
        const formattedResults = Array.isArray(results) ? results : [results];
        
        const cleanData = formattedResults.map(stock => ({
            symbol: stock.symbol,
            price: stock.regularMarketPrice || stock.preMarketPrice || 0,
            currency: stock.currency,
            change: stock.regularMarketChangePercent || 0
        }));

        res.json(cleanData);
    } catch (error) {
        console.error('Yahoo Finance Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch prices', details: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});