import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { TradeIcon } from '../elements/icons'
import useMangoGroupConfig from '../../hooks/useMangoGroupConfig'
import { useTranslation } from 'next-i18next'

const StyledBarItemLabel = ({ children, ...props }) => (
  <div style={{ fontSize: '0.6rem', lineHeight: 1 }} {...props}>
    {children}
  </div>
)

const BottomBar = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const groupConfig = useMangoGroupConfig()

  useEffect(() => {
    const markets = []
    const allMarkets = [...groupConfig.spotMarkets, ...groupConfig.perpMarkets]
    allMarkets.forEach((market) => {
      const base = market.name.slice(0, -5)
      const found = markets.find((b) => b.baseAsset === base)
      if (!found) {
        markets.push({ baseAsset: base, markets: [market] })
      } else {
        found.markets.push(market)
      }
    })
  }, [])

  return (
    <>
      <div className="bg-th-bkg-1 default-transition grid grid-cols-1 grid-rows-1 py-2.5">
        <Link
          href={{
            pathname: '/practice',
          }}
          shallow={true}
        >
          <div
            className={`${
              asPath === '/' || asPath.includes('practice')
                ? 'text-th-primary'
                : 'text-th-fgd-3'
            } col-span-1 cursor-pointer default-transition flex flex-col items-center hover:text-th-primary`}
          >
            <TradeIcon className="h-4 mb-1 w-4" />
            <StyledBarItemLabel>{t('practice')}</StyledBarItemLabel>
          </div>
        </Link>
      </div>
    </>
  )
}

export default BottomBar
