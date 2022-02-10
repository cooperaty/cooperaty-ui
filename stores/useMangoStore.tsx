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

export class TraderAccount {
  publicKey: PublicKey
  owner: PublicKey
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

interface MangoStore extends State {
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
  currentExercise: {
    id: string
    account: any
    type: 'Scalping' | 'Swing'
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
    position: {
      direction: 'long_position' | 'short_position'
      takeProfit: number
      stopLoss: number
      bars: number
    }
    state: 'active' | 'answered' | 'skipped'
  }
}

const useMangoStore = create<MangoStore>((set, get) => {
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
        const set = get().set
        const cid = get().currentExercise.id
        const response = await Axios.get('https://ipfs.io/ipfs/' + cid)
        console.log(response)

        set((state) => {
          state.currentExercise.position = response.data.position
          state.currentExercise.data = response.data.candles
        })

        console.log(get().currentExercise.position)
      },
      async fetchExerciseId() {
        const wallet = get().wallet.current
        const connected = get().wallet.connected
        const cooperatyClient = get().connection.cooperatyClient
        const currentExercise = get().currentExercise
        const lastExercisePubkey = localStorage.getItem('last_exercise_account')
        const set = get().set

        console.log('EA', lastExercisePubkey)

        if (
          wallet?.publicKey &&
          connected &&
          currentExercise.state != 'active'
        ) {
          const user = await cooperatyClient.getProvider(wallet)
          let exercise = null

          // if there is a last exercise in the localstorage,
          // check if it is still active and assign it to the current exercise
          if (lastExercisePubkey != null) {
            const lastExerciseAccount = await cooperatyClient.getExercise(
              user,
              new PublicKey(lastExercisePubkey)
            )
            if (!lastExerciseAccount.account.full)
              exercise = lastExerciseAccount
          }

          // if there is no last exercise in the localstorage,
          // or if the last exercise is not active anymore,
          // get the first exercise from the global list of exercises
          if (exercise == null) {
            const exercises = await cooperatyClient.getExercises(user, {
              full: false,
            })
            if (exercises.length > 0) {
              exercise = exercises[0]
            }
          }

          // if there is an active exercise, set it as the current exercise
          if (exercise != null && currentExercise.id != exercise.account?.cid) {
            set((state) => {
              // @ts-ignore
              state.currentExercise.id = exercise.account.cid
              state.currentExercise.account = exercise
              state.currentExercise.state = 'active'
            })
            localStorage.setItem(
              'last_exercise_account',
              exercise.publicKey.toString()
            )
          }
        }
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
    currentExercise: {
      id: 'bafkreieuenothwt6vlex57nlj3b7olib6qlbkgquk4orwa3oas2xanevim',
      account: {},
      type: 'Scalping',
      data: [
        {
          time: 1588888888,
          low: 0.1,
          high: 0.2,
          open: 0.1,
          close: 0.2,
          volume: 0.1,
        },
      ],
      position: {
        direction: 'long_position',
        takeProfit: 0.03,
        stopLoss: 0.015,
        bars: 10,
      },
      state: 'answered',
    },
  }
})

export default useMangoStore
