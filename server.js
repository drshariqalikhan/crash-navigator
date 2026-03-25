const express = require('express');
const path = require('path');
const yahooFinance = require('yahoo-finance2').default; // Import Yahoo Finance
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query; // Expecting a string like "AAPL" or "AAPL,MSFT"

        if (!symbols) {
            return res.status(400).json({ error: 'No symbols provided' });
        }

        // Split the string into an array (e.g., "AAPL,BTC-USD" -> ["AAPL", "BTC-USD"])
        const symbolArray = symbols.split(',');

        // If only one symbol is requested
        if (symbolArray.length === 1) {
            const quote = await yahooFinance.quote(symbolArray[0]);
            // Formatting to match a standard "price" output
            return res.json({
                symbol: quote.symbol,
                price: quote.regularMarketPrice,
                currency: quote.currency
            });
        } 
        
        // If multiple symbols are requested
        const results = await yahooFinance.quote(symbolArray);
        res.json(results);

    } catch (error) {
        console.error('Yahoo Finance Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch prices from Yahoo Finance' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});