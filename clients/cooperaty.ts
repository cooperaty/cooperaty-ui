import * as anchor from '@project-serum/anchor';
import { WalletAdapter } from '../@types/types'
import { ConfirmOptions } from '@solana/web3.js'
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)
const idl = require('./idl.json')
const opts = {
  preflightCommitment: "processed"
}

export default class CooperatyClient {
  public connection: anchor.web3.Connection;
  public program: any;

  constructor(connection: anchor.web3.Connection, programId: any) {
    this.connection = connection;
    this.program = {idl, programId};
  }

  async getProvider(user: WalletAdapter, airdropBalance = 2 * anchor.web3.LAMPORTS_PER_SOL) {
    const provider = new anchor.Provider(this.connection, user, opts as ConfirmOptions);
    const sig = await provider.connection.requestAirdrop(user.publicKey, airdropBalance);
    await provider.connection.confirmTransaction(sig);

    return {
      key: user,
      provider: provider,
    };
  }

  async getAccountBalance(user) {
    const account = await user.provider.connection.getAccountInfo(user.publicKey);
    return account?.lamports ?? 0;
  }

  programForUser(user) {
    return new anchor.Program(this.program.idl, this.program.programId, user.provider);
  }

  async createTrader(user, name) {
    const [traderPublicKey, bump] = await anchor.web3.PublicKey.findProgramAddress([
      "trader",
      name.slice(0, 32),
      user.key.publicKey.toBytes()
    ], this.program.programId);

    const program = this.programForUser(user);
    await program.rpc.createTrader(name, bump, {
      accounts: {
        trader: traderPublicKey,
        user: user.key.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    return {publicKey: traderPublicKey, account: await program.account.trader.fetch(traderPublicKey)};
  }

  async updateTraderAccount(user, trader) {
    const program = this.programForUser(user);
    return {publicKey: trader.publicKey, account: await program.account.trader.fetch(trader.publicKey)};
  }

  async createExercise(authority, cid, predictions_capacity = 5) {
    const [exercisePublicKey, bump] = await anchor.web3.PublicKey.findProgramAddress([
      "exercise",
      authority.key.publicKey.toBytes(),
      cid.slice(0, 32),
      cid.slice(32, 64)
    ], this.program.programId);

    const program = this.programForUser(authority);
    await program.rpc.createExercise(cid, predictions_capacity, bump, {
      accounts: {
        exercise: exercisePublicKey,
        authority: authority.key.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    return {publicKey: exercisePublicKey, account: await program.account.exercise.fetch(exercisePublicKey)};
  }

  async createMultipleExercises(authority, cids, predictions_capacity = 5) {
    const program = this.programForUser(authority);
    const instructions = [];
    const exercisesPublicKeys = [];

    for (let i = 0; i < cids.length; i++) {
      const cid = cids[i];
      const [exercisePublicKey, bump] = await anchor.web3.PublicKey.findProgramAddress([
        "exercise",
        authority.key.publicKey.toBytes(),
        cid.slice(0, 32),
        cid.slice(32, 64)
      ], this.program.programId);

      exercisesPublicKeys.push(exercisePublicKey);

      if (i < cids.length - 1) {
        instructions.push(program.instruction.createExercise(cid, predictions_capacity, bump, {
          accounts: {
            exercise: exercisePublicKey,
            authority: authority.key.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
        }));
      } else {
        await program.rpc.createExercise(cid, predictions_capacity, bump, {
          accounts: {
            exercise: exercisePublicKey,
            authority: authority.key.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          instructions,
        });
      }
    }

    return await Promise.all(exercisesPublicKeys.map(async (exercisePublicKey): Promise<any> => { return { publicKey: exercisePublicKey, account: await program.account.exercise.fetch(exercisePublicKey) }; }));
  }

  async getExercises(user, filters) {
    const program = this.programForUser(user);

    const cmp = (offset, bytes) => { return { memcmp: { offset, bytes } }}

    const searchFilters = [];

    if ('full' in filters) searchFilters.push(cmp(8, bs58.encode(Buffer.from([filters.full ? 0x1 : 0x0]))));
    if ('cid' in filters) searchFilters.push(cmp(13, bs58.encode(Buffer.from(filters.cid))));

    const exercises = await program.account.exercise.all(searchFilters);

    return exercises;
  }

  async addPrediction(user, trader, exercise, authority, value, cid) {
    const program = this.programForUser(user);
    await program.rpc.addPrediction(new anchor.BN(value), cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: authority.key.publicKey,
        trader: trader.publicKey,
        user: user.key.publicKey,
      },
    });

    return {publicKey: exercise.publicKey, account: await program.account.exercise.fetch(exercise.publicKey)};
  }

  async addOutcome(exercise, authority, outcome, solution_key, cid) {
    const program = this.programForUser(authority);
    await program.rpc.addOutcome(new anchor.BN(outcome), solution_key, cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: authority.key.publicKey,
      },
    });

    return {publicKey: exercise.publicKey, account: await program.account.exercise.fetch(exercise.publicKey)};
  }

  async checkPrediction(user, trader, exercise, authority, index, cid) {
    const program = this.programForUser(authority);
    await program.rpc.checkPrediction(new anchor.BN(index), cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: authority.key.publicKey,
        trader: trader.publicKey,
        user: user.key.publicKey,
      },
    });
  }

  async checkMultiplePredictions(users, traders, exercise, authority, index, cid) {
    const program = this.programForUser(authority);
    const instructions = [];
    const lastTraderIndex = users.length - 1;

    for(let i = 0; i < lastTraderIndex; i++) {
      instructions.push(program.instruction.checkPrediction(new anchor.BN(index), cid, {
        accounts: {
          exercise: exercise.publicKey,
          authority: authority.key.publicKey,
          trader: traders[i].publicKey,
          user: users[i].key.publicKey,
        }}));
    }

    await program.rpc.checkPrediction(new anchor.BN(index), cid, {
      accounts: {
        exercise: exercise.publicKey,
        authority: authority.key.publicKey,
        trader: traders[lastTraderIndex].publicKey,
        user: users[lastTraderIndex].key.publicKey,
      },
      instructions,
    });
  }
}