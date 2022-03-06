import useStore from '../../stores/useStore'
import BalancesTable from '../account/BalancesTable'
import Switch from '../elements/Switch'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'

const SHOW_ZERO_BALANCE_KEY = 'showZeroAccountBalances'

export default function AccountOverview() {
  const { t } = useTranslation('common')
  const traderAccount = useStore((state) => state.selectedTraderAccount.current)
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    SHOW_ZERO_BALANCE_KEY,
    true
  )

  return traderAccount ? (
    <>
      <div className="flex justify-between pb-4">
        <div className="text-th-fgd-1 text-lg">Balances</div>
        <Switch
          checked={showZeroBalances}
          className="text-xs"
          onChange={() => setShowZeroBalances(!showZeroBalances)}
        >
          {t('show-zero')}
        </Switch>
      </div>
      <BalancesTable showZeroBalances={showZeroBalances} />
    </>
  ) : null
}
