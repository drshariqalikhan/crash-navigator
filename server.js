import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'No symbols' });

        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase().replace('/', '-'));

        // FIX: Handle the "is not a function" error by checking both direct and default exports
        const provider = yahooFinance.quote ? yahooFinance : yahooFinance.default;
        
        if (!provider || typeof provider.quote !== 'function') {
            throw new Error('Yahoo Finance quote function could not be initialized');
        }

        const results = await provider.quote(symbolArray);
        
        // Ensure the response is always an array
        const resultsArray = Array.isArray(results) ? results : [results];

        const cleanData = resultsArray.map(stock => ({
            symbol: stock.symbol,
            price: stock.regularMarketPrice || stock.preMarketPrice || 0
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