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

    # Format symbols for Yahoo (e.g., BTC/USD -> BTC-USD)
    symbols_list = symbols_param.upper().replace('/', '-').split(',')
    results = []

    # Iterate through symbols using the robust .history() method
    for sym in symbols_list:
        try:
            ticker = yf.Ticker(sym)
            # .history(period="1d") is the most block-resistant endpoint
            hist = ticker.history(period="1d")
            
            if not hist.empty:
                # Extract the latest closing price
                price = hist['Close'].iloc[-1]
                results.append({
                    'symbol': sym,
                    'price': round(float(price), 2)
                })
            else:
                print(f"Warning: No data returned for {sym}")
        except Exception as e:
            print(f"Error fetching {sym}: {e}")

    return jsonify(results)

# Route to serve your frontend index.html
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Catch-all route to serve other static files
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)