const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query; // Expecting "AAPL,MSFT,BTC/USD"
        const apiKey = process.env.TWELVE_DATA_KEY; 

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        if (!symbols) {
            return res.status(400).json({ error: 'No symbols provided' });
        }

        // Fetch prices from Twelve Data
        // Twelve Data returns a single object for 1 symbol, 
        // and an object-of-objects for multiple symbols.
        const response = await axios.get(`https://api.twelvedata.com/price`, {
            params: {
                symbol: symbols,
                apikey: apiKey
            }
        });

        const data = response.data;

        // --- DATA NORMALIZATION ---
        // We want to ensure the frontend ALWAYS receives an Array [{symbol, price}, ...]
        let results = [];
        const requestedSymbols = symbols.split(',').map(s => s.trim().toUpperCase());

        if (requestedSymbols.length === 1) {
            // Single stock response handling
            results.push({
                symbol: requestedSymbols[0],
                price: data.price || "N/A"
            });
        } else {
            // Multiple stock response handling (Batch)
            requestedSymbols.forEach(sym => {
                if (data[sym]) {
                    results.push({
                        symbol: sym,
                        price: data[sym].price || "N/A"
                    });
                }
            });
        }

        res.json(results);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});