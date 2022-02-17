import { useState, useEffect } from 'react'
import { notify } from '../../utils/notifications'
import useStore from '../../stores/useStore'
import Button from '../elements/Button'
import Input from '../elements/Input'
import { ElementTitle } from '../elements/styles'
import ButtonGroup from '../elements/ButtonGroup'
import { useTranslation } from 'next-i18next'

const PREDICTION_PERCENT_LIST_LOSS = [
  '0%',
  '-20%',
  '-40%',
  '-60%',
  '-80%',
  '-100%',
]
const PREDICTION_PERCENT_LIST_PROFIT = [
  '0%',
  '20%',
  '40%',
  '60%',
  '80%',
  '100%',
]

const MINIMUM_PREDICTION_FEE = 0.0001

export default function SimplePracticeForm() {
  const set = useStore((s) => s.set)
  const actions = useStore((s) => s.actions)
  const walletTokens = useStore((s) => s.wallet.tokens)
  const cooperatyClient = useStore((s) => s.connection.cooperatyClient)
  const traderAccount = useStore((s) => s.selectedTraderAccount.current)
  const currentExercise = useStore((s) => s.selectedExercise.current)
  const prediction = useStore((s) => s.practiceForm.prediction)

  const { t } = useTranslation('common')
  const [, setSubmitting] = useState(false)
  const [predictionPercentage, setPredictionPercentage] = useState('0%')
  const [, setinsufficientSol] = useState(false)
  const setPrediction = (prediction) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(prediction))) {
        s.practiceForm.prediction = parseFloat(prediction)
      } else {
        s.practiceForm.prediction = prediction
      }
    })

  const disabledChangeExerciseButton =
    currentExercise === null || currentExercise.state != 'active'
  const disabledValidationButton = traderAccount === null

  const onSetPrediction = (prediction: number | '') => {
    setPrediction(prediction)
  }

  const onPredictionTypeChange = () => {
    if (typeof prediction === 'number') {
      setPrediction(-1 * prediction)
    }
  }

  const onPredictionPercentChange = (predictionPercentage: string) => {
    setPredictionPercentage(predictionPercentage)
    setPrediction(parseInt(predictionPercentage.replace('%', '')))
  }

  async function onSubmitChangeExercise() {
    set((s) => {
      s.selectedExercise.current.state = 'skipped'
    })
    await actions.fetchExercise()
  }

  async function onSubmitPrediction() {
    if (!prediction) {
      notify({
        title: t('missing-prediction'),
        type: 'error',
      })
      return
    }

    const wallet = useStore.getState().wallet.current
    const currentExercise = useStore.getState().selectedExercise.current
    const traderAccount = useStore.getState().selectedTraderAccount.current

    if (!wallet || !traderAccount || !currentExercise) return

    setSubmitting(true)

    try {
      const txid = await cooperatyClient.addPrediction(
        wallet,
        traderAccount,
        currentExercise.account,
        prediction,
        currentExercise.account.cid
      )

      notify({ title: t('prediction-successfully-placed'), txid })

      set((s) => {
        s.practiceForm.prediction = 0
        s.selectedExercise.loadNew = true
      })
    } catch (e) {
      notify({
        title: t('error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Check if the user has enough SOL to make the prediction
  useEffect(() => {
    const walletSol = walletTokens.find((a) => a.config.symbol === 'SOL')
    walletSol
      ? setinsufficientSol(walletSol.uiBalance < MINIMUM_PREDICTION_FEE)
      : null
  }, [walletTokens])

  // Update the prediction percentage list choices based on the sign of the current prediction
  useEffect(() => {
    const predictionPercentage = `${prediction}%`
    const predictionPercentageList =
      prediction >= 0
        ? PREDICTION_PERCENT_LIST_PROFIT
        : PREDICTION_PERCENT_LIST_LOSS
    if (predictionPercentageList.includes(predictionPercentage)) {
      setPredictionPercentage(`${prediction}%`)
    } else {
      setPredictionPercentage(null)
    }
  }, [prediction])

  return (
    <div className="flex flex-col h-full">
      <ElementTitle>{currentExercise?.type || 'Practice'}</ElementTitle>
      <div className="grid grid-cols-12 gap-2 text-left">
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('type')}</label>
          <ButtonGroup
            activeValue={prediction >= 0 ? 'Profit' : 'Loss'}
            className="h-10"
            onChange={() => onPredictionTypeChange()}
            values={['Loss', 'Profit']}
          />
        </div>
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('prediction')}</label>
          <Input
            type="number"
            min="0"
            max="100"
            onChange={(e) => onSetPrediction(e.target.value)}
            value={prediction}
            placeholder="0"
            suffix="%"
          />
        </div>
        <div className="col-span-12 mt-1">
          <ButtonGroup
            activeValue={predictionPercentage}
            onChange={(p) => onPredictionPercentChange(p)}
            values={
              prediction >= 0
                ? PREDICTION_PERCENT_LIST_PROFIT
                : PREDICTION_PERCENT_LIST_LOSS
            }
          />
        </div>
        <div className={`col-span-12 pt-2`}>
          <div className={`grid grid-cols-2 grid-rows-1 gap-4 pt-2 sm:pt-4`}>
            <Button
              disabled={disabledChangeExerciseButton}
              onClick={onSubmitChangeExercise}
              className={`${
                !disabledChangeExerciseButton
                  ? 'bg-th-bkg-2 border border-th-white hover:border-th-white'
                  : 'border border-th-bkg-4'
              } text-th-white hover:text-th-fgd-1 hover:bg-th-white w-full'`}
            >
              <span>{t('change-exercise')}</span>
            </Button>
            <Button
              disabled={disabledValidationButton}
              onClick={onSubmitPrediction}
              className={`${
                !disabledValidationButton
                  ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                  : 'border border-th-bkg-4'
              } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark w-full`}
            >
              <span>{t('send-validation')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
