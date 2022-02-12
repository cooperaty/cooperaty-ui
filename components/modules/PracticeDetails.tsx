import React from 'react'
import useMangoStore from '../../stores/useMangoStore'
import UiLock from '../elements/UiLock'
import ManualRefresh from '../elements/ManualRefresh'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { useTranslation } from 'next-i18next'

const PracticeDetails = () => {
  const { t } = useTranslation('common')
  const currentExercise = useMangoStore((s) => s.selectedExercise.current)

  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const takeProfit = currentExercise.position.takeProfit * 100
  const stopLoss = currentExercise.position.stopLoss * 100

  return (
    <div
      className={`flex flex-col relative md:pb-2 md:pt-3 md:px-3 xl:flex-row xl:items-center xl:justify-between`}
    >
      <div className="flex flex-col xl:flex-row xl:items-center">
        <div className="hidden md:block md:pb-4 md:pr-6 xl:pb-0">
          <div className="flex items-center">
            <img
              alt=""
              width="24"
              height="24"
              src={`/assets/icons/modalities/${currentExercise.type.toLowerCase()}.png`}
              className={`mr-2.5`}
            />
            <div className="font-semibold pr-0.5 text-xl">
              {currentExercise.type}
            </div>
          </div>
        </div>
        <div className="grid grid-flow-row grid-cols-1 md:grid-cols-3 gap-3 xl:grid-cols-none xl:grid-flow-col xl:grid-rows-1 xl:gap-6">
          <div className="flex items-center justify-between md:block">
            <div className="text-th-fgd-3 tiny-text pb-0.5">
              {t('time-left')}
            </div>
            <div className="font-semibold text-th-fgd-1 md:text-xs">{100}s</div>
          </div>
          <div className="flex items-center justify-between md:block">
            <div className="text-th-fgd-3 tiny-text pb-0.5">
              {t('stop-loss')}
            </div>
            {stopLoss || stopLoss === 0 ? (
              <div className="font-semibold md:text-xs text-th-red">
                {stopLoss.toFixed(2) + '%'}
              </div>
            ) : (
              <MarketDataLoader />
            )}
          </div>
          <div className="flex items-center justify-between md:block">
            <div className="text-th-fgd-3 tiny-text pb-0.5">
              {t('take-profit')}
            </div>
            {takeProfit || takeProfit === 0 ? (
              <div className="font-semibold md:text-xs text-th-green">
                {takeProfit.toFixed(2) + '%'}
              </div>
            ) : (
              <MarketDataLoader />
            )}
          </div>
        </div>
      </div>
      <div className="absolute right-4 bottom-0 sm:bottom-auto lg:right-6 flex items-center justify-end">
        {!isMobile ? (
          <div id="layout-tip">
            <UiLock />
          </div>
        ) : null}
        <div className="ml-2" id="data-refresh-tip">
          {!isMobile && connected && mangoAccount ? <ManualRefresh /> : null}
        </div>
      </div>
    </div>
  )
}

export default PracticeDetails

export const MarketDataLoader = () => (
  <div className="animate-pulse bg-th-bkg-3 h-3.5 mt-0.5 w-10 rounded-sm" />
)
