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
    "description": "Xyber token sale solana program"
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
          "name": "baseMint"
        },
        {
          "name": "quoteMint"
        },
        {
          "name": "bucketPool",
          "docs": [
            "CHECK"
          ],
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
                  66,
                  85,
                  67,
                  75,
                  69,
                  84,
                  95,
                  80,
                  79,
                  79,
                  76
                ]
              },
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "bucketPoolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bucketPool"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        },
        {
          "name": "backend",
          "type": "pubkey"
        },
        {
          "name": "multisig",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setupBucket",
      "discriminator": [
        178,
        191,
        41,
        63,
        215,
        21,
        237,
        129
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
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
          "name": "bucket",
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
                  66,
                  85,
                  67,
                  75,
                  69,
                  84
                ]
              },
              {
                "kind": "arg",
                "path": "bucketName"
              }
            ]
          }
        },
        {
          "name": "bucketBaseAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bucket"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "baseMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "baseMint",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bucketName",
          "type": "string"
        },
        {
          "name": "bucketData",
          "type": {
            "defined": {
              "name": "bucketData"
            }
          }
        }
      ]
    },
    {
      "name": "setupRound",
      "discriminator": [
        126,
        152,
        76,
        105,
        83,
        79,
        107,
        112
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
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
          "name": "roundConfig",
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
                  82,
                  79,
                  85,
                  78,
                  68
                ]
              },
              {
                "kind": "arg",
                "path": "round"
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
          "name": "round",
          "type": {
            "defined": {
              "name": "round"
            }
          }
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bucketData",
      "discriminator": [
        60,
        27,
        209,
        210,
        232,
        46,
        221,
        39
      ]
    },
    {
      "name": "roundConfig",
      "discriminator": [
        243,
        42,
        51,
        251,
        4,
        170,
        69,
        234
      ]
    },
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
  "errors": [
    {
      "code": 6000,
      "name": "invalidAdmin",
      "msg": "Invalid admin account is provided"
    },
    {
      "code": 6001,
      "name": "invalidBaseMint",
      "msg": "Invalid base mint is provided"
    }
  ],
  "types": [
    {
      "name": "bucketData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bucketSupply",
            "type": "u64"
          },
          {
            "name": "registeredSupply",
            "type": "u64"
          },
          {
            "name": "claimedSupply",
            "type": "u64"
          },
          {
            "name": "burntSupply",
            "type": "u64"
          },
          {
            "name": "vestingPlan",
            "type": {
              "vec": "string"
            }
          }
        ]
      }
    },
    {
      "name": "round",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "public"
          }
        ]
      }
    },
    {
      "name": "roundConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
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
            "name": "backend",
            "type": "pubkey"
          },
          {
            "name": "baseMint",
            "type": "pubkey"
          },
          {
            "name": "quoteMint",
            "type": "pubkey"
          },
          {
            "name": "multisig",
            "type": {
              "option": "pubkey"
            }
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
      "name": "saleBucketSeed",
      "type": "bytes",
      "value": "[115, 97, 108, 101]"
    },
    {
      "name": "seedRoot",
      "type": "bytes",
      "value": "[114, 111, 111, 116]"
    }
  ]
};
