import create from 'zustand'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  MangoClient,
  MarketConfig,
  getMarketByBaseSymbolAndKind,
  getTokenAccountsByOwnerWithWrappedSol,
  getTokenByMint,
  nativeToUi,
  PerpMarket,
  getAllMarkets,
  getMultipleAccounts,
  PerpMarketLayout,
  msrmMints,
} from '@blockworks-foundation/mango-client'
import { Commitment, Connection, PublicKey } from '@solana/web3.js'
import { isDefined, zipDict } from '../utils'
import { notify } from '../utils/notifications'
import {
  DEFAULT_MARKET_KEY,
  initialMarket,
  NODE_URL_KEY,
} from '../components/modules/settings/SettingsModal'
import { MSRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { TrainerSDK, TraderData, ExerciseData } from '../sdk'
import Axios from 'axios'
import { LAST_TRADER_ACCOUNT_KEY } from '../components/trader_account/TraderAccountsModal'
import { Exercise, Store } from './types'
import {
  CLUSTER,
  DEFAULT_MANGO_GROUP_CONFIG,
  DEFAULT_MANGO_GROUP_NAME,
  ENDPOINT,
  getProvider,
  LAST_EXERCISE_LOCAL_STORAGE_KEY,
  mangoGroupPk,
  programId,
  serumProgramId,
  WEBSOCKET_CONNECTION,
} from './constants'

let traderAccountRetryAttempt = 0

const useStore = create<Store>((set, get) => {
  const rpcUrl =
    typeof window !== 'undefined' && CLUSTER === 'mainnet'
      ? JSON.parse(localStorage.getItem(NODE_URL_KEY)) || ENDPOINT.url
      : ENDPOINT.url

  const defaultMarket =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(DEFAULT_MARKET_KEY)) || initialMarket
      : initialMarket

  const connection = new Connection(rpcUrl, 'processed' as Commitment)

  return {
    accountInfos: {},
    selectedMangoGroup: {
      config: DEFAULT_MANGO_GROUP_CONFIG,
      name: DEFAULT_MANGO_GROUP_NAME,
      current: null,
      markets: {},
      rootBanks: [],
      cache: null,
    },
    selectedMarket: {
      config: getMarketByBaseSymbolAndKind(
        DEFAULT_MANGO_GROUP_CONFIG,
        defaultMarket.base,
        defaultMarket.kind
      ) as MarketConfig,
      kind: defaultMarket.kind,
      current: null,
      markPrice: 0,
      askInfo: null,
      bidInfo: null,
      orderBook: { bids: [], asks: [] },
      fills: [],
    },
    mangoGroups: [],
    mangoAccounts: [],
    selectedMangoAccount: {
      current: null,
      initialLoad: true,
      lastUpdatedAt: 0,
    },
    tradeForm: {
      side: 'buy',
      baseSize: '',
      quoteSize: '',
      tradeType: 'Limit',
      price: '',
      triggerPrice: '',
      triggerCondition: 'above',
    },
    tradeHistory: [],

    // Useful
    set: (fn) => set(produce(fn)),
    notificationIdCounter: 0,
    notifications: [],
    connection: {
      cluster: CLUSTER,
      current: connection,
      websocket: WEBSOCKET_CONNECTION,
      client: new MangoClient(connection, programId),
      cooperatyClient: TrainerSDK.init(getProvider(connection)),
      endpoint: ENDPOINT.url,
      slot: 0,
    },
    wallet: {
      providerUrl: null,
      connected: false,
      current: null,
      tokens: [],
    },
    settings: {
      uiLocked: true,
    },
    traderAccounts: [],
    selectedTraderAccount: {
      current: null,
      initialLoad: true,
      lastUpdatedAt: 0,
    },
    practiceForm: {
      validation: 0,
      practiceType: 'Profit',
    },
    exercisesHistory: [],
    selectedExercise: {
      current: null,
      initialLoad: true,
      loadNew: false,
      lastUpdatedAt: 0,
    },
    actions: {
      async fetchWalletTokens() {
        const groupConfig = get().selectedMangoGroup.config
        const wallet = get().wallet.current
        const connected = get().wallet.connected
        const connection = get().connection.current
        const cluster = get().connection.cluster
        const set = get().set

        if (wallet?.publicKey && connected) {
          const ownedTokenAccounts =
            await getTokenAccountsByOwnerWithWrappedSol(
              connection,
              wallet.publicKey
            )
          const tokens = []
          ownedTokenAccounts.forEach((account) => {
            const config = getTokenByMint(groupConfig, account.mint)
            if (config) {
              const uiBalance = nativeToUi(account.amount, config.decimals)
              tokens.push({ account, config, uiBalance })
            } else if (msrmMints[cluster].equals(account.mint)) {
              const uiBalance = nativeToUi(account.amount, 6)
              tokens.push({
                account,
                config: {
                  symbol: 'MSRM',
                  mintKey: msrmMints[cluster],
                  decimals: MSRM_DECIMALS,
                },
                uiBalance,
              })
            }
          })

          set((state) => {
            state.wallet.tokens = tokens
          })
        } else {
          set((state) => {
            state.wallet.tokens = []
          })
        }
      },
      async fetchMangoGroup() {
        const set = get().set
        const mangoGroupConfig = get().selectedMangoGroup.config
        const selectedMarketConfig = get().selectedMarket.config
        const mangoClient = get().connection.client
        const connection = get().connection.current

        return mangoClient
          .getMangoGroup(mangoGroupPk)
          .then(async (mangoGroup) => {
            mangoGroup.loadRootBanks(connection).then(() => {
              set((state) => {
                state.selectedMangoGroup.current = mangoGroup
              })
            })
            const allMarketConfigs = getAllMarkets(mangoGroupConfig)
            const allMarketPks = allMarketConfigs.map((m) => m.publicKey)
            const allBidsAndAsksPks = allMarketConfigs
              .map((m) => [m.bidsKey, m.asksKey])
              .flat()

            let allMarketAccountInfos, mangoCache, allBidsAndAsksAccountInfos
            try {
              const resp = await Promise.all([
                getMultipleAccounts(connection, allMarketPks),
                mangoGroup.loadCache(connection),
                getMultipleAccounts(connection, allBidsAndAsksPks),
              ])
              allMarketAccountInfos = resp[0]
              mangoCache = resp[1]
              allBidsAndAsksAccountInfos = resp[2]
            } catch {
              notify({
                type: 'error',
                title: 'Failed to load the mango group. Please refresh.',
              })
            }

            const allMarketAccounts = allMarketConfigs.map((config, i) => {
              if (config.kind == 'spot') {
                const decoded = Market.getLayout(programId).decode(
                  allMarketAccountInfos[i].accountInfo.data
                )
                return new Market(
                  decoded,
                  config.baseDecimals,
                  config.quoteDecimals,
                  undefined,
                  mangoGroupConfig.serumProgramId
                )
              }
              if (config.kind == 'perp') {
                const decoded = PerpMarketLayout.decode(
                  allMarketAccountInfos[i].accountInfo.data
                )
                return new PerpMarket(
                  config.publicKey,
                  config.baseDecimals,
                  config.quoteDecimals,
                  decoded
                )
              }
            })

            const allMarkets = zipDict(
              allMarketPks.map((pk) => pk.toBase58()),
              allMarketAccounts
            )

            set((state) => {
              state.selectedMangoGroup.cache = mangoCache
              state.selectedMangoGroup.markets = allMarkets
              state.selectedMarket.current = allMarketAccounts.find((mkt) =>
                mkt.publicKey.equals(selectedMarketConfig.publicKey)
              )
              allMarketAccountInfos
                .concat(allBidsAndAsksAccountInfos)
                .forEach(({ publicKey, context, accountInfo }) => {
                  if (context.slot >= state.connection.slot) {
                    state.connection.slot = context.slot
                    state.accountInfos[publicKey.toBase58()] = accountInfo
                  }
                })
            })
          })
          .catch((err) => {
            notify({
              title: 'Could not get mango group',
              description: `${err}`,
              type: 'error',
            })
            console.log('Could not get mango group: ', err)
          })
      },
      async fetchTradeHistory(mangoAccount = null) {
        const selectedMangoAccount =
          mangoAccount || get().selectedMangoAccount.current
        const set = get().set
        if (!selectedMangoAccount) return

        let serumTradeHistory = []
        if (selectedMangoAccount.spotOpenOrdersAccounts.length) {
          const openOrdersAccounts =
            selectedMangoAccount.spotOpenOrdersAccounts.filter(isDefined)
          const publicKeys = openOrdersAccounts.map((act) =>
            act.publicKey.toString()
          )
          serumTradeHistory = await Promise.all(
            publicKeys.map(async (pk) => {
              const response = await fetch(
                `https://event-history-api.herokuapp.com/trades/open_orders/${pk.toString()}`
              )
              const parsedResponse = await response.json()
              console.log(parsedResponse)
              return parsedResponse?.data ? parsedResponse.data : []
            })
          )
        }
        const perpHistory = await fetch(
          `https://event-history-api.herokuapp.com/perp_trades/${selectedMangoAccount.publicKey.toString()}`
        )
        let parsedPerpHistory = await perpHistory.json()
        parsedPerpHistory = parsedPerpHistory?.data || []

        set((state) => {
          state.tradeHistory = [...serumTradeHistory, ...parsedPerpHistory]
        })
      },
      async reloadMangoAccount() {
        const set = get().set
        const mangoAccount = get().selectedMangoAccount.current
        const connection = get().connection.current
        const mangoClient = get().connection.client

        const reloadedMangoAccount = await mangoAccount.reloadFromSlot(
          connection,
          mangoClient.lastSlot
        )

        set((state) => {
          state.selectedMangoAccount.current = reloadedMangoAccount
          state.selectedMangoAccount.lastUpdatedAt = new Date().toISOString()
        })
      },
      async reloadOrders() {
        const mangoAccount = get().selectedMangoAccount.current
        const connection = get().connection.current
        if (mangoAccount) {
          await Promise.all([
            mangoAccount.loadOpenOrders(
              connection,
              new PublicKey(serumProgramId)
            ),
            mangoAccount.loadAdvancedOrders(connection),
          ])
        }
      },
      async updateOpenOrders() {
        const set = get().set
        const connection = get().connection.current
        const bidAskAccounts = Object.keys(get().accountInfos).map(
          (pk) => new PublicKey(pk)
        )

        const allBidsAndAsksAccountInfos = await getMultipleAccounts(
          connection,
          bidAskAccounts
        )

        set((state) => {
          allBidsAndAsksAccountInfos.forEach(
            ({ publicKey, context, accountInfo }) => {
              state.connection.slot = context.slot
              state.accountInfos[publicKey.toBase58()] = accountInfo
            }
          )
        })
      },
      async loadMarketFills() {
        const set = get().set
        const selectedMarket = get().selectedMarket.current
        const connection = get().connection.current
        if (!selectedMarket) {
          return null
        }
        try {
          const loadedFills = await selectedMarket.loadFills(connection, 10000)
          set((state) => {
            state.selectedMarket.fills = loadedFills
          })
        } catch (err) {
          console.log('Error fetching fills:', err)
        }
      },
      async fetchMangoGroupCache() {
        const set = get().set
        const mangoGroup = get().selectedMangoGroup.current
        const connection = get().connection.current
        if (mangoGroup) {
          const mangoCache = await mangoGroup.loadCache(connection)

          set((state) => {
            state.selectedMangoGroup.cache = mangoCache
          })
        }
      },

      // Cooperaty
      async fetchAllTraderAccounts() {
        const set = get().set
        const connected = get().wallet.connected
        const cooperatyClient = get().connection.cooperatyClient
        const selectedTraderAccount = get().selectedTraderAccount.current
        const wallet = get().wallet.current
        const actions = get().actions

        if (wallet?.publicKey && connected) {
          try {
            const traderAccounts = await cooperatyClient.getFilteredTraders({
              user: wallet.publicKey,
            })
            console.log(traderAccounts)
            if (traderAccounts.length > 0) {
              const sortedTraderAccounts = traderAccounts
                .slice()
                .sort((a, b) =>
                  a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1
                )

              set((state) => {
                state.selectedTraderAccount.initialLoad = false
                state.traderAccounts = sortedTraderAccounts
                if (!selectedTraderAccount) {
                  const lastTraderAccount = localStorage.getItem(
                    LAST_TRADER_ACCOUNT_KEY
                  )
                  state.selectedTraderAccount.current =
                    traderAccounts.find(
                      (ma) =>
                        ma.publicKey.toString() ===
                        JSON.parse(lastTraderAccount)
                    ) || sortedTraderAccounts[0]
                  state.selectedTraderAccount.lastUpdatedAt =
                    new Date().toISOString()
                }
              })
            } else {
              set((state) => {
                state.selectedTraderAccount.initialLoad = false
              })
            }
            traderAccountRetryAttempt = 0
          } catch (err) {
            if (traderAccountRetryAttempt < 2) {
              traderAccountRetryAttempt++
              await actions.fetchAllTraderAccounts()
            } else {
              notify({
                type: 'error',
                title: 'Unable to load trader accounts',
                description: err.message,
              })
              console.log('Could not get trader accounts for wallet', err)
            }
          }
        }
      },
      async reloadTraderAccount() {
        const set = get().set
        const connected = get().wallet.connected
        const cooperatyClient = get().connection.cooperatyClient
        const wallet = get().wallet.current
        const selectedTraderAccount = get().selectedTraderAccount.current

        if (wallet?.publicKey && connected && selectedTraderAccount) {
          const reloadedTraderAccount: TraderData =
            await cooperatyClient.reloadTraderAccount(selectedTraderAccount)
          set((state) => {
            state.selectedTraderAccount.current = reloadedTraderAccount
            state.selectedTraderAccount.lastUpdatedAt = new Date().toISOString()
          })
          console.log('reloaded trader account', reloadedTraderAccount)
        }
      },
      async updateSDK() {
        const set = get().set
        const wallet = get().wallet.current
        const connection = get().connection.current
        const newCooperatyClient = wallet
          ? TrainerSDK.init(getProvider(connection, wallet))
          : TrainerSDK.init(getProvider(connection))
        set((state) => {
          state.connection.cooperatyClient = newCooperatyClient
        })
      },
      async updateConnection(endpointUrl) {
        const set = get().set
        const newConnection = new Connection(endpointUrl, 'processed')
        const newMangoClient = new MangoClient(newConnection, programId)

        set((state) => {
          state.connection.endpoint = endpointUrl
          state.connection.current = newConnection
          state.connection.client = newMangoClient
        })

        await this.updateSDK()
      },
      async setNewExercise(exercise: Exercise) {
        const set = get().set
        let response: any

        try {
          response = await Axios.get(
            'https://ipfs.io/ipfs/' + exercise.data.account.cid
          )
        } catch (err) {
          console.log('error getting ipfs data', err)
          notify({
            title: "Error getting exercise's chart",
            description: 'Try again',
            type: 'error',
          })
          set((s) => {
            s.exercisesHistory.push({ ...exercise, state: 'skipped' })
            s.selectedExercise.loadNew = false
            s.selectedExercise.initialLoad = false
            s.selectedExercise.current = null
          })
          return
        }

        exercise.chart = {
          position: response.data.position,
          candles: response.data.candles,
          timeframe: response.data.timeframe,
        }
        exercise.type = response.data.type ?? 'Scalping'
        exercise.solution = {
          cid: response.data.solutionCID ?? null,
        } as Exercise['solution']

        if (!exercise.state) exercise.state = 'active'

        console.log('NEW_EXERCISE', exercise)

        set((state) => {
          state.selectedExercise.current = { ...exercise } as Exercise
          state.selectedExercise.initialLoad = false
          state.selectedExercise.loadNew = false
          state.lastUpdatedAt = new Date().toISOString()
        })
        localStorage.setItem(
          LAST_EXERCISE_LOCAL_STORAGE_KEY,
          exercise.data.publicKey.toString()
        )
      },
      async getAvailableExercises() {
        const cooperatyClient = get().connection.cooperatyClient
        const exercisesHistory = get().exercisesHistory

        const exercises: any[] = await cooperatyClient.getFilteredExercises({
          full: false,
        })

        return exercises.filter(
          (exercise) =>
            exercisesHistory.findIndex((pastExercise) =>
              pastExercise.data.publicKey.equals(exercise.publicKey)
            ) === -1
        )
      },
      async getNewExercise() {
        const exercisesHistory = get().exercisesHistory
        const currentExercise = get().selectedExercise.current
        const newExercises = await this.getAvailableExercises()

        if (newExercises.length == 0) {
          const historyWithoutSkippedExercises = exercisesHistory.filter(
            (exercise) => exercise.state !== 'skipped'
          )

          if (historyWithoutSkippedExercises.length < exercisesHistory.length) {
            set((s) => {
              s.exercisesHistory = historyWithoutSkippedExercises
            })
            notify({
              title: 'No new exercises',
              description: 'Retrying with skipped exercises',
              type: 'info',
            })
            return this.getNewExercise()
          } else {
            notify({
              title: 'No new exercises',
              description: 'Try again later',
              type: 'info',
            })
            if (currentExercise != null) {
              set((state) => {
                state.selectedExercise.current = null
              })
            }
            return null
          }
        } else {
          return newExercises[0]
        }
      },
      async fetchExercise(exercise: Exercise = new Exercise()) {
        const set = get().set
        const cooperatyClient = get().connection.cooperatyClient
        const exerciseLoadInitial = get().selectedExercise.initialLoad
        const exerciseLoadNew = get().selectedExercise.loadNew

        if (exerciseLoadInitial) {
          const lastExercisePublicKey = localStorage.getItem(
            'last_exercise_account'
          )
          if (lastExercisePublicKey != null) {
            try {
              exercise.data = await cooperatyClient.reloadExercise({
                publicKey: new PublicKey(lastExercisePublicKey),
              } as ExerciseData)
            } catch (e) {
              console.log('error reloading exercise', e.message)
              if (e.message.includes('Error: Account does not exist')) {
                notify({
                  title: 'Last exercise is not available anymore',
                  description: 'Retrying with a new exercise',
                  type: 'info',
                })
                set((state) => {
                  state.selectedExercise.current = null
                })
                localStorage.setItem('last_exercise_account', null)
                return
              }
            }
          } else {
            exercise.data = await this.getNewExercise()
          }
        } else if (exerciseLoadNew) {
          exercise.data = await this.getNewExercise()
        }

        if (exercise.data != null) await this.setNewExercise(exercise)
        else {
          set((state) => {
            state.selectedExercise.initialLoad = false
            state.selectedExercise.loadNew = false
          })
        }
      },
    },
  }
})

export default useStore
