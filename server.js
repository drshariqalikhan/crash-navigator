const express = require('express');
const path = require('path');
const yahooFinance = require('yahoo-finance2').default;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;

        if (!symbols) {
            return res.status(400).json({ error: 'No symbols provided' });
        }

        // 1. Convert string "AAPL,MSFT,TSLA" into an array ["AAPL", "MSFT", "TSLA"]
        // Also trim spaces and make uppercase to prevent errors
        const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());

        // 2. Fetch all prices in ONE single call to Yahoo Finance
        const results = await yahooFinance.quote(symbolArray);

        // 3. Ensure the result is always an array (Yahoo returns an object if only 1 symbol is requested)
        const formattedResults = Array.isArray(results) ? results : [results];

        // 4. Map the data so the frontend gets exactly what it needs
        const cleanData = formattedResults.map(stock => ({
            symbol: stock.symbol,
            price: stock.regularMarketPrice || stock.preMarketPrice || 0,
            currency: stock.currency,
            change: stock.regularMarketChangePercent || 0
        }));

        res.json(cleanData);

    } catch (error) {
        console.error('Yahoo Finance Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});