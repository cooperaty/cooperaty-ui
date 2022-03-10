import { useEffect } from 'react'
import { AccountInfo } from '@solana/web3.js'
import useStore from '../stores/useStore'
import useInterval from './useInterval'
import { Orderbook as SpotOrderBook, Market } from '@project-serum/serum'
import {
  BookSide,
  BookSideLayout,
  MangoAccountLayout,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import {
  actionsSelector,
  connectionSelector,
  mangoAccountSelector,
  marketConfigSelector,
  marketSelector,
  marketsSelector,
} from '../stores/selectors'
import { EXERCISES_HISTORY_STORAGE_KEY } from '../components/practice/PracticeHistoryTable'
import { ExerciseHistoryItem } from '../stores/types'

const SECONDS = 1000

function decodeBook(market, accInfo: AccountInfo<Buffer>): number[][] {
  if (market && accInfo?.data) {
    const depth = 40
    if (market instanceof Market) {
      const book = SpotOrderBook.decode(market, accInfo.data)
      return book.getL2(depth).map(([price, size]) => [price, size])
    } else if (market instanceof PerpMarket) {
      const book = new BookSide(
        null,
        market,
        BookSideLayout.decode(accInfo.data)
      )
      return book.getL2(depth).map(([price, size]) => [price, size])
    }
  } else {
    return []
  }
}

const useHydrateStore = () => {
  const setStore = useStore((s) => s.set)
  const actions = useStore(actionsSelector)
  const markets = useStore(marketsSelector)
  const marketConfig = useStore(marketConfigSelector)
  const selectedMarket = useStore(marketSelector)
  const connection = useStore(connectionSelector)
  const mangoAccount = useStore(mangoAccountSelector)
  const traderAccount = useStore((s) => s.selectedTraderAccount.current)
  const currentExercise = useStore((s) => s.selectedExercise.current)
  const loadNewExercise = useStore((s) => s.selectedExercise.loadNew)
  const loadInitialExercise = useStore((s) => s.selectedExercise.initialLoad)
  const cooperatyClient = useStore((s) => s.connection.cooperatyClient)

  const connected = useStore((s) => s.wallet.connected)

  // update exercise when on initial load or need to load new exercise
  useEffect(() => {
    if (loadNewExercise || loadInitialExercise) actions.fetchExercise()
  }, [loadNewExercise, loadInitialExercise, connected])

  useEffect(() => {
    if (traderAccount) {
      const savedExercisesHistory: ExerciseHistoryItem[] = JSON.parse(
        localStorage.getItem(
          EXERCISES_HISTORY_STORAGE_KEY + traderAccount.publicKey.toString()
        ) || '[]'
      )
      if (savedExercisesHistory.length > 0) {
        console.log(
          'Loading saved exercises history',
          savedExercisesHistory,
          currentExercise
        )
        setStore((state) => {
          state.exercisesHistory = savedExercisesHistory
        })
        if (currentExercise) {
          const currentExerciseHistoryItem = savedExercisesHistory.find(
            (item) => item.cid == currentExercise.cid
          )
          if (currentExerciseHistoryItem) {
            setStore((state) => {
              state.practiceForm.validation =
                currentExerciseHistoryItem.validation
              state.selectedExercise.current.state =
                currentExerciseHistoryItem.state
            })
          }
        }
      }
    }
  }, [traderAccount])

  useEffect(() => {
    if (currentExercise?.data?.publicKey && traderAccount) {
      const listener = connection.onAccountChange(
        currentExercise.data.publicKey,
        (info, context) => {
          console.log('Exercise account changed', info, context)

          // exercise account changed, cases
          // ...
          // exercise outcome changed, we can load the solution from IPFS TODO

          if (!info.data.length) {
            console.log('Exercise account deleted')
            return
          }
          const exerciseAccount = cooperatyClient.program.coder.accounts.decode(
            'Exercise',
            info.data
          )

          if (exerciseAccount.sealed && currentExercise.state == 'active') {
            console.log('Exercise expired')
            setStore((state) => {
              state.selectedExercise.current.state = 'expired'
            })
          }

          const outcome = exerciseAccount.outcome.toNumber()
          if (outcome != 0) {
            const validation = exerciseAccount.validations.filter(
              (validation) => validation.trader.equals(traderAccount.publicKey)
            )
            if (validation.length == 1) {
              setStore((s) => {
                s.selectedExercise.current.state =
                  validation[0].value.toNumber() * outcome > 0
                    ? 'success'
                    : 'failed'
              })
            }
          }
          console.log('Exercise account decoded', exerciseAccount)
        }
      )
      console.log('Exercise account changed listener', listener)
    }
  }, [currentExercise])

  // update orderbook when market changes
  useEffect(() => {
    const market = markets[marketConfig.publicKey.toString()]
    setStore((state) => {
      state.selectedMarket.current = market
      state.selectedMarket.orderBook.bids = decodeBook(
        market,
        state.accountInfos[marketConfig.bidsKey.toString()]
      )
      state.selectedMarket.orderBook.asks = decodeBook(
        market,
        state.accountInfos[marketConfig.asksKey.toString()]
      )
    })
  }, [marketConfig, markets, setStore])

  // hydrate orderbook with all markets in mango group
  useEffect(() => {
    let previousBidInfo: AccountInfo<Buffer> | null = null
    let previousAskInfo: AccountInfo<Buffer> | null = null
    if (!marketConfig || !selectedMarket) return

    const bidSubscriptionId = connection.onAccountChange(
      marketConfig.bidsKey,
      (info, context) => {
        const lastSlot = useStore.getState().connection.slot
        if (
          (!previousBidInfo ||
            !previousBidInfo.data.equals(info.data) ||
            previousBidInfo.lamports !== info.lamports) &&
          context.slot > lastSlot
        ) {
          previousBidInfo = info
          setStore((state) => {
            state.accountInfos[marketConfig.bidsKey.toString()] = info
            state.selectedMarket.orderBook.bids = decodeBook(
              selectedMarket,
              info
            )
          })
        }
      }
    )
    const askSubscriptionId = connection.onAccountChange(
      marketConfig.asksKey,
      (info, context) => {
        const lastSlot = useStore.getState().connection.slot
        if (
          (!previousAskInfo ||
            !previousAskInfo.data.equals(info.data) ||
            previousAskInfo.lamports !== info.lamports) &&
          context.slot > lastSlot
        ) {
          previousAskInfo = info
          setStore((state) => {
            state.accountInfos[marketConfig.asksKey.toString()] = info
            state.selectedMarket.orderBook.asks = decodeBook(
              selectedMarket,
              info
            )
          })
        }
      }
    )

    return () => {
      connection.removeAccountChangeListener(bidSubscriptionId)
      connection.removeAccountChangeListener(askSubscriptionId)
    }
  }, [marketConfig, selectedMarket, connection, setStore])

  // TODO: check if market fills are needed
  // load market fills
  useEffect(() => {
    actions.loadMarketFills()
  }, [selectedMarket])

  // TODO: check if trader account need a subscription id
  // change subscription id when account changes
  useEffect(() => {
    if (!mangoAccount) return
    console.log('in mango account WS useEffect')
    const subscriptionId = connection.onAccountChange(
      mangoAccount.publicKey,
      (info) => {
        console.log('mango account WS update: ', info)

        const decodedMangoAccount = MangoAccountLayout.decode(info?.data)
        const newMangoAccount = Object.assign(mangoAccount, decodedMangoAccount)

        setStore((state) => {
          state.selectedMangoAccount.current = newMangoAccount
          state.selectedMangoAccount.lastUpdatedAt = new Date().toISOString()
        })
      }
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [mangoAccount])

  useInterval(async () => {
    await actions.fetchMangoGroup()
    await actions.fetchExercise()
  }, 120 * SECONDS)

  useInterval(() => {
    actions.loadMarketFills()
  }, 20 * SECONDS)

  useInterval(() => {
    actions.fetchMangoGroupCache()
  }, 12 * SECONDS)
}

export default useHydrateStore
