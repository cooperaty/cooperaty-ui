import { ExternalLinkIcon, StarIcon } from '@heroicons/react/solid'
import useStore from '../../stores/useStore'
import { ElementTitle } from '../elements/styles'
import Tooltip from '../elements/Tooltip'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { useTranslation } from 'next-i18next'

export default function TraderAccountPracticeInfo() {
  const { t } = useTranslation('common')
  const connected = useStore((s) => s.wallet.connected)
  const traderAccount = useStore((s) => s.selectedTraderAccount.current)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const performance = traderAccount
    ? traderAccount.account.performance.toNumber()
    : 0.0

  return (
    <>
      <div
        className={!connected && !isMobile ? 'filter blur-sm' : undefined}
        id="account-details-tip"
      >
        {!isMobile ? <ElementTitle>{t('trader-account')}</ElementTitle> : null}
        <div>
          <div className="flex justify-center text-xs -mt-2">
            <a
              className="flex items-center text-th-fgd-4 hover:text-th-primary"
              href={`https://explorer.solana.com/address/${traderAccount?.publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ADDRESS
              <ExternalLinkIcon className={`h-4 w-4 ml-1.5`} />
            </a>
          </div>
          <div>
            <div className="flex justify-between pb-3">
              <div className="font-normal text-th-fgd-3 leading-4">
                {t('Name')}
              </div>
              <div className="text-th-fgd-1">
                {traderAccount?.account?.name}
              </div>
            </div>
            <Tooltip
              content={
                <div>
                  {t('tooltip-league')}{' '}
                  <a
                    href="https://docs.cooperaty.org/overview#league"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('learn-more')}
                  </a>
                </div>
              }
            >
              <div className="flex justify-between pb-3">
                <div className="font-normal text-th-fgd-3 leading-4">
                  {t('league')}
                </div>
                <div className="text-th-fgd-1">Academy</div>
              </div>
            </Tooltip>
          </div>
          <Tooltip
            content={
              <div>
                {t('tooltip-performance')}{' '}
                <a
                  href="https://docs.cooperaty.org/overview#performance"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('learn-more')}
                </a>
              </div>
            }
          >
            <div className="border border-th-bkg-4 rounded flex items-center my-2 sm:my-3 p-2.5">
              <div className="flex items-center pr-2">
                <StarIcon
                  className="h-5 mr-1.5 w-5 text-th-primary"
                  aria-hidden="true"
                />
                <span>
                  <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2">
                    {t('')}
                  </div>
                </span>
              </div>
              <div className="h-1.5 flex flex-grow rounded bg-th-bkg-4">
                <div
                  style={{
                    width: `${performance}%`,
                  }}
                  className={`flex rounded ${
                    performance > 50
                      ? 'bg-th-green'
                      : performance > 25
                      ? 'bg-th-orange'
                      : 'bg-th-red'
                  }`}
                />
              </div>
              <div className="pl-2 text-right">
                {performance > 100 ? '>100' : performance.toFixed(2)}%
              </div>
            </div>
          </Tooltip>
        </div>
      </div>
    </>
  )
}
