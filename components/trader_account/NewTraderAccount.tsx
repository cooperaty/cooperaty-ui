import React, { FunctionComponent, useState } from 'react'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import Input from '../elements/Input'
import { ElementTitle } from '../elements/styles'
import useMangoStore from '../../stores/useMangoStore'
import Loading from '../elements/Loading'
import Button from '../elements/Button'
import Tooltip from '../elements/Tooltip'
import { notify } from '../../utils/notifications'
import { useTranslation } from 'next-i18next'
import InlineNotification from '../elements/InlineNotification'

interface NewAccountProps {
  onAccountCreation?: (x?) => void
}

const NewTraderAccount: FunctionComponent<NewAccountProps> = ({
  onAccountCreation,
}) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const [invalidNameMessage, setInvalidNameMessage] = useState('')
  const [name, setName] = useState('')
  const wallet = useMangoStore((s) => s.wallet.current)
  const actions = useMangoStore((s) => s.actions)
  const cooperatyClient = useMangoStore((s) => s.connection.cooperatyClient)

  const handleNewTraderAccount = () => {
    setSubmitting(true)
    cooperatyClient
      .createTrader(wallet, name)
      .then(async (traderAccount) => {
        await actions.fetchAllTraderAccounts()
        setSubmitting(false)
        onAccountCreation(traderAccount.publicKey)
      })
      .catch((e) => {
        setSubmitting(false)
        console.error(e)
        notify({
          title: t('create-trader-account-error'),
          description: e.message,
          type: 'error',
        })
        onAccountCreation()
      })
  }

  const validateNameInput = () => {
    if (name.length >= 33) {
      setInvalidNameMessage(t('character-limit'))
    }
  }

  const onChangeNameInput = (name) => {
    setName(name)
    if (invalidNameMessage) {
      setInvalidNameMessage('')
    }
  }

  return (
    <>
      <ElementTitle>{t('create-trader-account')}</ElementTitle>
      <div className="mx-auto pb-4 text-center text-th-fgd-3 text-xs">
        {t('insufficient-sol')}
      </div>
      <div className="border-b border-th-bkg-4 mb-4 pb-6">
        <div className="flex items-center pb-2 text-th-fgd-1">
          {t('trader-name')}{' '}
          <span className="ml-1 text-th-fgd-3">{t('optional')}</span>
          <Tooltip content={t('tooltip-name-onchain')}>
            <InformationCircleIcon className="h-5 w-5 ml-2 text-th-primary" />
          </Tooltip>
        </div>
        <Input
          type="text"
          className={`border border-th-fgd-4 flex-grow`}
          error={!!invalidNameMessage}
          placeholder="e.g. Symbiosis"
          value={name}
          onBlur={validateNameInput}
          onChange={(e) => onChangeNameInput(e.target.value)}
        />
        {invalidNameMessage ? (
          <div className="flex items-center pt-1.5 text-th-red">
            <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
            {invalidNameMessage}
          </div>
        ) : null}
      </div>
      <div className={`flex justify-center`}>
        <Button onClick={handleNewTraderAccount} className="w-full">
          <div className={`flex items-center justify-center`}>
            {submitting && <Loading className="-ml-1 mr-3" />}
            {t('lets-go')}
          </div>
        </Button>
      </div>
      <div className="pt-3">
        <InlineNotification desc={t('trader-account-info')} type="info" />
      </div>
    </>
  )
}

export default NewTraderAccount
