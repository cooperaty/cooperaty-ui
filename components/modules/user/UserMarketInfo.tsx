import { PerpMarket } from '@blockworks-foundation/mango-client'
import useMangoStore from '../../../stores/useMangoStore'
import MarketBalances from '../../market/MarketBalances'
import MarketPosition from '../../market/MarketPosition'

const UserMarketInfo = () => {
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  return selectedMarket instanceof PerpMarket ? (
    <MarketPosition />
  ) : (
    <MarketBalances />
  )
}

export default UserMarketInfo
