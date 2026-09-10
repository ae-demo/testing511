import ballerina/http;

// currency-service external dependency (Open Exchange Rates) — base URL is the
// vendor's fixed host from specs/design/dependencies/currency-service/openapi.yaml,
// not a platform-injected address (this dependency has no <DEP>_URL binding, only
// the app-id credential).
final http:Client currencyServiceClient = check new ("https://openexchangerates.org/api");

type RatesResponse record {
    int timestamp;
    string base;
    map<decimal> rates;
};

// Fetches the latest rates relative to USD (the free tier only allows base=USD).
function fetchLatestRatesUsd() returns map<decimal>|string {
    string path = "/latest.json?app_id=" + openExchangeRatesAppId;
    http:Response|http:ClientError result = currencyServiceClient->get(path);
    if result is http:ClientError {
        return "currency-service unavailable: " + result.message();
    }
    http:Response response = result;
    if response.statusCode != 200 {
        return "currency-service returned status " + response.statusCode.toString();
    }
    json|error payload = response.getJsonPayload();
    if payload is error {
        return "currency-service returned an invalid response";
    }
    RatesResponse|error rates = payload.cloneWithType(RatesResponse);
    if rates is error {
        return "currency-service returned an invalid response";
    }
    return rates.rates;
}

// Converts `amount` in `originalCurrency` to the household home currency.
// Returns the converted decimal on success, or a human-readable reason on
// failure — the caller turns that into a 400 (never a silent 1:1 fallback).
function convertToHomeCurrency(decimal amount, string originalCurrency) returns decimal|string {
    if originalCurrency == homeCurrency {
        return amount;
    }
    if openExchangeRatesAppId.trim() == "" {
        return "currency conversion is unavailable: OPEN_EXCHANGE_RATES_APP_ID is not configured";
    }
    map<decimal>|string ratesResult = fetchLatestRatesUsd();
    if ratesResult is string {
        return ratesResult;
    }
    map<decimal> rates = ratesResult;
    decimal rateFrom = 1;
    if originalCurrency != "USD" {
        decimal? r = rates[originalCurrency];
        if r is () {
            return "unsupported currency: " + originalCurrency;
        }
        rateFrom = r;
    }
    decimal rateHome = 1;
    if homeCurrency != "USD" {
        decimal? r = rates[homeCurrency];
        if r is () {
            return "home currency not supported by rate provider: " + homeCurrency;
        }
        rateHome = r;
    }
    return amount / rateFrom * rateHome;
}
