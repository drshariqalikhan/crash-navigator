const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        const apiKey = process.env.TWELVE_DATA_KEY; 

        if (!apiKey || !symbols) {
            return res.status(400).json({ error: 'Missing API Key or Symbols' });
        }

        const response = await axios.get(`https://api.twelvedata.com/price`, {
            params: { symbol: symbols, apikey: apiKey }
        });

        const data = response.data;
        let results = [];
        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());

        // Twelve Data returns a single object if 1 symbol is requested, 
        // but a nested object if multiple symbols are requested.
        if (symbolList.length === 1) {
            results.push({ symbol: symbolList[0], price: data.price });
        } else {
            symbolList.forEach(s => {
                if (data[s]) results.push({ symbol: s, price: data[s].price });
            });
        }

        res.json(results);
    } catch (error) {
        console.error('Twelve Data Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });