import { useState, useEffect } from 'react'
import useIpAddress from '../../../hooks/useIpAddress'
import { notify } from '../../../utils/notifications'
import useMangoStore from '../../../stores/useMangoStore'
import Button from '../../elements/Button'
import Input from '../../elements/Input'
import { ElementTitle } from '../../elements/styles'
import ButtonGroup from '../../elements/ButtonGroup'
import Tooltip from '../../elements/Tooltip'
import { useTranslation } from 'next-i18next'

export default function SimplePracticeForm() {
  const { t } = useTranslation('common')
  const set = useMangoStore((s) => s.set)
  const { ipAllowed } = useIpAddress()
  const currentExercise = useMangoStore((s) => s.currentExercise)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const actions = useMangoStore((s) => s.actions)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { prediction } = useMangoStore((s) => s.practiceForm)
  const cooperatyClient = useMangoStore((s) => s.connection.cooperatyClient)

  const [, setSubmitting] = useState(false)
  const [predictionPercent, setPredictionPercent] = useState('5%')
  const [, setinsufficientSol] = useState(false)

  useEffect(() => {
    const walletSol = walletTokens.find((a) => a.config.symbol === 'SOL')
    walletSol ? setinsufficientSol(walletSol.uiBalance < 0.01) : null
  }, [walletTokens])

  useEffect(() => {
    const predictionPercent = `${prediction}%`
    const predictionPercentList =
      prediction >= 0 ? predictionPercentListProfit : predictionPercentListLoss
    if (predictionPercentList.includes(predictionPercent)) {
      setPredictionPercent(`${prediction}%`)
    } else {
      setPredictionPercent(null)
    }
  }, [prediction])

  const setPrediction = (prediction) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(prediction))) {
        s.practiceForm.prediction = parseFloat(prediction)
      } else {
        s.practiceForm.prediction = prediction
      }
    })

  const onSetPrediction = (prediction: number | '') => {
    setPrediction(prediction)
  }

  const predictionPercentListLoss = [
    '0%',
    '-20%',
    '-40%',
    '-60%',
    '-80%',
    '-100%',
  ]
  const predictionPercentListProfit = ['0%', '20%', '40%', '60%', '80%', '100%']
  const onPredictionTypeChange = () => {
    if (typeof prediction === 'number') {
      setPrediction(-1 * prediction)
    }
  }

  const onPredictionPercentChange = (predictionPercent: string) => {
    setPredictionPercent(predictionPercent)
    setPrediction(parseInt(predictionPercent.replace('%', '')))
  }

  async function onSubmitChangeExercise() {
    actions.fetchExercise()
  }

  async function onSubmitPrediction() {
    if (!prediction) {
      notify({
        title: t('missing-prediction'),
        type: 'error',
      })
      return
    }

    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const wallet = useMangoStore.getState().wallet.current
    const currentExercise = useMangoStore.getState().currentExercise

    if (!wallet || !mangoAccount || !market) return
    setSubmitting(true)

    try {
      const exercise = await cooperatyClient.addPrediction(
        wallet, // user
        wallet, // trader
        currentExercise.account, // exercise
        wallet, // authority
        prediction, // prediction
        currentExercise.id // cid
      )

      notify({ title: t('successfully-placed'), txid: exercise.txid })
      setPrediction('0')
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

  const disabledPracticeButton = false

  return (
    <div className="flex flex-col h-full">
      <ElementTitle>{currentExercise.type}</ElementTitle>
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
            activeValue={predictionPercent}
            onChange={(p) => onPredictionPercentChange(p)}
            values={
              prediction >= 0
                ? predictionPercentListProfit
                : predictionPercentListLoss
            }
          />
        </div>
        <div className={`col-span-12 pt-2`}>
          {ipAllowed ? (
            <div className={`grid grid-cols-2 grid-rows-1 gap-4 pt-2 sm:pt-4`}>
              <Button
                disabled={disabledPracticeButton}
                onClick={onSubmitChangeExercise}
                className={`${
                  !disabledPracticeButton
                    ? 'bg-th-bkg-2 border border-th-white hover:border-th-white'
                    : 'border border-th-bkg-4'
                } text-th-white hover:text-th-fgd-1 hover:bg-th-white w-full`}
              >
                <span>{t('change-exercise')}</span>
              </Button>
              <Button
                disabled={disabledPracticeButton}
                onClick={onSubmitPrediction}
                className={`${
                  !disabledPracticeButton
                    ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                    : 'border border-th-bkg-4'
                } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark w-full`}
              >
                <span>{t('send-validation')}</span>
              </Button>
            </div>
          ) : (
            <div className="flex-grow">
              <Tooltip content={t('country-not-allowed-tooltip')}>
                <div className="flex">
                  <Button disabled className="flex-grow">
                    <span>{t('country-not-allowed')}</span>
                  </Button>
                </div>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
