import { MangoAccount, TokenAccount } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import useStore from '../stores/useStore'

export async function deposit({
  amount,
  fromTokenAcc,
  mangoAccount,
  accountName,
}: {
  amount: number
  fromTokenAcc: TokenAccount
  mangoAccount?: MangoAccount
  accountName?: string
}) {
  const mangoGroup = useStore.getState().selectedMangoGroup.current
  const wallet = useStore.getState().wallet.current
  const tokenIndex = mangoGroup.getTokenIndex(fromTokenAcc.mint)
  const mangoClient = useStore.getState().connection.client

  if (mangoAccount) {
    return await mangoClient.deposit(
      mangoGroup,
      mangoAccount,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
      fromTokenAcc.publicKey,
      Number(amount)
    )
  } else {
    return await mangoClient.initMangoAccountAndDeposit(
      mangoGroup,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
      fromTokenAcc.publicKey,
      Number(amount),
      accountName
    )
  }
}

export async function withdraw({
  amount,
  token,
  allowBorrow,
}: {
  amount: number
  token: PublicKey
  allowBorrow: boolean
}) {
  const mangoAccount = useStore.getState().selectedMangoAccount.current
  const mangoGroup = useStore.getState().selectedMangoGroup.current
  const wallet = useStore.getState().wallet.current
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const mangoClient = useStore.getState().connection.client

  return await mangoClient.withdraw(
    mangoGroup,
    mangoAccount,
    wallet,
    mangoGroup.tokens[tokenIndex].rootBank,
    mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
    mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
    Number(amount),
    allowBorrow
  )
}
