import { useState } from 'react'
import { Disclosure } from '@headlessui/react'
import dynamic from 'next/dynamic'
import { XIcon } from '@heroicons/react/outline'
import useMangoStore from '../../stores/useMangoStore'
import { CandlesIcon } from '../elements/icons'
import SwipeableTabs from './SwipeableTabs'
import FloatingElement from '../elements/FloatingElement'
import Swipeable from './Swipeable'
import PracticeHistoryTable from '../modules/user/PracticeHistoryTable'
import AccountPracticeInfo from '../account/AccountPracticeInfo'
import SimplePracticeForm from '../modules/practice_form/SimplePracticeForm'

const TVChartContainer = dynamic(
  () => import('../../components/TradingView/practiceChart'),
  { ssr: false }
)

const MobilePracticePage = () => {
  const [viewIndex, setViewIndex] = useState(0)
  const connected = useMangoStore((s) => s.wallet.connected)
  const currentExercise = useMangoStore((s) => s.currentExercise)
  const exerciseType = currentExercise.type

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const TABS = ['Predict', 'Account', 'History']

  const position = {
    direction: 'long_position',
    takeProfit: 0.03,
    stopLoss: 0.015,
    bars: 10,
  }

  return (
    <div className="pb-14 pt-4 px-2">
      <div className="relative">
        <div className="flex items-center">
          <img
            alt=""
            width="30"
            height="30"
            src={`/assets/icons/modalities/${exerciseType.toLowerCase()}.png`}
            className="mr-2"
          />
          <div className="flex items-center">
            <div className="font-semibold pr-0.5 text-xl">{exerciseType}</div>
          </div>
        </div>
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              <Disclosure.Button>
                <div className="absolute right-0 top-0 bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
                  {open ? (
                    <XIcon className="h-4 w-4" />
                  ) : (
                    <CandlesIcon className="h-5 w-5" />
                  )}
                </div>
              </Disclosure.Button>
              <Disclosure.Panel>
                <div className="bg-th-bkg-2 h-96 mb-2 p-2 rounded-lg">
                  <TVChartContainer position={position} />
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
      <SwipeableTabs
        onChange={handleChangeViewIndex}
        tabs={TABS}
        tabIndex={viewIndex}
      />
      <Swipeable index={viewIndex} onChangeIndex={handleChangeViewIndex}>
        <div>
          <FloatingElement
            className="h-full p-5 md:px-4 fadein-floating-element"
            showConnect
          >
            <div className={`${!connected ? 'filter blur-sm' : ''}`}>
              <SimplePracticeForm />
            </div>
          </FloatingElement>
        </div>
        <div>
          <FloatingElement
            className="h-full p-5 md:px-4 fadein-floating-element"
            showConnect
          >
            <div className={`${!connected ? 'filter blur-sm' : ''}`}>
              <AccountPracticeInfo />
            </div>
          </FloatingElement>
        </div>
        <div>
          <FloatingElement
            className="h-full p-5 md:px-4 fadein-floating-element"
            showConnect
          >
            <div className={`${!connected ? 'filter blur-sm' : ''}`}>
              <PracticeHistoryTable />
            </div>
          </FloatingElement>
        </div>
      </Swipeable>
    </div>
  )
}

export default MobilePracticePage
