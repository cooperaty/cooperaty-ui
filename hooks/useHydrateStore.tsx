import { useEffect, useRef } from 'react'
import { AccountInfo } from '@solana/web3.js'
import useStore from '../stores/useStore'
import UseStore from '../stores/useStore'
import useInterval from './useInterval'
import { Market, Orderbook as SpotOrderBook } from '@project-serum/serum'
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
import { notify } from '../utils/notifications'
import { ExerciseSolution, ExerciseState, Store } from '../stores/types'

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
      const savedExercisesHistory: Store['exercisesHistory'] = JSON.parse(
        localStorage.getItem(
          EXERCISES_HISTORY_STORAGE_KEY + traderAccount.publicKey.toString()
        ) || '{}'
      )
      if (Object.entries(savedExercisesHistory).length > 0) {
        console.log(
          'Loading saved exercises history',
          savedExercisesHistory,
          currentExercise
        )
        setStore((state) => {
          state.exercisesHistory = savedExercisesHistory
        })
        if (currentExercise) {
          const currentExerciseHistoryItem =
            savedExercisesHistory[currentExercise.cid]
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
  }, [traderAccount?.publicKey])

  const setExerciseState = (
    {
      cid,
      isCurrentExercise,
      state,
      outcome,
      solution,
    }: {
      cid: string
      isCurrentExercise: boolean
      state?: ExerciseState
      outcome?: number
      solution?: ExerciseSolution
    } = { cid: null, state: null, outcome: null, isCurrentExercise: true }
  ) => {
    console.log('Setting state', state, outcome, cid, isCurrentExercise)
    const exercisesHistory = UseStore.getState().exercisesHistory
    if (!state)
      state =
        outcome * exercisesHistory[cid].validation > 0 ? 'success' : 'failed'
    const setCheckedState = () => {
      console.log('Setting checked state', state, outcome)
      setStore((s) => {
        if (isCurrentExercise) {
          s.selectedExercise.current.state = state
          s.selectedExercise.current.solution = solution
        }
        s.exercisesHistory = {
          ...exercisesHistory,
          [cid]: { ...exercisesHistory[cid], state, outcome },
        }
      })
    }
    switch (state) {
      case 'expired': {
        notify({
          title: 'Exercise expired',
          description:
            'The exercise has expired, it is already checked or deleted',
          type: 'info',
        })
        setStore((s) => {
          if (isCurrentExercise) {
            s.selectedExercise.current = null
            s.selectedExercise.loadNew = true
          }
          s.exercisesHistory = {
            ...exercisesHistory,
            [cid]: { ...exercisesHistory[cid], state },
          }
        })
        break
      }
      case 'success': {
        notify({
          title: 'Successful validation',
          description: 'Your validation was correct, review your exercise',
          type: 'success',
        })
        setCheckedState()
        break
      }
      case 'failed': {
        notify({
          title: 'Wrong validation',
          description: 'Your validation was incorrect, review your exercise',
          type: 'error',
        })
        setCheckedState()
        break
      }
    }
  }

  const listeners = useRef({})

  useEffect(() => {
    // TODO: close listener after when change state or exercise
    console.log('Adding listeners', currentExercise, listeners)
    if (
      currentExercise?.data?.publicKey &&
      traderAccount &&
      !listeners.current[currentExercise.data.publicKey.toString()]
    ) {
      console.log('PASSING', currentExercise, listeners)
      listeners.current[currentExercise.data.publicKey.toString()] =
        connection.onAccountChange(
          currentExercise.data.publicKey,
          async (info, context) => {
            const currentSelectedExercise =
              useStore.getState().selectedExercise.current
            const exercisesHistory = useStore.getState().exercisesHistory

            console.log(
              'Exercise account changed',
              info,
              context,
              currentSelectedExercise
            )
            const isCurrentExercise =
              currentSelectedExercise &&
              currentExercise.cid == currentSelectedExercise.cid

            const exercise = isCurrentExercise
              ? currentSelectedExercise
              : exercisesHistory[currentExercise.cid]

            switch (exercise.state) {
              case 'checking': {
                if (!info.data.length) {
                  console.log('Checking exercise account deleted')
                  if (isCurrentExercise) {
                    const solution =
                      currentSelectedExercise.solution ??
                      (await actions.getExerciseSolution(exercise.cid))
                    await setExerciseState({
                      cid: exercise.cid,
                      outcome: solution.outcome,
                      solution,
                      isCurrentExercise,
                    })
                  } else {
                    // TODO: find a better way to get the outcome
                    const exerciseFile = await actions.getExerciseFile(
                      exercise.cid
                    )
                    const solution = await actions.getExerciseSolution(
                      exerciseFile.solutionCID
                    )
                    await setExerciseState({
                      cid: exercise.cid,
                      outcome: solution.outcome,
                      isCurrentExercise,
                    })
                  }
                  break
                }
                /*const exerciseAccount =
                cooperatyClient.program.coder.accounts.decode(
                  'Exercise',
                  info.data
                )
              console.log('Checking exercise account decoded', exerciseAccount)

              const outcome = exerciseAccount.outcome.toNumber()
              if (outcome != 0) {
                await setExerciseCheckedState(currentSelectedExercise.cid, outcome)
                console.log('Exercise checked')
              }*/
                break
              }
              case 'active': {
                if (!info.data.length) {
                  console.log('Active exercise account deleted')
                  setExerciseState({
                    cid: currentSelectedExercise.cid,
                    state: 'expired',
                    isCurrentExercise,
                  })
                  break
                }

                const exerciseAccount =
                  cooperatyClient.program.coder.accounts.decode(
                    'Exercise',
                    info.data
                  )
                console.log('Active exercise account decoded', exerciseAccount)

                if (
                  exerciseAccount.sealed &&
                  currentSelectedExercise.state == 'active'
                ) {
                  console.log('Exercise expired')
                  setExerciseState({
                    cid: currentSelectedExercise.cid,
                    state: 'expired',
                    isCurrentExercise,
                  })
                }
              }
            }
          }
        )
    }
  }, [currentExercise, traderAccount])

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
  }, 120 * SECONDS)

  useInterval(() => {
    actions.loadMarketFills()
  }, 20 * SECONDS)

  useInterval(() => {
    actions.fetchMangoGroupCache()
  }, 12 * SECONDS)
}

export default useHydrateStore
