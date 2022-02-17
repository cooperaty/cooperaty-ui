import React, { FunctionComponent, useEffect, useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/solid'
import { PlusCircleIcon } from '@heroicons/react/outline'
import useStore, { TraderAccount } from '../../stores/useStore'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import Modal from '../elements/Modal'
import { ElementTitle } from '../elements/styles'
import Button, { LinkButton } from '../elements/Button'
import { useTranslation } from 'next-i18next'
import NewTraderAccount from './NewTraderAccount'
import Tooltip from '../elements/Tooltip'
import { abbreviateAddress } from '../../utils'

export const LAST_TRADER_ACCOUNT_KEY = 'lastTraderAccountViewed-3.0'

interface AccountsModalProps {
  onClose: () => void
  isOpen: boolean
}

const TraderAccountsModal: FunctionComponent<AccountsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('common')
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [newAccountPublicKey, setNewAccountPublicKey] = useState(null)
  const traderAccounts = useStore((s) => s.traderAccounts)
  const selectedTraderAccount = useStore((s) => s.selectedTraderAccount.current)
  const setStore = useStore((s) => s.set)
  const [, setLastAccountViewed] = useLocalStorageState(LAST_TRADER_ACCOUNT_KEY)

  const handleTraderAccountChange = (traderAccount: TraderAccount) => {
    setLastAccountViewed(traderAccount.publicKey.toString())
    setStore((state) => {
      state.selectedTraderAccount.current = traderAccount
    })

    onClose()
  }

  useEffect(() => {
    if (newAccountPublicKey) {
      setStore((state) => {
        state.selectedTraderAccount.current = traderAccounts.find(
          (ma) => ma.publicKey.toString() === newAccountPublicKey
        )
      })
    }
  }, [traderAccounts, newAccountPublicKey, setStore])

  const handleNewTraderAccountCreation = (newAccountPublicKey) => {
    if (newAccountPublicKey) {
      setNewAccountPublicKey(newAccountPublicKey)
    }
    setShowNewAccountForm(false)
  }

  const handleShowNewAccountForm = () => {
    setNewAccountPublicKey(null)
    setShowNewAccountForm(true)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {traderAccounts.length > 0 ? (
        !showNewAccountForm ? (
          <>
            <Modal.Header>
              <ElementTitle noMarignBottom>{t('trader-accounts')}</ElementTitle>
            </Modal.Header>
            <div className="flex items-center justify-between pb-3 text-th-fgd-1">
              <div className="font-semibold">
                {traderAccounts.length > 1
                  ? t('select-account')
                  : t('your-account')}
              </div>
              <Button
                className="text-xs flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3"
                onClick={() => handleShowNewAccountForm()}
              >
                <div className="flex items-center">
                  <PlusCircleIcon className="h-5 w-5 mr-1.5" />
                  {t('new-account')}
                </div>
              </Button>
            </div>
            <RadioGroup
              value={selectedTraderAccount}
              onChange={(acc) => handleTraderAccountChange(acc)}
            >
              <RadioGroup.Label className="sr-only">
                {t('select-account')}
              </RadioGroup.Label>
              <div className="space-y-2">
                {traderAccounts.map((trader) => (
                  <RadioGroup.Option
                    key={trader.publicKey.toString()}
                    value={trader}
                    className={({ checked }) =>
                      `${
                        checked
                          ? 'bg-th-bkg-3 ring-1 ring-th-green ring-inset'
                          : 'bg-th-bkg-1'
                      }
                      relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <div className="text-sm">
                              <RadioGroup.Label className="cursor-pointer flex items-center text-th-fgd-1">
                                <TraderAccountInfo traderAccount={trader} />
                              </RadioGroup.Label>
                            </div>
                          </div>
                          {checked && (
                            <div className="flex-shrink-0 text-th-green">
                              <CheckCircleIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          </>
        ) : (
          <>
            <NewTraderAccount
              onAccountCreation={handleNewTraderAccountCreation}
            />
            <LinkButton
              className="flex justify-center mt-4 text-th-fgd-3 w-full"
              onClick={() => setShowNewAccountForm(false)}
            >
              {t('cancel')}
            </LinkButton>
          </>
        )
      ) : (
        <NewTraderAccount onAccountCreation={handleNewTraderAccountCreation} />
      )}
    </Modal>
  )
}

const TraderAccountInfo = ({
  traderAccount,
}: {
  traderAccount: TraderAccount
}) => {
  const { t } = useTranslation('common')
  const ranking = traderAccount.account.performance.toNumber()

  return (
    <div className="text-th-fgd-3 text-xs font-normal">
      <div className="pb-0.5 pr-1 text inline-block">
        {traderAccount?.account.name ||
          abbreviateAddress(traderAccount.publicKey)}
      </div>
      <StarIcon
        className="h-5 mr-1.5 w-5 text-th-primary inline-block"
        aria-hidden="true"
      />
      <span className="inline-block">
        <Tooltip
          content={
            <div>
              {t('tooltip-account-liquidated')}{' '}
              <a
                href="https://docs.cooperaty.org/overview#ranking"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('learn-more')}
              </a>
            </div>
          }
        >
          <div className="cursor-help font-normal text-th-fgd-3 leading-4 border-b border-th-fgd-3 border-dashed border-opacity-20 default-transition hover:border-th-bkg-2 inline-block">
            {t('rank')}
          </div>
        </Tooltip>
      </span>
      <div className="pl-2 inline-block">
        <span
          className={
            ranking > 50
              ? 'text-th-green'
              : ranking > 25
              ? 'text-th-orange'
              : 'text-th-red'
          }
        >
          {ranking > 100 ? '>100' : ranking.toFixed(0)}
        </span>
        %
      </div>
    </div>
  )
}

export default React.memo(TraderAccountsModal)
