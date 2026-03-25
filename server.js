const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// This is the most compatible way to load this specific library
const yahooFinance = require('yahoo-finance2').default;

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'No symbols provided' });

        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());

        // Call Yahoo Finance
        const results = await yahooFinance.quote(symbolArray);
        
        // Always return an array to the frontend
        const formattedResults = Array.isArray(results) ? results : [results];
        
        const cleanData = formattedResults.map(stock => ({
            symbol: stock.symbol,
            price: stock.regularMarketPrice || stock.preMarketPrice || stock.ask || 0,
            currency: stock.currency,
            change: stock.regularMarketChangePercent || 0
        }));

        res.json(cleanData);
    } catch (error) {
        console.error('Yahoo Finance Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch prices', 
            message: error.message 
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});