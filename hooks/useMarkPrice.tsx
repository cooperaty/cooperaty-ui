import { useEffect } from 'react'
import {
  fillsSelector,
  marketSelector,
  markPriceSelector,
  orderbookSelector,
  setStoreSelector,
} from '../stores/selectors'
import useStore from '../stores/useStore'
import { getDecimalCount } from '../utils'

export default function useMarkPrice() {
  const setStore = useStore(setStoreSelector)
  const markPrice = useStore(markPriceSelector)
  const orderbook = useStore(orderbookSelector)
  const fills = useStore(fillsSelector)
  const market = useStore(marketSelector)

  const trades = fills
    .filter((trade) => trade?.eventFlags?.maker || trade?.maker)
    .map((trade) => ({
      ...trade,
      side: trade.side === 'buy' ? 'sell' : 'buy',
    }))

  useEffect(() => {
    const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
    const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
    const last = trades && trades.length > 0 && trades[0].price

    const priceElements = [bb, ba, last].filter((e) => e).sort((a, b) => a - b)
    const newMarkPrice = priceElements
      ? priceElements[Math.floor(priceElements.length / 2)]
      : null
    // const newMarkPrice =
    //   bb && ba
    //     ? last
    //       ? [bb, ba, last].sort((a, b) => a - b)[1]
    //       : (bb + ba) / 2
    //     : null
    if (newMarkPrice !== markPrice) {
      setStore((state) => {
        state.selectedMarket.markPrice = newMarkPrice?.toFixed(
          getDecimalCount(market?.tickSize)
        )
      })
    }
  }, [orderbook, trades])

  return markPrice
}
