import useMangoStore from '../stores/useMangoStore'

export async function createAccount({ accountName } : { accountName: string }) {
  const wallet = useMangoStore.getState().wallet.current

  // return await anchor.createAccount...
}