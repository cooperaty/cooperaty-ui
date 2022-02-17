import create, { State } from 'zustand'
import produce from 'immer'
import { Market } from '@project-serum/serum'
import {
  IDS,
  Config,
  MangoClient,
  MangoGroup,
  MangoAccount,
  MarketConfig,
  getMarketByBaseSymbolAndKind,
  GroupConfig,
  TokenConfig,
  getTokenAccountsByOwnerWithWrappedSol,
  getTokenByMint,
  TokenAccount,
  nativeToUi,
  MangoCache,
  PerpMarket,
  getAllMarkets,
  getMultipleAccounts,
  PerpMarketLayout,
  msrmMints,
} from '@blockworks-foundation/mango-client'
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { isDefined, zipDict } from '../utils'
import { Notification, notify } from '../utils/notifications'
import {
  DEFAULT_MARKET_KEY,
  initialMarket,
  NODE_URL_KEY,
} from '../components/modules/settings/SettingsModal'
import { MSRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import CooperatyClient from '../clients/cooperaty'
import Axios from 'axios'
import { LAST_TRADER_ACCOUNT_KEY } from '../components/trader_account/TraderAccountsModal'
import { BN } from '@project-serum/anchor'

export class TraderAccount {
  publicKey: PublicKey
  account: {
    user: PublicKey
    name: string
    performance: BN
    bump: BN
  }
}

export class Exercise {
  publicKey: PublicKey
  account: {
    full: boolean
    cid: string
    authority: PublicKey
    outcome: number
    solutionKey: PublicKey
    predictionsCapacity: number
    predictions: any
    bump: number
  }
  data: [
    {
      time: number
      low: number
      high: number
      open: number
      close: number
      volume: number
    }
  ]
  type: 'Scalping' | 'Swing'
  position: {
    direction: 'long_position' | 'short_position'
    takeProfit: number
    stopLoss: number
    bars: number
  }
  state: 'active' | 'answered' | 'skipped'
}

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet',
    url: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    websocket: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    custom: false,
  },
  {
    name: 'devnet',
    url: 'https://api.devnet.solana.com',
    websocket: 'https://api.devnet.solana.com',
    custom: false,
  },
]

type ClusterType = 'mainnet' | 'devnet'

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'mainnet'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
)

const DEFAULT_MANGO_GROUP_NAME = process.env.NEXT_PUBLIC_GROUP || 'mainnet.1'
export const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME
)
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
)
export const MNGO_INDEX = defaultMangoGroupIds.oracles.findIndex(
  (t) => t.symbol === 'MNGO'
)

export const programId = new PublicKey(defaultMangoGroupIds.mangoProgramId)
export const serumProgramId = new PublicKey(defaultMangoGroupIds.serumProgramId)
const mangoGroupPk = new PublicKey(defaultMangoGroupIds.publicKey)

let traderAccountRetryAttempt = 0

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: [],
  },
}

// an object with keys of Solana account addresses that we are
// subscribing to with connection.onAccountChange() in the
// useHydrateStore hook
interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>
}

export interface WalletToken {
  account: TokenAccount
  config: TokenConfig
  uiBalance: number
}

export interface Orderbook {
  bids: number[][]
  asks: number[][]
}

interface Store extends State {
  notificationIdCounter: number
  notifications: Array<Notification>
  accountInfos: AccountInfoList
  connection: {
    cluster: ClusterType
    current: Connection
    websocket: Connection
    endpoint: string
    client: MangoClient
    cooperatyClient: CooperatyClient
    slot: number
  }
  selectedMarket: {
    config: MarketConfig
    current: Market | PerpMarket | null
    markPrice: number
    kind: string
    askInfo: AccountInfo<Buffer> | null
    bidInfo: AccountInfo<Buffer> | null
    orderBook: Orderbook
    fills: any[]
  }
  mangoGroups: Array<MangoGroup>
  selectedMangoGroup: {
    config: GroupConfig
    name: string
    current: MangoGroup | null
    markets: {
      [address: string]: Market | PerpMarket
    }
    cache: MangoCache | null
  }
  mangoAccounts: MangoAccount[]
  selectedMangoAccount: {
    current: MangoAccount | null
    initialLoad: boolean
    lastUpdatedAt: number
  }
  tradeForm: {
    side: 'buy' | 'sell'
    price: number | ''
    baseSize: number | ''
    quoteSize: number | ''
    tradeType:
      | 'Market'
      | 'Limit'
      | 'Stop Loss'
      | 'Take Profit'
      | 'Stop Limit'
      | 'Take Profit Limit'
    triggerPrice: number | ''
    triggerCondition: 'above' | 'below'
  }
  wallet: {
    providerUrl: string
    connected: boolean
    current: WalletAdapter | undefined
    tokens: WalletToken[]
  }
  settings: {
    uiLocked: boolean
  }
  tradeHistory: any[]
  set: (x: any) => void
  actions: {
    [key: string]: (args?) => void
  }

  // Cooperaty
  traderAccounts: TraderAccount[]
  selectedTraderAccount: {
    current: TraderAccount | null
    initialLoad: boolean
    lastUpdatedAt: number
  }
  practiceForm: {
    prediction: number | ''
    practiceType: 'Loss' | 'Profit'
  }
  exercisesHistory: Exercise[]
  selectedExercise: {
    current: Exercise | null
    initialLoad: boolean
    loadNew: boolean
    lastUpdatedAt: number
  }
}

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
    notificationIdCounter: 0,
    notifications: [],
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: connection,
      websocket: WEBSOCKET_CONNECTION,
      client: new MangoClient(connection, programId),
      cooperatyClient: new CooperatyClient(connection),
      endpoint: ENDPOINT.url,
      slot: 0,
    },
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
    wallet: INITIAL_STATE.WALLET,
    settings: {
      uiLocked: true,
    },
    tradeHistory: [],
    set: (fn) => set(produce(fn)),
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
        console.log('reloaded mango account', reloadedMangoAccount)
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
        const wallet = get().wallet.current
        const actions = get().actions

        if (wallet?.publicKey && connected) {
          try {
            const traderAccounts = await cooperatyClient.getFilteredTraders(
              wallet,
              { user: wallet.publicKey }
            )
            console.log('traderAccounts', traderAccounts)
            if (traderAccounts.length > 0) {
              const sortedTraderAccounts = traderAccounts
                .slice()
                .sort((a, b) =>
                  a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1
                )

              set((state) => {
                state.selectedTraderAccount.initialLoad = false
                state.traderAccounts = sortedTraderAccounts
                if (!state.selectedTraderAccount.current) {
                  const lastTraderAccount = localStorage.getItem(
                    LAST_TRADER_ACCOUNT_KEY
                  )
                  state.selectedTraderAccount.current =
                    traderAccounts.find(
                      (ma) =>
                        ma.publicKey.toString() ===
                        JSON.parse(lastTraderAccount)
                    ) || sortedTraderAccounts[0]
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
          const reloadedTraderAccount =
            await cooperatyClient.reloadTraderAccount(
              wallet,
              selectedTraderAccount
            )
          set((state) => {
            state.selectedTraderAccount.current = reloadedTraderAccount
            state.selectedTraderAccount.lastUpdatedAt = new Date().toISOString()
          })
          console.log('reloaded trader account', reloadedTraderAccount)
        }
      },
      async updateConnection(endpointUrl) {
        const set = get().set
        const newConnection = new Connection(endpointUrl, 'processed')
        const newMangoClient = new MangoClient(newConnection, programId)
        const newCooperatyClient = new CooperatyClient(newConnection)

        set((state) => {
          state.connection.endpoint = endpointUrl
          state.connection.current = newConnection
          state.connection.client = newMangoClient
          state.connection.cooperatyClient = newCooperatyClient
        })
      },
      async fetchExercise() {
        const wallet = get().wallet.current
        const connected = get().wallet.connected
        const endpoint = get().connection.endpoint
        const cooperatyClient = get().connection.cooperatyClient
        const currentWallet =
          wallet?.publicKey && connected
            ? wallet
            : cooperatyClient.getTemporalWallet(endpoint)

        const set = get().set
        const exerciseLoadInitial = get().selectedExercise.initialLoad
        const exerciseLoadNew = get().selectedExercise.initialLoad
        const exercisesHistory = get().exercisesHistory

        const getNewExercise = async () => {
          const exercises = await cooperatyClient.getFilteredExercises(
            currentWallet,
            {
              full: false,
            }
          )
          const newExercises = exercises.filter(
            (exercise) => exercisesHistory.indexOf(exercise.publicKey) === -1
          )
          return newExercises.length > 0 ? newExercises[0] : null
        }

        const setNewExercise = async (exercise) => {
          // TODO: throw error if no cid
          const cid = exercise.account.cid

          // TODO: throw error if now ipfs data
          const response = await Axios.get('https://ipfs.io/ipfs/' + cid)

          exercise.position = response.data.position
          exercise.data = response.data.candles

          // TODO: add type to exercise
          exercise.type = 'Scalping'

          // TODO: add status by filtering exercises history
          exercise.status = 'Active'

          set((state) => {
            // @ts-ignore
            state.selectedExercise.current = exercise
            state.selectedExercise.initialLoad = false
            state.selectedExercise.loadNew = false
            state.lastUpdatedAt = new Date().toISOString()
          })
          localStorage.setItem(
            'last_exercise_account',
            exercise.publicKey.toString()
          )
        }

        let exercise = null

        if (exerciseLoadInitial) {
          const lastExercisePublicKey = localStorage.getItem(
            'last_exercise_account'
          )
          exercise =
            lastExercisePublicKey != null
              ? await cooperatyClient.reloadExercise(currentWallet, {
                  publicKey: new PublicKey(lastExercisePublicKey),
                })
              : await getNewExercise()
        } else if (exerciseLoadNew) {
          exercise = await getNewExercise()
        }

        if (exercise != null) await setNewExercise(exercise)
      },
    },
    traderAccounts: [],
    selectedTraderAccount: {
      current: null,
      initialLoad: true,
      lastUpdatedAt: 0,
    },
    practiceForm: {
      prediction: 0,
      practiceType: 'Profit',
    },
    exercisesHistory: [],
    selectedExercise: {
      current: null,
      initialLoad: true,
      loadNew: false,
      lastUpdatedAt: 0,
    },
  }
})

export default useStore