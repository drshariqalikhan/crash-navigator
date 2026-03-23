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

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        const response = await axios.get(`https://api.twelvedata.com/price`, {
            params: {
                symbol: symbols,
                apikey: apiKey
            }
        });
        
        res.json(response.data);
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