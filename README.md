# TrackWealth

TrackWealth is a beautiful, client-side single-page application (SPA) designed to help you track your personal wealth and financial instruments in one unified dashboard.

## Features

-   **Dashboard Overview:** View your total wealth with a dynamic, animated counter and a calculated daily change percentage.
-   **Financial Instruments:** Add, edit, and track various types of investments including Mutual Funds, Stocks, EPF, NPS, Bank Accounts, Fixed Deposits, Gold, Crypto, and Real Estate.
-   **Allocation Insights:** Instantly see the breakdown of your portfolio with a visual donut chart and allocation percentages.
-   **Data Persistence:** Your data is securely saved locally in your browser using `localStorage`, ensuring it's available every time you return.
-   **Export & Import:** Easily manage your data by exporting it to a JSON file for backup, or importing an existing JSON file to restore your portfolio on any device.
-   **Premium Design:** Features a modern, sleek dark theme with glassmorphism effects, micro-animations, and a highly responsive layout.

## How to Run

1.  Clone the repository:
    ```bash
    git clone https://github.com/PraSri/trackWealth.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd trackWealth
    ```
3.  Open `index.html` in your web browser, or use a local development server (e.g., Python's HTTP server):
    ```bash
    python3 -m http.server 8080
    ```
    Then visit `http://localhost:8080`.

## Built With

-   HTML5
-   CSS3 (Vanilla)
-   JavaScript (Vanilla)

## Data Privacy

All data is stored purely locally on your device within your browser's `localStorage` or exported to a file by you. No data is sent to or stored on any external servers.
