import { useState } from 'react'
import { Disclosure } from '@headlessui/react'
import dynamic from 'next/dynamic'
import { XIcon } from '@heroicons/react/outline'
import useStore from '../../stores/useStore'
import { CandlesIcon } from '../elements/icons'
import SwipeableTabs from '../mobile/SwipeableTabs'
import FloatingElement from '../elements/FloatingElement'
import Swipeable from '../mobile/Swipeable'
import PracticeHistoryTable from './PracticeHistoryTable'
import AccountPracticeInfo from '../trader_account/TraderAccountPracticeInfo'
import SimplePracticeForm from './SimplePracticeForm'
import { useTranslation } from 'next-i18next'

const TVChartContainer = dynamic(() => import('../tradingview/practiceChart'), {
  ssr: false,
})

const MobilePracticePage = () => {
  const { t } = useTranslation('common')
  const [viewIndex, setViewIndex] = useState(0)
  const connected = useStore((s) => s.wallet.connected)
  const currentExercise = useStore((s) => s.selectedExercise.current)

  const isExerciseAvailable = !(currentExercise === null)

  const handleChangeViewIndex = (index) => {
    setViewIndex(index)
  }

  const TABS = ['Predict', 'Account', 'History']

  return (
    <div className="pb-14 pt-4 px-2">
      <div className="relative">
        <div className="flex items-center">
          <img
            alt=""
            width="30"
            height="30"
            src={`${
              isExerciseAvailable
                ? `/assets/icons/modalities/${currentExercise.chart.type.toLowerCase()}.png`
                : 'unknown.svg'
            }`}
            className="mr-2"
          />
          <div className="flex items-center">
            <div className="font-semibold pr-0.5 text-xl">
              {isExerciseAvailable
                ? currentExercise.chart.type
                : t('no-exercise-available')}
            </div>
          </div>
        </div>
        {isExerciseAvailable && (
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
                    <TVChartContainer />
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        )}
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
