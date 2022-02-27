import { generateErrorMap } from '@saberhq/anchor-contrib'

export type TrainerIDL = {
  version: '0.1.0'
  name: 'trainer'
  instructions: [
    {
      name: 'createTrader'
      accounts: [
        {
          name: 'trader'
          isMut: true
          isSigner: false
        },
        {
          name: 'user'
          isMut: true
          isSigner: true
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'name'
          type: 'string'
        }
      ]
    },
    {
      name: 'createExercise'
      accounts: [
        {
          name: 'exercise'
          isMut: true
          isSigner: false
        },
        {
          name: 'authority'
          isMut: true
          isSigner: true
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'cid'
          type: 'string'
        },
        {
          name: 'validationsCapacity'
          type: 'u8'
        }
      ]
    },
    {
      name: 'addValidation'
      accounts: [
        {
          name: 'exercise'
          isMut: true
          isSigner: false
        },
        {
          name: 'trader'
          isMut: true
          isSigner: false
        },
        {
          name: 'user'
          isMut: false
          isSigner: true
        }
      ]
      args: [
        {
          name: 'value'
          type: 'i64'
        },
        {
          name: 'cid'
          type: 'string'
        }
      ]
    },
    {
      name: 'addOutcome'
      accounts: [
        {
          name: 'exercise'
          isMut: true
          isSigner: false
        },
        {
          name: 'authority'
          isMut: false
          isSigner: true
        }
      ]
      args: [
        {
          name: 'outcome'
          type: 'i64'
        },
        {
          name: 'solutionCid'
          type: 'string'
        },
        {
          name: 'cid'
          type: 'string'
        }
      ]
    },
    {
      name: 'checkValidation'
      accounts: [
        {
          name: 'exercise'
          isMut: true
          isSigner: false
        },
        {
          name: 'authority'
          isMut: false
          isSigner: true
        },
        {
          name: 'trader'
          isMut: true
          isSigner: false
        }
      ]
      args: [
        {
          name: 'index'
          type: 'u8'
        },
        {
          name: 'cid'
          type: 'string'
        }
      ]
    }
  ]
  accounts: [
    {
      name: 'Trader'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'user'
            type: 'publicKey'
          },
          {
            name: 'name'
            type: 'string'
          },
          {
            name: 'performance'
            type: 'u64'
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    },
    {
      name: 'Exercise'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'full'
            type: 'bool'
          },
          {
            name: 'cid'
            type: 'string'
          },
          {
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'outcome'
            type: 'i64'
          },
          {
            name: 'solutionCid'
            type: 'string'
          },
          {
            name: 'validationsCapacity'
            type: 'u8'
          },
          {
            name: 'validations'
            type: {
              vec: {
                defined: 'Validation'
              }
            }
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    }
  ]
  types: [
    {
      name: 'Validation'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'value'
            type: 'i64'
          },
          {
            name: 'trader'
            type: 'publicKey'
          },
          {
            name: 'user'
            type: 'publicKey'
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 6000
      name: 'WrongExerciseCreator'
      msg: 'Specified exercise creator does not match the pubkey in the exercise'
    },
    {
      code: 6001
      name: 'WrongUser'
      msg: 'Specified user does not match the pubkey in the trader'
    },
    {
      code: 6002
      name: 'WrongValidationIndex'
      msg: 'Specified validation index does not match the pubkey in the trader'
    },
    {
      code: 6003
      name: 'DuplicatedValidation'
      msg: 'Trader have already added a validation'
    },
    {
      code: 6004
      name: 'InvalidValidationIndex'
      msg: 'Invalid validation index'
    },
    {
      code: 6005
      name: 'BumpNotFound'
      msg: 'Bump not found'
    }
  ]
}
export const TrainerJSON: TrainerIDL = {
  version: '0.1.0',
  name: 'trainer',
  instructions: [
    {
      name: 'createTrader',
      accounts: [
        {
          name: 'trader',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    },
    {
      name: 'createExercise',
      accounts: [
        {
          name: 'exercise',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'cid',
          type: 'string',
        },
        {
          name: 'validationsCapacity',
          type: 'u8',
        },
      ],
    },
    {
      name: 'addValidation',
      accounts: [
        {
          name: 'exercise',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'trader',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: 'value',
          type: 'i64',
        },
        {
          name: 'cid',
          type: 'string',
        },
      ],
    },
    {
      name: 'addOutcome',
      accounts: [
        {
          name: 'exercise',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: 'outcome',
          type: 'i64',
        },
        {
          name: 'solutionCid',
          type: 'string',
        },
        {
          name: 'cid',
          type: 'string',
        },
      ],
    },
    {
      name: 'checkValidation',
      accounts: [
        {
          name: 'exercise',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'trader',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'index',
          type: 'u8',
        },
        {
          name: 'cid',
          type: 'string',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'Trader',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'user',
            type: 'publicKey',
          },
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'performance',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
    {
      name: 'Exercise',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'full',
            type: 'bool',
          },
          {
            name: 'cid',
            type: 'string',
          },
          {
            name: 'authority',
            type: 'publicKey',
          },
          {
            name: 'outcome',
            type: 'i64',
          },
          {
            name: 'solutionCid',
            type: 'string',
          },
          {
            name: 'validationsCapacity',
            type: 'u8',
          },
          {
            name: 'validations',
            type: {
              vec: {
                defined: 'Validation',
              },
            },
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'Validation',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'value',
            type: 'i64',
          },
          {
            name: 'trader',
            type: 'publicKey',
          },
          {
            name: 'user',
            type: 'publicKey',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'WrongExerciseCreator',
      msg: 'Specified exercise creator does not match the pubkey in the exercise',
    },
    {
      code: 6001,
      name: 'WrongUser',
      msg: 'Specified user does not match the pubkey in the trader',
    },
    {
      code: 6002,
      name: 'WrongValidationIndex',
      msg: 'Specified validation index does not match the pubkey in the trader',
    },
    {
      code: 6003,
      name: 'DuplicatedValidation',
      msg: 'Trader have already added a validation',
    },
    {
      code: 6004,
      name: 'InvalidValidationIndex',
      msg: 'Invalid validation index',
    },
    {
      code: 6005,
      name: 'BumpNotFound',
      msg: 'Bump not found',
    },
  ],
}
export const TrainerErrors = generateErrorMap(TrainerJSON)
