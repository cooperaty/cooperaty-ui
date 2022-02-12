import { useCallback, useState } from 'react'
import Link from 'next/link'
import { abbreviateAddress } from '../../utils'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import MenuItem from '../elements/MenuItem'
import ThemeSwitch from '../elements/ThemeSwitch'
import useMangoStore from '../../stores/useMangoStore'
import ConnectWalletButton from '../wallet/ConnectWalletButton'
import LanguageSwitch from '../elements/LanguageSwitch'
import { DEFAULT_MARKET_KEY, initialMarket } from './settings/SettingsModal'
import { useTranslation } from 'next-i18next'
import Settings from './settings/Settings'
import TraderAccountsModal from '../trader_account/TraderAccountsModal'

const TopBar = () => {
  const { t } = useTranslation('common')
  const traderAccount = useMangoStore((s) => s.selectedTraderAccount.current)
  const wallet = useMangoStore((s) => s.wallet.current)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )

  const handleCloseAccounts = useCallback(() => {
    setShowAccountsModal(false)
  }, [])

  return (
    <>
      <nav className={`bg-th-bkg-2 border-b border-th-bkg-2`}>
        <div className={`px-4 lg:px-10`}>
          <div className={`flex justify-between h-14`}>
            <div className={`flex`}>
              <Link href={defaultMarket.path} shallow={true}>
                <div
                  className={`cursor-pointer flex-shrink-0 flex items-center`}
                >
                  <img
                    className={`h-8 w-auto`}
                    src="/assets/icons/logo.png"
                    alt="next"
                  />
                </div>
              </Link>
              <div
                className={`hidden md:flex md:items-center md:space-x-4 lg:space-x-6 md:ml-4`}
              >
                {/*<MenuItem href={defaultMarket.path}>{t('League')}</MenuItem>*/}
                <MenuItem href="/practice">{t('practice')}</MenuItem>
                {/*<MenuItem href="/account">{t('account')}</MenuItem>*/}
              </div>
            </div>
            <div className="flex items-center">
              <div className={`pl-2`}>
                <LanguageSwitch />
              </div>
              <div className={`pl-2`}>
                <ThemeSwitch />
              </div>
              <div className="pl-2">
                <Settings />
              </div>
              {traderAccount &&
              traderAccount.account.user.toBase58() ===
                wallet?.publicKey?.toBase58() ? (
                <div className="pl-2">
                  <button
                    className="border border-th-bkg-4 py-1 px-2 rounded text-xs focus:outline-none hover:border-th-fgd-4"
                    onClick={() => setShowAccountsModal(true)}
                  >
                    <div className="font-normal text-th-primary text-xs">
                      {t('account')}
                    </div>
                    {traderAccount.account.name
                      ? traderAccount.account.name
                      : abbreviateAddress(traderAccount.publicKey)}
                  </button>
                </div>
              ) : null}
              <div className="flex">
                <div className="pl-2">
                  <ConnectWalletButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {showAccountsModal ? (
        <TraderAccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null}
    </>
  )
}

export default TopBar
