import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useStore from '../stores/useStore'
import TopBar from '../components/modules/TopBar'
import PracticePageGrid from '../components/practice/PracticePageGrid'
import { PageBodyWrapper } from '../components/elements/styles'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { walletConnectedSelector } from '../stores/selectors'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tv-chart'])),
      // Will be passed to the page component as props
    },
  }
}

const PerpMarket = () => {
  const connected = useStore(walletConnectedSelector)
  const router = useRouter()

  useEffect(() => {
    if (connected) {
      router.push('/practice')
    }
  }, [connected])

  return (
    <div className={`bg-th-bkg-0 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
        <PracticePageGrid />
      </PageBodyWrapper>
    </div>
  )
}

export default PerpMarket
