import { useState } from 'react'
import { useOpenOrders } from '../../../hooks/useOpenOrders'
import usePerpPositions from '../../../hooks/usePerpPositions'
import BalancesTable from '../../account/BalancesTable'
import PracticeHistoryTable from './PracticeHistoryTable'
import ManualRefresh from '../../elements/ManualRefresh'
import Tabs from '../../elements/Tabs'
import useMangoAccount from '../../../hooks/useMangoAccount'

const TABS = [
  'Practice History',
]

const UserPracticeInfoTabs = ({ activeTab, setActiveTab }) => {
  const openOrders = useOpenOrders()
  const { openPositions } = usePerpPositions()
  const { mangoAccount } = useMangoAccount()

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className="pb-2 relative">
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        showCount={
          openOrders && openPositions
            ? [
                { tabName: 'Orders', count: openOrders.length },
                { tabName: 'Positions', count: openPositions.length },
              ]
            : null
        }
        tabs={TABS}
      />
      {mangoAccount ? (
        <div className="absolute right-0 top-0">
          <ManualRefresh />
        </div>
      ) : null}
    </div>
  )
}

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case 'Practice History':
      return <PracticeHistoryTable numTrades={100} />
    default:
      return <BalancesTable />
  }
}

const UserPracticeInfo = () => {
  const [activeTab, setActiveTab] = useState('Practice History')

  return (
    <div>
      <UserPracticeInfoTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabContent activeTab={activeTab} />
    </div>
  )
}

export default UserPracticeInfo
