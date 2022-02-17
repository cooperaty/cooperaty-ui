import {
  getMarketIndexBySymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useSrmAccount from '../hooks/useSrmAccount'
import useStore from '../stores/useStore'

export default function useFees() {
  const { rates } = useSrmAccount()
  const mangoGroup = useStore((s) => s.selectedMangoGroup.current)
  const mangoGroupConfig = useStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useStore((s) => s.selectedMarket.config)
  const market = useStore((s) => s.selectedMarket.current)
  const marketIndex = getMarketIndexBySymbol(
    mangoGroupConfig,
    marketConfig.baseSymbol
  )

  if (!mangoGroup) return {}

  let takerFee, makerFee
  if (market instanceof PerpMarket) {
    takerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()
    )
    makerFee = parseFloat(
      mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()
    )
  } else {
    takerFee = rates.takerWithRebate
    makerFee = rates.maker
  }

  return { makerFee, takerFee }
}
