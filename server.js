import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module'; // Import the bridge utility

const app = express();
const PORT = process.env.PORT || 10000;

// Setup the bridge to load the library in compatibility mode
const require = createRequire(import.meta.url);
const yahooFinance = require('yahoo-finance2').default; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'No symbols' });

        // Clean up symbols (replace / with - for Yahoo compatibility)
        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase().replace('/', '-'));

        // Use the library through the bridge
        const results = await yahooFinance.quote(symbolArray);
        
        // standardizing the result into an array
        const resultsArray = Array.isArray(results) ? results : [results];

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