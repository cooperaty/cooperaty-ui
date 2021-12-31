import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useMangoStore from '../stores/useMangoStore'
import TopBar from '../components/modules/TopBar'
import PracticePageGrid from '../components/PracticePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import AlphaModal, { ALPHA_MODAL_KEY } from '../components/market/AlphaModal'
import { PageBodyWrapper } from '../components/elements/styles'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import IntroTips, { SHOW_TOUR_KEY } from '../components/market/IntroTips'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import {
  walletConnectedSelector,
} from '../stores/selectors'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tv-chart'])),
      // Will be passed to the page component as props
    },
  }
}

const PerpMarket = () => {
  const [alphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)
  const [showTour] = useLocalStorageState(SHOW_TOUR_KEY, false)
  const connected = useMangoStore(walletConnectedSelector)
  const router = useRouter()
  const { width } = useViewport()
  const hideTips = width ? width < breakpoints.md : false

  useEffect(() => {
    if (connected) {
      router.push('/practice')
    }
  }, [connected])

  return (
    <div className={`bg-th-bkg-0 text-th-fgd-1 transition-all`}>
      {showTour && !hideTips ? <IntroTips connected={connected} /> : null}
      <TopBar />
      <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
        <PracticePageGrid />
      </PageBodyWrapper>
      {!alphaAccepted && (
        <AlphaModal isOpen={!alphaAccepted} onClose={() => {}} />
      )}
    </div>
  )
}

export default PerpMarket

