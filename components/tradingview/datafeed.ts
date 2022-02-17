export default class Datafeed {
  public supportedResolutions: any
  public config: { supported_resolutions: any }
  public data: any
  public priceScale: number

  constructor(data, supportedResolutions) {
    this.supportedResolutions = supportedResolutions
    this.config = {
      supported_resolutions: supportedResolutions,
    }
    this.data = data
    this.priceScale = 10000
  }

  onReady(cb) {
    setTimeout(() => cb(this.config), 0)
  }

  resolveSymbol(symbolName, onSymbolResolvedCallback, _onResolveErrorCallback) {
    const symbol_stub = {
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
    }

    setTimeout(function () {
      onSymbolResolvedCallback(symbol_stub)
    }, 0)
  }

  getBars(
    symbolInfo,
    resolution,
    from,
    to,
    onHistoryCallback,
    onErrorCallback
  ) {
    try {
      onHistoryCallback(this.data, { noData: false })
    } catch (e) {
      console.log('error', e)
      onErrorCallback(e)
    }
  }

  calculateHistoryDepth() {}
  unsubscribeBars() {}
  subscribeBars() {}
}
