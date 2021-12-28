import historyProvider from './historyProvider';

export default class {
  constructor(supportedResolutions) {
    this.supportedResolutions = supportedResolutions;
    this.config = {
      supported_resolutions: supportedResolutions,
    };
    this.priceScale = 10000;
  }
  onReady(cb) {
    setTimeout(() => cb(this.config), 0);
  }
  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {}
  resolveSymbol(
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
  ) {

    var symbol_stub = {
      name: symbolName,
      description: '',
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      ticker: symbolName,
      minmov: 1,
      pricescale: this.priceScale,
      has_intraday: true,
      intraday_multipliers: ['1', '60'],
      supported_resolution: this.supportedResolutions,
      volume_precision: 8,
      data_status: 'streaming',
    };

    setTimeout(function () {
      onSymbolResolvedCallback(symbol_stub);
    }, 0);

    // onResolveErrorCallback('Not feeling it today')
  }
  getBars(
    symbolInfo,
    resolution,
    from,
    to,
    onHistoryCallback,
    onErrorCallback,
  ) {
    historyProvider
      .getBars(symbolInfo, resolution, from, to)
      .then((bars) => {
        console.log('bars', bars);
        if (bars.length) onHistoryCallback(bars, { noData: false });
        else onHistoryCallback(bars, { noData: true });
      })
      .catch((err) => {
        onErrorCallback(err)
      });
  }
  subscribeBars(
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback,
  ) {}
  unsubscribeBars(subscriberUID) {}
  calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
    // optional
    // while optional, this makes sure we request 24 hours of minute data at a time
    // CryptoCompare's minute data endpoint will throw an error if we request data beyond 7 days in the past, and return no data
    return resolution < 60 ? { resolutionBack: 'D', intervalBack: '1' } : undefined;
  }
  getMarks(symbolInfo, startDate, endDate, onDataCallback, resolution) {}
  getTimeScaleMarks(
    symbolInfo,
    startDate,
    endDate,
    onDataCallback,
    resolution,
  ) {}
  getServerTime(cb) {}
}
