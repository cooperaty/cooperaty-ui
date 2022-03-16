import { useState } from 'react'
import BalancesTable from '../account/BalancesTable'
import PracticeHistoryTable from './PracticeHistoryTable'
import ManualRefresh from '../elements/ManualRefresh'
import Tabs from '../elements/Tabs'
import useStore from '../../stores/useStore'
import { ExerciseHistoryItem } from '../../stores/types'

const TABS = ['Practice History']

const UserPracticeInfoTabs = ({ activeTab, setActiveTab }) => {
  const traderAccount = useStore((state) => state.selectedTraderAccount.current)
  const actions = useStore((state) => state.actions)
  // @ts-ignore
  const exerciseHistoryItemsNoSkipped: ExerciseHistoryItem[] =
    actions.getFilteredExerciseHistoryItems(
      (exercisesHistoryItem) =>
        exercisesHistoryItem.state != 'skipped' &&
        exercisesHistoryItem.state != 'expired' &&
        exercisesHistoryItem.state != 'corrupted',
      // @ts-ignore
      true
    )

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  return (
    <div className="pb-2 relative">
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        showCount={
          exerciseHistoryItemsNoSkipped.length
            ? [
                {
                  tabName: 'Practice History',
                  count: exerciseHistoryItemsNoSkipped.length,
                },
              ]
            : null
        }
        tabs={TABS}
      />
      {traderAccount ? (
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
      return <PracticeHistoryTable numExercises={50} />
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
