export type TrainerIDL = {
  version: '0.0.0'
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
          isMut: false
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
        },
        {
          name: 'bump'
          type: 'u8'
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
          isMut: false
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
          name: 'predictionsCapacity'
          type: 'u8'
        },
        {
          name: 'bump'
          type: 'u8'
        }
      ]
    },
    {
      name: 'addPrediction'
      accounts: [
        {
          name: 'exercise'
          isMut: true
          isSigner: false
        },
        {
          name: 'authority'
          isMut: false
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
          name: 'solutionKey'
          type: 'publicKey'
        },
        {
          name: 'cid'
          type: 'string'
        }
      ]
    },
    {
      name: 'checkPrediction'
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
        },
        {
          name: 'user'
          isMut: false
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
            name: 'solutionKey'
            type: 'publicKey'
          },
          {
            name: 'predictionsCapacity'
            type: 'u8'
          },
          {
            name: 'predictions'
            type: {
              vec: {
                defined: 'Prediction'
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
      name: 'Prediction'
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
          }
        ]
      }
    }
  ]
  errors: [
    {
      code: 300
      name: 'WrongExerciseCreator'
      msg: 'Specified exercise creator does not match the pubkey in the exercise'
    },
    {
      code: 301
      name: 'WrongUser'
      msg: 'Specified user does not match the pubkey in the trader'
    },
    {
      code: 302
      name: 'WrongPredictionIndex'
      msg: 'Specified prediction index does not match the pubkey in the trader'
    },
    {
      code: 303
      name: 'DuplicatedPrediction'
      msg: 'Trader have already added a prediction'
    },
    {
      code: 304
      name: 'InvalidPredictionIndex'
      msg: 'Invalid prediction index'
    }
  ]
}
export const TrainerJSON: TrainerIDL = {
  version: '0.0.0',
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
          isMut: false,
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
        {
          name: 'bump',
          type: 'u8',
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
          isMut: false,
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
          name: 'predictionsCapacity',
          type: 'u8',
        },
        {
          name: 'bump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'addPrediction',
      accounts: [
        {
          name: 'exercise',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
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
          name: 'solutionKey',
          type: 'publicKey',
        },
        {
          name: 'cid',
          type: 'string',
        },
      ],
    },
    {
      name: 'checkPrediction',
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
        {
          name: 'user',
          isMut: false,
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
            name: 'solutionKey',
            type: 'publicKey',
          },
          {
            name: 'predictionsCapacity',
            type: 'u8',
          },
          {
            name: 'predictions',
            type: {
              vec: {
                defined: 'Prediction',
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
      name: 'Prediction',
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
        ],
      },
    },
  ],
  errors: [
    {
      code: 300,
      name: 'WrongExerciseCreator',
      msg: 'Specified exercise creator does not match the pubkey in the exercise',
    },
    {
      code: 301,
      name: 'WrongUser',
      msg: 'Specified user does not match the pubkey in the trader',
    },
    {
      code: 302,
      name: 'WrongPredictionIndex',
      msg: 'Specified prediction index does not match the pubkey in the trader',
    },
    {
      code: 303,
      name: 'DuplicatedPrediction',
      msg: 'Trader have already added a prediction',
    },
    {
      code: 304,
      name: 'InvalidPredictionIndex',
      msg: 'Invalid prediction index',
    },
  ],
}
import { generateErrorMap } from '@saberhq/anchor-contrib'
export const TrainerErrors = generateErrorMap(TrainerJSON)