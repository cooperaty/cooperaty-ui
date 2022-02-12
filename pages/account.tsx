import { useCallback, useEffect, useState } from 'react'
import {
  CurrencyDollarIcon,
  DuplicateIcon,
  ExclamationCircleIcon,
  ExternalLinkIcon,
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/outline'
import useMangoStore, { serumProgramId } from '../stores/useMangoStore'
import { copyToClipboard } from '../utils'
import PageBodyContainer from '../components/elements/PageBodyContainer'
import TopBar from '../components/modules/TopBar'
import AccountOrders from '../components/account_page/AccountOrders'
import AccountHistory from '../components/account_page/AccountHistory'
import AccountOverview from '../components/account_page/AccountOverview'
import Button from '../components/elements/Button'
import EmptyState from '../components/elements/EmptyState'
import Loading from '../components/elements/Loading'
import Swipeable from '../components/mobile/Swipeable'
import Tabs from '../components/elements/Tabs'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import Select from '../components/elements/Select'
import { useRouter } from 'next/router'
import { PublicKey } from '@solana/web3.js'
import TraderAccountsModal from '../components/trader_account/TraderAccountsModal'

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['Portfolio', 'Orders', 'History', 'Interest', 'Funding']

export default function Account() {
  const { t } = useTranslation('common')
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [, setShowNameModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [resetOnLeave, setResetOnLeave] = useState(false)
  const connected = useMangoStore((s) => s.wallet.connected)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const wallet = useMangoStore((s) => s.wallet.current)
  const isLoading = useMangoStore((s) => s.selectedMangoAccount.initialLoad)
  const actions = useMangoStore((s) => s.actions)
  const setMangoStore = useMangoStore((s) => s.set)
  const [viewIndex, setViewIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const router = useRouter()
  const { pubkey } = router.query

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  const handleCopyPublicKey = (code) => {
    setIsCopied(true)
    copyToClipboard(code)
  }

  useEffect(() => {
    // @ts-ignore
    if (window.solana) {
      // @ts-ignore
      window.solana.connect({ onlyIfTrusted: true })
    }
  }, [])

  useEffect(() => {
    async function loadUnownedMangoAccount() {
      try {
        const unownedMangoAccountPubkey = new PublicKey(pubkey)
        if (mangoGroup) {
          const unOwnedMangoAccount = await mangoClient.getMangoAccount(
            unownedMangoAccountPubkey,
            serumProgramId
          )
          setMangoStore((state) => {
            state.selectedMangoAccount.current = unOwnedMangoAccount
          })
          actions.fetchTradeHistory()
          setResetOnLeave(true)
        }
      } catch (error) {
        await router.push('/account')
      }
    }

    if (pubkey) {
      loadUnownedMangoAccount()
    }
  }, [pubkey, mangoGroup, mangoClient, setMangoStore, actions, router])

  useEffect(() => {
    if (connected) {
      router.push('/account')
    }
  }, [connected, router])

  useEffect(() => {
    const handleRouteChange = () => {
      if (resetOnLeave) {
        setMangoStore((state) => {
          state.selectedMangoAccount.current = undefined
        })
      }
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [resetOnLeave, router.events, setMangoStore])

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between py-4 md:pb-4 md:pt-10">
          {mangoAccount ? (
            <>
              <div className="pb-3 md:pb-0">
                <h1
                  className={`font-semibold mb-1 mr-3 text-th-fgd-1 text-2xl`}
                >
                  {mangoAccount?.name || t('account')}
                </h1>
                <div className="flex items-center text-th-fgd-3 ">
                  <span className="text-xxs sm:text-xs">
                    {mangoAccount.publicKey.toString()}
                  </span>
                  <DuplicateIcon
                    className="cursor-pointer default-transition h-4 w-4 ml-1.5 hover:text-th-fgd-1"
                    onClick={() => handleCopyPublicKey(mangoAccount.publicKey)}
                  />
                  {isCopied ? (
                    <div className="ml-2 text-th-fgd-2 text-xs">Copied!</div>
                  ) : null}
                </div>
                <div className="flex items-center text-th-red text-xxs">
                  <ExclamationCircleIcon className="h-4 mr-1.5 w-4" />
                  {t('account-address-warning')}
                </div>
              </div>
              <div className="grid grid-cols-3 grid-rows-1 gap-2">
                <Button
                  className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
                  onClick={() => setShowNameModal(true)}
                >
                  <div className="flex items-center">
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    {mangoAccount?.name ? t('edit-name') : t('add-name')}
                  </div>
                </Button>
                <a
                  className="bg-th-bkg-4 col-span-1 default-transition flex font-bold h-8 items-center justify-center pl-3 pr-3 rounded-full text-th-fgd-1 text-xs hover:text-th-fgd-1 hover:brightness-[1.15] focus:outline-none"
                  href={`https://explorer.solana.com/address/${mangoAccount?.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{t('explorer')}</span>
                  <ExternalLinkIcon className={`h-4 w-4 ml-1.5`} />
                </a>
                <Button
                  className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
                  onClick={() => setShowAccountsModal(true)}
                >
                  {t('accounts')}
                </Button>
              </div>
            </>
          ) : null}
        </div>
        {mangoAccount ? (
          !isMobile ? (
            <Tabs
              activeTab={activeTab}
              onChange={handleTabChange}
              tabs={TABS}
            />
          ) : (
            <div className="pb-2 pt-3">
              <Select
                value={t(TABS[viewIndex].toLowerCase())}
                onChange={(e) => handleChangeViewIndex(e)}
              >
                {TABS.map((tab, index) => (
                  <Select.Option key={index + tab} value={index}>
                    {t(tab.toLowerCase())}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )
        ) : null}
        <div className="bg-th-bkg-2 p-4 sm:p-6 rounded-lg">
          {mangoAccount ? (
            !isMobile ? (
              <TabContent activeTab={activeTab} />
            ) : (
              <Swipeable
                index={viewIndex}
                onChangeIndex={handleChangeViewIndex}
              >
                <div>
                  <AccountOverview />
                </div>
                <div>
                  <AccountOrders />
                </div>
                <div>
                  <AccountHistory />
                </div>
              </Swipeable>
            )
          ) : connected ? (
            isLoading ? (
              <div className="flex justify-center py-10">
                <Loading />
              </div>
            ) : (
              <EmptyState
                buttonText={t('create-account')}
                icon={<CurrencyDollarIcon />}
                onClickButton={() => setShowAccountsModal(true)}
                title={t('no-account-found')}
              />
            )
          ) : (
            <EmptyState
              buttonText={t('connect')}
              desc={t('connect-view')}
              icon={<LinkIcon />}
              onClickButton={() => wallet.connect()}
              title={t('connect-wallet')}
            />
          )}
        </div>
      </PageBodyContainer>
      {showAccountsModal ? (
        <TraderAccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Portfolio':
      return <AccountOverview />
    case 'Orders':
      return <AccountOrders />
    case 'History':
      return <AccountHistory />
    default:
      return <AccountOverview />
  }
}
