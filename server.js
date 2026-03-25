import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'No symbols provided' });

        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());

        // FIX: Some versions of this library nest the functions under .default
        // This check ensures we find the 'quote' function regardless of environment
        const yf = yahooFinance.default || yahooFinance;

        if (typeof yf.quote !== 'function') {
            throw new Error('Yahoo Finance quote function not found');
        }

        const results = await yf.quote(symbolArray);
        
        // Ensure result is always an array
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