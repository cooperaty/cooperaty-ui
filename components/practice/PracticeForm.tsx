import useStore from '../../stores/useStore'
import SimplePracticeForm from './SimplePracticeForm'
import { FlipCard, FlipCardBack, FlipCardInner } from '../elements/FlipCard'
import FloatingElement from '../elements/FloatingElement'

export default function PracticeForm() {
  const connected = useStore((s) => s.wallet.connected)

  return (
    <FlipCard>
      <FlipCardInner>
        <FlipCardBack>
          <FloatingElement
            className="h-full px-1 md:px-4 fadein-floating-element"
            showConnect
          >
            <div className={`${!connected ? 'filter blur-sm' : ''}`}>
              <SimplePracticeForm />
            </div>
          </FloatingElement>
        </FlipCardBack>
      </FlipCardInner>
    </FlipCard>
  )
}
