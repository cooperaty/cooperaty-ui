import * as anchor from '@project-serum/anchor'
import { WalletAdapter } from '../@types/types'
import { ConfirmOptions } from '@solana/web3.js'
import Wallet from '@project-serum/sol-wallet-adapter'
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)
const idl = require('./idl.json')

export default class CooperatyClient {
  public connection: anchor.web3.Connection
  public idl: any

  constructor(connection: anchor.web3.Connection) {
    this.connection = connection
    this.idl = idl
  }

  getTemporalWallet(endpoint: string) {
    const wallet = new Wallet(
      'https://www.sollet.io',
      endpoint
    ) as WalletAdapter
    wallet.provider = this.getProvider(wallet)
    wallet.program = this.getProgram(wallet)
    return wallet
  }

  async getAccountBalance(wallet) {
    const account = await wallet.provider.connection.getAccountInfo(
      wallet.publicKey
    )
    return account?.lamports ?? 0
  }

  async getAirdrop(wallet: WalletAdapter, airdropBalance) {
    const sig = await wallet.provider.connection.requestAirdrop(
      wallet.publicKey,
      airdropBalance * anchor.web3.LAMPORTS_PER_SOL
    )
    return await wallet.provider.connection.confirmTransaction(sig)
  }

  getProvider(wallet: WalletAdapter) {
    return new anchor.Provider(
      this.connection,
      wallet,
      this.connection.commitment as ConfirmOptions
    )
  }

  getProgram(wallet: WalletAdapter) {
    return new anchor.Program(
      this.idl,
      this.idl.metadata.address,
      wallet.provider
    )
  }

  async createTrader(wallet: WalletAdapter, name) {
    const [traderPublicKey, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        ['trader', name.slice(0, 32), wallet.publicKey.toBytes()],
        wallet.program.programId
      )

    await wallet.program.rpc.createTrader(name, bump, {
      accounts: {
        trader: traderPublicKey,
        user: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    })

    return {
      publicKey: traderPublicKey,
      account: await wallet.program.account.trader.fetch(traderPublicKey),
    }
  }

  async reloadTraderAccount(wallet, trader) {
    return {
      publicKey: trader.publicKey,
      account: await wallet.program.account.trader.fetch(trader.publicKey),
    }
  }

  async getFilteredTraders(wallet, filters) {
    const cmp = (offset, bytes) => {
      return { memcmp: { offset, bytes } }
    }

    const searchFilters = []

    if ('user' in filters) searchFilters.push(cmp(8, filters.user.toBase58()))

    return await wallet.program.account.trader.all(searchFilters)
  }

  async createExercise(wallet, cid, predictions_capacity = 5) {
    const [exercisePublicKey, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          'exercise',
          wallet.key.publicKey.toBytes(),
          cid.slice(0, 32),
          cid.slice(32, 64),
        ],
        wallet.program.programId
      )

    await wallet.program.rpc.createExercise(cid, predictions_capacity, bump, {
      accounts: {
        exercise: exercisePublicKey,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    })

    return {
      publicKey: exercisePublicKey,
      account: await wallet.program.account.exercise.fetch(exercisePublicKey),
    }
  }

  async reloadExercise(wallet, exercise) {
    return {
      publicKey: exercise.publicKey,
      account: await wallet.program.account.exercise.fetch(exercise.publicKey),
    }
  }

  async createMultipleExercises(wallet, cids, predictions_capacity = 5) {
    const instructions = []
    const exercisesPublicKeys = []

    for (let i = 0; i < cids.length; i++) {
      const cid = cids[i]
      const [exercisePublicKey, bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [
            'exercise',
            wallet.publicKey.toBytes(),
            cid.slice(0, 32),
            cid.slice(32, 64),
          ],
          wallet.program.programId
        )

      exercisesPublicKeys.push(exercisePublicKey)

      if (i < cids.length - 1) {
        instructions.push(
          wallet.program.instruction.createExercise(
            cid,
            predictions_capacity,
            bump,
            {
              accounts: {
                exercise: exercisePublicKey,
                authority: wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
              },
            }
          )
        )
      } else {
        await wallet.program.rpc.createExercise(
          cid,
          predictions_capacity,
          bump,
          {
            accounts: {
              exercise: exercisePublicKey,
              authority: wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            },
            instructions,
          }
        )
      }
    }

    return await Promise.all(
      exercisesPublicKeys.map(async (exercisePublicKey): Promise<any> => {
        return {
          publicKey: exercisePublicKey,
          account: await wallet.program.account.exercise.fetch(
            exercisePublicKey
          ),
        }
      })
    )
  }

  async reloadMultipleExercises(wallet, exercises) {
    return await Promise.all(
      exercises.map(async (exercise): Promise<any> => {
        return {
          publicKey: exercise.publicKey,
          account: await wallet.program.account.exercise.fetch(
            exercise.publicKey
          ),
        }
      })
    )
  }

  async getFilteredExercises(wallet, filters) {
    const cmp = (offset, bytes) => {
      return { memcmp: { offset, bytes } }
    }

    const searchFilters = []

    if ('full' in filters)
      searchFilters.push(
        cmp(8, bs58.encode(Buffer.from([filters.full ? 0x1 : 0x0])))
      )
    if ('cid' in filters)
      searchFilters.push(cmp(13, bs58.encode(Buffer.from(filters.cid))))

    return await wallet.program.account.exercise.all(searchFilters)
  }

  async addPrediction(wallet, trader, exercise, value, cid) {
    return await wallet.program.rpc.addPrediction(new anchor.BN(value), cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: exercise.authority.publicKey,
        trader: trader.publicKey,
        user: wallet.publicKey,
      },
    })
  }

  async addOutcome(wallet, exercise, outcome, solution_key, cid) {
    return await wallet.program.rpc.addOutcome(
      new anchor.BN(outcome),
      solution_key,
      cid,
      {
        accounts: {
          exercise: exercise.publicKey,
          authority: exercise.authority.publicKey,
        },
      }
    )
  }

  async checkPrediction(wallet, trader, exercise, index, cid) {
    return await wallet.program.rpc.checkPrediction(new anchor.BN(index), cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: wallet.exercise.authority.publicKey,
        trader: trader.publicKey,
        user: wallet.publicKey,
      },
    })
  }

  async checkMultiplePredictions(wallet, users, traders, exercise, index, cid) {
    const instructions = []
    const lastTraderIndex = users.length - 1

    for (let i = 0; i < lastTraderIndex; i++) {
      instructions.push(
        wallet.program.instruction.checkPrediction(new anchor.BN(index), cid, {
          accounts: {
            exercise: exercise.publicKey,
            authority: exercise.authority.publicKey,
            trader: traders[i].publicKey,
            user: users[i].key.publicKey,
          },
        })
      )
    }

    await wallet.program.rpc.checkPrediction(new anchor.BN(index), cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: exercise.authority.publicKey,
        trader: traders[lastTraderIndex].publicKey,
        user: users[lastTraderIndex].key.publicKey,
      },
      instructions,
    })
  }
}
