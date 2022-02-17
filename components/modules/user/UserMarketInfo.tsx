import { PerpMarket } from '@blockworks-foundation/mango-client'
import useStore from '../../../stores/useStore'
import MarketBalances from '../../market/MarketBalances'
import MarketPosition from '../../market/MarketPosition'

const UserMarketInfo = () => {
  const selectedMarket = useStore((s) => s.selectedMarket.current)
  return selectedMarket instanceof PerpMarket ? (
    <MarketPosition />
  ) : (
    <MarketBalances />
  )
}

export default UserMarketInfo
