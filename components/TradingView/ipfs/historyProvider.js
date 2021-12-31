import historyJSON from './history.json'
//import * as IPFS from 'ipfs-core'

const history = {}
export default {
  history,
  getIPFS: async function () {
    let data = '{}'

    /*const node = await IPFS.create()

    const stream = node.cat('QmZmcRLEftCgd8AwsS8hKYSVPtFuEXy6cgWJqL1LEVj8tW')

    for await (const chunk of stream) {
      // chunks of data are returned as a Buffer, convert it back to a string
      data += chunk.toString()
    }*/

    return JSON.parse(data)
  },
  getBars: function (symbolInfo, resolution, from, to, first) {
    return this.getIPFS().then(function (history) {
      let bars = []
      for (let i = 0; i < historyJSON.t.length; i++) {
        bars.push({
          time: historyJSON.t[i] * 1e3, // TradingView requires bar time in ms
          low: parseFloat(historyJSON.l[i]),
          high: parseFloat(historyJSON.h[i]),
          open: parseFloat(historyJSON.o[i]),
          close: parseFloat(historyJSON.c[i]),
          volume: parseFloat(historyJSON.v[i]),
        })
        if (first) {
          var lastBar = bars[bars.length - 1]
          history[symbolInfo.name] = { lastBar: lastBar }
        }
      }
      return bars
    })
  },
}
