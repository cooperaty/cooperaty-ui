import { useMemo, useState } from 'react'
import { SwitchHorizontalIcon } from '@heroicons/react/outline'
import { getWeights } from '@blockworks-foundation/mango-client'
import useStore from '../../stores/useStore'
import AdvancedTradeForm from './trade_form/AdvancedTradeForm'
import SimpleTradeForm from './trade_form/SimpleTradeForm'
import {
  FlipCard,
  FlipCardBack,
  FlipCardFront,
  FlipCardInner,
} from '../elements/FlipCard'
import FloatingElement from '../elements/FloatingElement'

export default function TradeForm() {
  const [showAdvancedFrom, setShowAdvancedForm] = useState(true)
  const marketConfig = useStore((s) => s.selectedMarket.config)
  const mangoGroup = useStore((s) => s.selectedMangoGroup.current)
  const connected = useStore((s) => s.wallet.connected)

  const handleFormChange = () => {
    setShowAdvancedForm(!showAdvancedFrom)
  }

  const initLeverage = useMemo(() => {
    if (!mangoGroup || !marketConfig) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    const w =
      marketConfig.kind === 'perp' ? ws.perpAssetWeight : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  return (
    <FlipCard>
      <FlipCardInner flip={showAdvancedFrom}>
        {showAdvancedFrom ? (
          <FlipCardFront>
            <FloatingElement
              className="h-full px-1 py-0 md:px-4 md:py-4 fadein-floating-element"
              showConnect
            >
              <div className={`${!connected ? 'filter blur-sm' : ''}`}>
                {/* <button
                  onClick={handleFormChange}
                  className="absolute hidden md:flex items-center justify-center right-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                >
                  <SwitchHorizontalIcon className="w-5 h-5" />
                </button> */}
                <AdvancedTradeForm initLeverage={initLeverage} />
              </div>
            </FloatingElement>
          </FlipCardFront>
        ) : (
          <FlipCardBack>
            <FloatingElement
              className="h-full px-1 md:px-4 fadein-floating-element"
              showConnect
            >
              <div className={`${!connected ? 'filter blur-sm' : ''}`}>
                <button
                  onClick={handleFormChange}
                  className="absolute flex items-center justify-center right-4 rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                >
                  <SwitchHorizontalIcon className="w-5 h-5" />
                </button>
                <SimpleTradeForm initLeverage={initLeverage} />
              </div>
            </FloatingElement>
          </FlipCardBack>
        )}
      </FlipCardInner>
    </FlipCard>
  )
}
