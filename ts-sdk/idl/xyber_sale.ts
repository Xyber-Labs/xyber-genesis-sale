/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/xyber_sale.json`.
 */
export type XyberSale = {
  "address": "XYBGKPCgL6Twhdjo6LFt9niCgyxnbxN3tacXypc6SSt",
  "metadata": {
    "name": "xyberSale",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "const",
                "value": [
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        },
        {
          "name": "owner",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "saleConfig",
      "discriminator": [
        86,
        47,
        71,
        156,
        87,
        152,
        149,
        246
      ]
    }
  ],
  "events": [
    {
      "name": "batchProcessed",
      "discriminator": [
        199,
        28,
        80,
        191,
        111,
        11,
        127,
        180
      ]
    },
    {
      "name": "claimsOpened",
      "discriminator": [
        126,
        92,
        24,
        148,
        242,
        66,
        8,
        28
      ]
    },
    {
      "name": "creatorClaimed",
      "discriminator": [
        118,
        206,
        30,
        219,
        62,
        164,
        54,
        200
      ]
    },
    {
      "name": "creatorGranted",
      "discriminator": [
        139,
        253,
        204,
        61,
        77,
        195,
        247,
        170
      ]
    },
    {
      "name": "depositMade",
      "discriminator": [
        210,
        201,
        130,
        183,
        244,
        203,
        155,
        199
      ]
    },
    {
      "name": "fundingPeriodStarted",
      "discriminator": [
        24,
        17,
        247,
        144,
        200,
        76,
        119,
        198
      ]
    },
    {
      "name": "launchInitialized",
      "discriminator": [
        60,
        143,
        196,
        55,
        214,
        166,
        10,
        63
      ]
    },
    {
      "name": "numBlocksUpdated",
      "discriminator": [
        169,
        68,
        39,
        54,
        104,
        241,
        228,
        223
      ]
    },
    {
      "name": "poolCreated",
      "discriminator": [
        202,
        44,
        41,
        88,
        104,
        220,
        157,
        82
      ]
    },
    {
      "name": "refundClaimed",
      "discriminator": [
        136,
        64,
        242,
        99,
        4,
        244,
        208,
        130
      ]
    },
    {
      "name": "rosterInitialized",
      "discriminator": [
        111,
        28,
        99,
        210,
        82,
        158,
        188,
        249
      ]
    },
    {
      "name": "rosterShardFinalized",
      "discriminator": [
        136,
        212,
        55,
        122,
        118,
        122,
        150,
        85
      ]
    },
    {
      "name": "rosterShardInitialized",
      "discriminator": [
        110,
        2,
        21,
        250,
        126,
        114,
        61,
        90
      ]
    },
    {
      "name": "seedSet",
      "discriminator": [
        9,
        179,
        143,
        172,
        250,
        146,
        42,
        6
      ]
    },
    {
      "name": "selectionFinalized",
      "discriminator": [
        111,
        84,
        253,
        234,
        76,
        136,
        103,
        185
      ]
    },
    {
      "name": "tokensClaimed",
      "discriminator": [
        25,
        128,
        244,
        55,
        241,
        136,
        200,
        91
      ]
    },
    {
      "name": "withdrawn",
      "discriminator": [
        20,
        89,
        223,
        198,
        194,
        124,
        219,
        13
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAdmin",
      "msg": "Invalid admin account is provided"
    }
  ],
  "types": [
    {
      "name": "batchProcessed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "fromT",
            "type": "u32"
          },
          {
            "name": "processed",
            "type": "u32"
          },
          {
            "name": "heapLen",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "claimsOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "openedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "creatorClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "ticketsClaimed",
            "type": "u32"
          },
          {
            "name": "lamportsEquiv",
            "type": "u64"
          },
          {
            "name": "tokensMinted",
            "type": "u64"
          },
          {
            "name": "dayIndex",
            "type": "i64"
          },
          {
            "name": "remainingTickets",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "creatorGranted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "lockedLamports",
            "type": "u64"
          },
          {
            "name": "reservedTickets",
            "type": "u32"
          },
          {
            "name": "dailyLamportsLimit",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "depositMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ticketsBefore",
            "type": "u32"
          },
          {
            "name": "ticketsAfter",
            "type": "u32"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "totalTickets",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "fundingPeriodStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "fundingPeriodEnd",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "launchInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "saleMint",
            "type": "pubkey"
          },
          {
            "name": "hardCapLamports",
            "type": "u64"
          },
          {
            "name": "minRaiseLamports",
            "type": "u64"
          },
          {
            "name": "perWalletCap",
            "type": "u64"
          },
          {
            "name": "tauLamports",
            "type": "u64"
          },
          {
            "name": "saleAllocation",
            "type": "u64"
          },
          {
            "name": "lpAllocation",
            "type": "u64"
          },
          {
            "name": "numBlocks",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "numBlocksUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "newNumBlocks",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "poolCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "poolId",
            "type": "u64"
          },
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "blockhash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "rangeStart",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "rangeEnd",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "refundClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "refundedLamports",
            "type": "u64"
          },
          {
            "name": "yApproved",
            "docs": [
              "Number of tickets that were approved for token allocation.",
              "If the min raise was not met, this will be 0."
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "rosterInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "rosterShardFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "shardId",
            "type": "u16"
          },
          {
            "name": "totalInShard",
            "type": "u32"
          },
          {
            "name": "shardBase",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "rosterShardInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "shardId",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "saleConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "seedSet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "seedHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "selectionFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "kCapacity",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "tokensClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "yApproved",
            "docs": [
              "Number of winning tickets."
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "withdrawn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ticketsBefore",
            "type": "u32"
          },
          {
            "name": "ticketsAfter",
            "type": "u32"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "totalTickets",
            "type": "u32"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "deployer",
      "type": "pubkey",
      "value": "BMBeWpWc16LQNtqw4JxjSWTf5E9mUBhhPzuTmaVFvxrf"
    },
    {
      "name": "seedRoot",
      "type": "bytes",
      "value": "[114, 111, 111, 116]"
    }
  ]
};
