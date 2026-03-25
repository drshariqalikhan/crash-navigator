const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        const apiKey = process.env.TWELVE_DATA_KEY; 

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key missing on server' });
        }
        if (!symbols) {
            return res.status(400).json({ error: 'No symbols requested' });
        }

        // Twelve Data API Call
        const response = await axios.get(`https://api.twelvedata.com/price`, {
            params: { symbol: symbols, apikey: apiKey }
        });

        const data = response.data;

        // If Twelve Data returns an error (like Rate Limit)
        if (data.status === 'error') {
            console.error("Twelve Data Error:", data.message);
            return res.status(429).json({ error: data.message });
        }

        let results = [];
        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());

        // Standardize output to an array [{symbol, price}, ...]
        if (symbolList.length === 1) {
            results.push({ symbol: symbolList[0], price: data.price });
        } else {
            symbolList.forEach(s => {
                if (data[s] && data[s].price) {
                    results.push({ symbol: s, price: data[s].price });
                } else if (data.price && symbolList.length === 1) {
                    results.push({ symbol: s, price: data.price });
                }
            });
        }

        res.json(results);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).json({ error: 'Server could not reach API' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});