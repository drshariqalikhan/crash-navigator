from flask import Flask, request, jsonify, send_from_directory
import yfinance as yf
import os

# Initialize Flask and tell it where the frontend files are
app = Flask(__name__, static_folder='public')

@app.route('/api/prices', methods=['GET'])
def get_prices():
    symbols_param = request.args.get('symbols', '')
    if not symbols_param:
        return jsonify({'error': 'No symbols provided'}), 400

    # Format symbols: AAPL, BTC/USD -> AAPL, BTC-USD
    symbols_list = symbols_param.upper().replace('/', '-').split(',')
    
    # yfinance prefers space-separated strings for batching
    symbols_str = " ".join(symbols_list)
    
    results = []
    try:
        # Fetch all tickers at once
        tickers = yf.Tickers(symbols_str)
        
        for sym in symbols_list:
            try:
                # fast_info is the quickest way to get current market price in yfinance
                price = tickers.tickers[sym].fast_info['last_price']
                results.append({
                    'symbol': sym,
                    'price': round(price, 2)
                })
            except Exception as e:
                print(f"Warning: Could not fetch price for {sym}: {e}")
                # If a ticker fails (e.g. delisted), skip it gracefully
                pass

        return jsonify(results)
    
    except Exception as e:
        print(f"API Error: {e}")
        return jsonify({'error': 'Failed to fetch prices'}), 500

# Route to serve your frontend index.html
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Catch-all route to serve other files (like CSS/JS if you add them later)
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)