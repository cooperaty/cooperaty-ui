import dynamic from 'next/dynamic'
import { Responsive, WidthProvider } from 'react-grid-layout'
import MobilePracticePage from './mobile/MobilePracticePage'

const TVChartContainer = dynamic(
  () => import('../components/TradingView/practiceChart'),
  { ssr: false }
)
import { useEffect, useState } from 'react'
import FloatingElement from './elements/FloatingElement'
import AccountPracticeInfo from './account/AccountPracticeInfo'
import PracticeForm from './modules/practice_form/PracticeForm'
import UserPracticeInfo from './modules/user/UserPracticeInfo'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'
import PracticeDetails from './modules/PracticeDetails'

const ResponsiveGridLayout = WidthProvider(Responsive)

export const defaultLayouts = {
  xl: [
    { i: 'tvChart', x: 2, y: 0, w: 6, h: 30 },
    { i: 'practiceForm', x: 8, y: 1, w: 2, h: 12 },
    { i: 'accountInfo', x: 8, y: 2, w: 2, h: 18 },
    { i: 'userInfo', x: 2, y: 3, w: 8, h: 10 },
  ],
  lg: [
    { i: 'tvChart', x: 0, y: 0, w: 9, h: 28, minW: 4 },
    { i: 'practiceForm', x: 9, y: 1, w: 3, h: 12, minW: 3 },
    { i: 'accountInfo', x: 9, y: 2, w: 3, h: 16, minW: 3 },
    { i: 'userInfo', x: 0, y: 3, w: 12, h: 10, minW: 6 },
  ],
  md: [
    { i: 'tvChart', x: 0, y: 0, w: 8, h: 28, minW: 2 },
    { i: 'practiceForm', x: 8, y: 1, w: 4, h: 12, minW: 2 },
    { i: 'accountInfo', x: 8, y: 2, w: 4, h: 16, minW: 2 },
    { i: 'userInfo', x: 0, y: 3, w: 12, h: 10, minW: 6 },
  ],
  sm: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 24, minW: 6 },
    { i: 'practiceForm', x: 0, y: 1, w: 6, h: 11, minW: 2 },
    { i: 'accountInfo', x: 6, y: 1, w: 6, h: 11, minW: 2 },
    { i: 'userInfo', x: 0, y: 2, w: 12, h: 10, minW: 6 },
  ],
  xs: [
    { i: 'tvChart', x: 0, y: 0, w: 12, h: 25, minW: 6 },
    { i: 'practiceForm', x: 0, y: 1, w: 12, h: 11, minW: 2 },
    { i: 'accountInfo', x: 6, y: 1, w: 12, h: 11, minW: 2 },
    { i: 'userInfo', x: 0, y: 2, w: 12, h: 10, minW: 6 },
  ],
}

export const GRID_LAYOUT_KEY = 'practiceSavedLayouts' + Math.random() * 100
export const breakpoints = { xl: 1600, lg: 1280, md: 1024, sm: 768, xs: 0 }
const PracticePageGrid = () => {
  const { uiLocked } = useMangoStore((s) => s.settings)
  const [savedLayouts, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const onLayoutChange = (layouts) => {
    if (layouts) {
      setSavedLayouts(layouts)
    }
  }

  const onBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }

  const [, setCurrentBreakpoint] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const position = {
    direction: 'long_position',
    takeProfit: 0.03,
    stopLoss: 0.015,
    bars: 10,
  }

  return !isMobile ? (
    <>
      <PracticeDetails position={position} />
      <ResponsiveGridLayout
        className="layout"
        layouts={savedLayouts || defaultLayouts}
        breakpoints={breakpoints}
        cols={{ xl: 12, lg: 12, md: 12, sm: 12, xs: 1 }}
        rowHeight={15}
        isDraggable={!uiLocked}
        isResizable={!uiLocked}
        onBreakpointChange={(newBreakpoint) =>
          onBreakpointChange(newBreakpoint)
        }
        onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
        measureBeforeMount
      >
        <div key="tvChart">
          <FloatingElement className="h-full pl-0 md:pl-0 md:pr-1 md:pb-1 md:pt-3">
            <TVChartContainer position={position} />
          </FloatingElement>
        </div>
        <div key="practiceForm">
          <PracticeForm />
        </div>
        <div key="accountInfo">
          <FloatingElement className="h-full" showConnect>
            <AccountPracticeInfo />
          </FloatingElement>
        </div>
        <div key="userInfo">
          <FloatingElement className="h-full">
            <UserPracticeInfo />
          </FloatingElement>
        </div>
      </ResponsiveGridLayout>
    </>
  ) : (
    <MobilePracticePage />
  )
}

export default PracticePageGrid
