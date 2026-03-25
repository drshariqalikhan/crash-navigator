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

        // Yahoo prefers dashes for crypto (BTC-USD) and dots for classes (BRK.B)
        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase().replace('/', '-'));

        const results = await yahooFinance.quote(symbolArray);
        
        // Yahoo returns an array of objects. We map them to match your frontend.
        const cleanData = results.map(stock => ({
            symbol: stock.symbol,
            price: stock.regularMarketPrice || stock.preMarketPrice || 0
        }));

        res.json(cleanData);
    } catch (error) {
        console.error('Yahoo API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});