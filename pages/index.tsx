import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Responsive, WidthProvider } from 'react-grid-layout'
import TopBar from '../components/modules/TopBar'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { PageBodyWrapper } from '../components/elements/styles'
import { breakpoints, defaultLayouts, GRID_LAYOUT_KEY } from '../components/TradePageGrid'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tv-chart']))
      // Will be passed to the page component as props
    }
  }
}

const ResponsiveGridLayout = WidthProvider(Responsive)

const Index = () => {
  const [savedLayouts] = useLocalStorageState(GRID_LAYOUT_KEY, defaultLayouts)
  const router = useRouter()

  useEffect(() => {
    const { pathname } = router
    if (pathname == '/') {
      router.push('/practice')
    }
  }, [])

  return (
    <div className={`bg-th-bkg-0 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
        <div className="animate animate-pulse bg-th-bkg-3 rounded-lg h-10 md:mb-1 mt-6 mx-2 md:mx-3" />
        <ResponsiveGridLayout className="layout" layouts={savedLayouts || defaultLayouts} breakpoints={breakpoints} cols={{
          xl: 12,
          lg: 12,
          md: 12,
          sm: 12,
          xs: 1
        }} rowHeight={15} isDraggable={false} isResizable={false} useCSSTransforms={false}>
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="tvChart" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="orderbook" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="tradeForm" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="practiceForm" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="accountInfo" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="userInfo" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="marketPosition" />
          <div className="animate animate-pulse bg-th-bkg-3 rounded-lg" key="marketTrades" />
        </ResponsiveGridLayout>
      </PageBodyWrapper>
    </div>
  )
}

export default Index
