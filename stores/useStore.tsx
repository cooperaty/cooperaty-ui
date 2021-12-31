import create, { State } from 'zustand'
import produce from 'immer'
import { IDS, TokenAccount, TokenConfig } from '@blockworks-foundation/mango-client'
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { Notification } from '../utils/notifications'
import { NODE_URL_KEY } from '../components/modules/settings/SettingsModal'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet',
    url: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    websocket: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    custom: false
  },
  {
    name: 'devnet',
    url: 'https://api.devnet.solana.com',
    websocket: 'https://api.devnet.solana.com',
    custom: false
  }
]

type ClusterType = 'mainnet' | 'devnet'

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'mainnet'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
)

const DEFAULT_MANGO_GROUP_NAME = process.env.NEXT_PUBLIC_GROUP || 'mainnet.1'
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
)

export const programId = new PublicKey(defaultMangoGroupIds.mangoProgramId)
export const serumProgramId = new PublicKey(defaultMangoGroupIds.serumProgramId)

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: []
  }
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
    slot: number
  }
  accounts: number[]
  selectedAccount: {
    current: number | null
    initialLoad: boolean
    lastUpdatedAt: number
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
  predictionHistory: any[]
  set: (x: any) => void
  actions: {
    [key: string]: (args?) => void
  },
  practiceForm: {
    prediction: number | ''
    practiceType:
      | 'Loss'
      | 'Profit'
  },
  currentExercise: {
    cid: string,
    type: | 'Scalping' | 'Swing',
    position: {
      direction: | 'long_position' | 'short_position',
      takeProfit: number,
      stopLoss: number,
      bars: number,
    },
    timeLeft: number,
  }
}

const useStore = create<Store>((set, get) => {
  const rpcUrl =
    typeof window !== 'undefined' && CLUSTER === 'mainnet'
      ? JSON.parse(localStorage.getItem(NODE_URL_KEY)) || ENDPOINT.url
      : ENDPOINT.url
  const connection = new Connection(rpcUrl, 'processed' as Commitment)
  return {
    notificationIdCounter: 0,
    notifications: [],
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: connection,
      websocket: WEBSOCKET_CONNECTION,
      endpoint: ENDPOINT.url,
      slot: 0
    },
    accounts: [],
    selectedAccount: {
      current: null,
      initialLoad: true,
      lastUpdatedAt: 0
    },
    wallet: INITIAL_STATE.WALLET,
    settings: {
      uiLocked: true
    },
    predictionHistory: [],
    set: (fn) => set(produce(fn)),
    actions: {
      async fetchPredictionHistory() {
        //const selectedAccount = get().selectedAccount.current
        const set = get().set

        set((state) => {
          state.predictionHistory = []
        })
      },
      async reloadAccount() {
        const set = get().set
        const account = get().selectedAccount.current
        // const connection = get().connection.current

        set((state) => {
          state.selectedAccount.current = account
          state.selectedAccount.lastUpdatedAt = new Date().toISOString()
        })
        console.log('reloaded account', account)
      },
      async updateConnection(endpointUrl) {
        const set = get().set

        const newConnection = new Connection(endpointUrl, 'processed')

        set((state) => {
          state.connection.endpoint = endpointUrl
          state.connection.current = newConnection
        })
      }
    },
    practiceForm: {
      prediction: 0,
      practiceType: 'Profit'
    },
    currentExercise: {
      cid: 'QmZmcRLEftCgd8AwsS8hKYSVPtFuEXy6cgWJqL1LEVj8tW',
      type: 'Scalping',
      position: {
        direction: 'long_position',
        takeProfit: 0.03,
        stopLoss: 0.015,
        bars: 10
      },
      timeLeft: 100
    }
  }
})

export default useStore
