import React from 'react'
import useStore from '../../stores/useStore'
import UiLock from '../elements/UiLock'
import ManualRefresh from '../elements/ManualRefresh'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from './PracticePageGrid'
import { useTranslation } from 'next-i18next'

const PracticeDetails = () => {
  const actions = useStore((s) => s.actions)
  const connected = useStore((s) => s.wallet.connected)
  const currentExercise = useStore((s) => s.selectedExercise.current)
  const traderAccount = useStore((s) => s.selectedTraderAccount.current)

  const { t } = useTranslation('common')
  const { width } = useViewport()

  const isMobile = width ? width < breakpoints.sm : false
  const isExerciseAvailable = currentExercise && currentExercise.file

  const takeProfitPercentage = isExerciseAvailable
    ? currentExercise.file?.position.takeProfit * 100
    : 0
  const stopLossPercentage = isExerciseAvailable
    ? currentExercise.file?.position.stopLoss * 100
    : 0

  const reloadTraderAndExercise = async () => {
    await actions.reloadTraderAccount()
    await actions.fetchExercise()
  }

  const reloadExercise = async () => {
    await actions.fetchExercise()
  }

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
              src={`${
                isExerciseAvailable
                  ? `/assets/icons/modalities/${currentExercise.file.type.toLowerCase()}.png`
                  : 'unknown.svg'
              }`}
              className={`mr-2.5`}
            />
            <div className="font-semibold pr-0.5 text-xl">
              {isExerciseAvailable
                ? currentExercise.file.type
                : t('no-exercise-available')}
            </div>
          </div>
        </div>
        {isExerciseAvailable && (
          <div className="grid grid-flow-row grid-cols-1 md:grid-cols-3 gap-3 xl:grid-cols-none xl:grid-flow-col xl:grid-rows-1 xl:gap-6">
            <div className="flex items-center justify-between md:block">
              <div className="text-th-fgd-3 tiny-text pb-0.5">
                {t('time-left')}
              </div>
              <div className="font-semibold text-th-fgd-1 md:text-xs">
                {100}s
              </div>
            </div>
            <div className="flex items-center justify-between md:block">
              <div className="text-th-fgd-3 tiny-text pb-0.5">
                {t('stop-loss')}
              </div>
              {stopLossPercentage || stopLossPercentage === 0 ? (
                <div className="font-semibold md:text-xs text-th-red">
                  {stopLossPercentage.toFixed(2) + '%'}
                </div>
              ) : (
                <MarketDataLoader />
              )}
            </div>
            <div className="flex items-center justify-between md:block">
              <div className="text-th-fgd-3 tiny-text pb-0.5">
                {t('take-profit')}
              </div>
              {takeProfitPercentage || takeProfitPercentage === 0 ? (
                <div className="font-semibold md:text-xs text-th-green">
                  {takeProfitPercentage.toFixed(2) + '%'}
                </div>
              ) : (
                <MarketDataLoader />
              )}
            </div>
            <div className="flex items-center justify-between md:block">
              <div className="text-th-fgd-3 tiny-text pb-0.5">{t('state')}</div>
              {currentExercise.state ? (
                <div className="font-semibold md:text-xs">
                  {t(currentExercise.state)}
                </div>
              ) : (
                <MarketDataLoader />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="absolute right-4 bottom-0 sm:bottom-auto lg:right-6 flex items-center justify-end">
        {!isMobile ? (
          <div id="layout-tip">
            <UiLock />
          </div>
        ) : null}
        <div className="ml-2" id="data-refresh-tip">
          {!isMobile &&
            connected &&
            (traderAccount ? (
              <ManualRefresh callback={reloadTraderAndExercise} />
            ) : (
              <ManualRefresh callback={reloadExercise} />
            ))}
        </div>
      </div>
    </div>
  )
}

export default PracticeDetails

export const MarketDataLoader = () => (
  <div className="animate-pulse bg-th-bkg-3 h-3.5 mt-0.5 w-10 rounded-sm" />
)
