import { EndpointInfo, WalletAdapter } from '../@types/types'
import { ClusterType } from './types'
import {
  Commitment,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js'
import { Config, IDS } from '@blockworks-foundation/mango-client'
import { SignerWallet, SolanaProvider } from '@saberhq/solana-contrib'

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'devnet',
    url: 'https://api.google.devnet.solana.com',
    websocket: 'https://api.google.devnet.solana.com',
    custom: false,
  },
]

export const CLUSTER =
  (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'devnet'
export const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
)

export const DEFAULT_MANGO_GROUP_NAME =
  process.env.NEXT_PUBLIC_GROUP || 'devnet.2'
export const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME
)
export const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
)

export const programId = new PublicKey(defaultMangoGroupIds.mangoProgramId)
export const serumProgramId = new PublicKey(defaultMangoGroupIds.serumProgramId)
export const mangoGroupPk = new PublicKey(defaultMangoGroupIds.publicKey)

export const getProvider = (
  connection: Connection,
  wallet: SignerWallet | WalletAdapter = new SignerWallet(Keypair.generate())
) => {
  return SolanaProvider.load({
    connection,
    wallet,
    opts: connection.commitment as ConfirmOptions,
  })
}

export const LAST_EXERCISE_LOCAL_STORAGE_KEY = 'last_exercise_account'
