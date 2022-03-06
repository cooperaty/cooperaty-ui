import { ExerciseData, TraderData, TrainerSDK } from '../sdk'
import { AccountInfo, Connection } from '@solana/web3.js'
import {
  GroupConfig,
  MangoAccount,
  MangoCache,
  MangoClient,
  MangoGroup,
  MarketConfig,
  PerpMarket,
  TokenAccount,
  TokenConfig,
} from '@blockworks-foundation/mango-client'
import { State } from 'zustand'
import { Notification } from '../utils/notifications'
import { Market } from '@project-serum/serum'
import { WalletAdapter } from '../@types/types'

export class Exercise {
  data: ExerciseData
  chart: {
    candles: [
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
      postBars: number
    }
    timeframe: string[]
  }
  type: 'Scalping' | 'Swing'
  state: 'active' | 'checking' | 'skipped' | 'expired' | 'success' | 'failed'
  solution: {
    cid: string
    datetime: string
    pair: string
    exchange: string
    outcome: number
  }
}

// an object with keys of Solana account addresses that we are
// subscribing to with connection.onAccountChange() in the
// useHydrateStore hook
export interface AccountInfoList {
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

export type ClusterType = 'mainnet' | 'devnet' | 'testnet'

export interface Store extends State {
  notificationIdCounter: number
  notifications: Array<Notification>
  accountInfos: AccountInfoList
  connection: {
    cluster: ClusterType
    current: Connection
    websocket: Connection
    endpoint: string
    client: MangoClient
    cooperatyClient: TrainerSDK
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
  traderAccounts: TraderData[]
  selectedTraderAccount: {
    current: TraderData | null
    initialLoad: boolean
    lastUpdatedAt: number
  }
  practiceForm: {
    validation: number | ''
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
