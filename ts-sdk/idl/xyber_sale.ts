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
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "buyer",
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
                  82,
                  79,
                  79,
                  84
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
          "name": "vestingPlan",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
                ]
              },
              {
                "kind": "const",
                "value": [
                  86,
                  69,
                  83,
                  84,
                  73,
                  78,
                  71,
                  95,
                  80,
                  76,
                  65,
                  78
                ]
              },
              {
                "kind": "account",
                "path": "vesting_config.vesting_plan",
                "account": "vestingConfig"
              }
            ]
          }
        },
        {
          "name": "vestingConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
                ]
              },
              {
                "kind": "const",
                "value": [
                  86,
                  69,
                  83,
                  84,
                  73,
                  78,
                  71,
                  95,
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              },
              {
                "kind": "arg",
                "path": "bucketName"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "bucketData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
          "name": "bucketPoolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bucketData"
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
          "name": "buyerBaseAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
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
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
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
          "name": "vestingPlan",
          "type": "string"
        }
      ]
    },
    {
      "name": "depositAsset",
      "discriminator": [
        107,
        93,
        89,
        87,
        226,
        203,
        154,
        19
      ],
      "accounts": [
        {
          "name": "buyer",
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
                  82,
                  79,
                  79,
                  84
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
          "name": "vestingConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
                ]
              },
              {
                "kind": "const",
                "value": [
                  86,
                  69,
                  83,
                  84,
                  73,
                  78,
                  71,
                  95,
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              },
              {
                "kind": "arg",
                "path": "round"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "roundConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
          "name": "baseMint"
        },
        {
          "name": "quoteMint"
        },
        {
          "name": "buyerQuoteAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
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
                  82,
                  79,
                  79,
                  84
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
                  83,
                  65,
                  76,
                  69
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
          "name": "bucketData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
                "path": "round"
              }
            ]
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
          "name": "round",
          "type": {
            "defined": {
              "name": "round"
            }
          }
        },
        {
          "name": "paymentAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositSol",
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "backend",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
          "name": "vestingConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
                ]
              },
              {
                "kind": "const",
                "value": [
                  86,
                  69,
                  83,
                  84,
                  73,
                  78,
                  71,
                  95,
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              },
              {
                "kind": "arg",
                "path": "round"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "roundConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
                  82,
                  79,
                  79,
                  84
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
                  83,
                  65,
                  76,
                  69
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
          "name": "bucketData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
          "name": "solPrice",
          "type": "u128"
        },
        {
          "name": "paymentAmount",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
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
                  82,
                  79,
                  79,
                  84
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
                  82,
                  79,
                  79,
                  84
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
                  83,
                  65,
                  76,
                  69
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
                  82,
                  79,
                  79,
                  84
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
                  82,
                  79,
                  79,
                  84
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
      "name": "setupDeterministicVesting",
      "discriminator": [
        94,
        122,
        230,
        165,
        103,
        180,
        117,
        134
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
                  82,
                  79,
                  79,
                  84
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
          "name": "participant"
        },
        {
          "name": "bucketData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
          "name": "vestingConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
                ]
              },
              {
                "kind": "const",
                "value": [
                  86,
                  69,
                  83,
                  84,
                  73,
                  78,
                  71,
                  95,
                  67,
                  79,
                  78,
                  70,
                  73,
                  71
                ]
              },
              {
                "kind": "arg",
                "path": "bucketName"
              },
              {
                "kind": "account",
                "path": "participant"
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
          "name": "bucketName",
          "type": "string"
        },
        {
          "name": "newAllocation",
          "type": "u64"
        },
        {
          "name": "vestingPlan",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "tokensClaimed",
          "type": "u64"
        },
        {
          "name": "tokensBurnt",
          "type": "u64"
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
                  82,
                  79,
                  79,
                  84
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
                  82,
                  79,
                  79,
                  84
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
    },
    {
      "name": "setupVestingPlan",
      "discriminator": [
        49,
        122,
        114,
        231,
        72,
        124,
        208,
        249
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
                  82,
                  79,
                  79,
                  84
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
          "name": "vestingPlan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
                ]
              },
              {
                "kind": "const",
                "value": [
                  86,
                  69,
                  83,
                  84,
                  73,
                  78,
                  71,
                  95,
                  80,
                  76,
                  65,
                  78
                ]
              },
              {
                "kind": "arg",
                "path": "vestingPlanName"
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
          "name": "vestingPlanName",
          "type": "string"
        },
        {
          "name": "plan",
          "type": {
            "defined": {
              "name": "vestingPlan"
            }
          }
        }
      ]
    },
    {
      "name": "withdrawAsset",
      "discriminator": [
        78,
        193,
        207,
        125,
        63,
        193,
        129,
        12
      ],
      "accounts": [
        {
          "name": "multisig",
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
                  82,
                  79,
                  79,
                  84
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
          "name": "bucketPool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
                  83,
                  65,
                  76,
                  69
                ]
              }
            ]
          }
        },
        {
          "name": "quoteMint",
          "writable": true
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
          "name": "withdrawOwner",
          "writable": true
        },
        {
          "name": "withdrawAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "withdrawOwner"
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
      "args": []
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "multisig",
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
                  82,
                  79,
                  79,
                  84
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
                  82,
                  79,
                  79,
                  84
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
                  83,
                  65,
                  76,
                  69
                ]
              }
            ]
          }
        },
        {
          "name": "addressToWithdrawTo",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawUnsoldTokens",
      "discriminator": [
        132,
        251,
        59,
        118,
        38,
        162,
        168,
        77
      ],
      "accounts": [
        {
          "name": "multisig",
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
                  82,
                  79,
                  79,
                  84
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
          "name": "bucketData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  79,
                  79,
                  84
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
                "path": "bucketData"
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
          "name": "withdrawOwner",
          "writable": true
        },
        {
          "name": "withdrawAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "withdrawOwner"
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
          "name": "baseMint"
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
          "name": "amount",
          "type": "u64"
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
    },
    {
      "name": "vestingConfig",
      "discriminator": [
        0,
        138,
        71,
        135,
        26,
        29,
        43,
        125
      ]
    },
    {
      "name": "vestingPlan",
      "discriminator": [
        220,
        100,
        188,
        22,
        177,
        159,
        229,
        3
      ]
    }
  ],
  "events": [
    {
      "name": "claimEvent",
      "discriminator": [
        93,
        15,
        70,
        170,
        48,
        140,
        212,
        219
      ]
    },
    {
      "name": "depositEvent",
      "discriminator": [
        120,
        248,
        61,
        83,
        31,
        142,
        107,
        144
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
      "name": "invalidBackend",
      "msg": "Invalid backend account is provided"
    },
    {
      "code": 6002,
      "name": "invalidBaseMint",
      "msg": "Invalid base mint is provided"
    },
    {
      "code": 6003,
      "name": "invalidQuoteMint",
      "msg": "Invalid quote mint is provided"
    },
    {
      "code": 6004,
      "name": "bucketSupplyExceeded",
      "msg": "Bucket supply exceeded"
    },
    {
      "code": 6005,
      "name": "signatureExpired",
      "msg": "Signature is expired"
    },
    {
      "code": 6006,
      "name": "roundNotStarted",
      "msg": "Round is not started"
    },
    {
      "code": 6007,
      "name": "roundFinished",
      "msg": "Round is finished"
    },
    {
      "code": 6008,
      "name": "unexpectedVestingPlan",
      "msg": "Unexpected vesting plan for bucket"
    },
    {
      "code": 6009,
      "name": "claimUnavailable",
      "msg": "Claim unavailable"
    },
    {
      "code": 6010,
      "name": "allocationOverflowed",
      "msg": "Allocation overflowed"
    },
    {
      "code": 6011,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6012,
      "name": "insufficientBucketSupply",
      "msg": "Insufficient bucket supply"
    }
  ],
  "types": [
    {
      "name": "bucketData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vestingType",
            "type": {
              "option": {
                "defined": {
                  "name": "bucketVestingType"
                }
              }
            }
          },
          {
            "name": "totalDeposit",
            "type": "u64"
          },
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
      "name": "bucketVestingType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "deterministic"
          },
          {
            "name": "priceless"
          }
        ]
      }
    },
    {
      "name": "claimEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "bucket",
            "type": "string"
          },
          {
            "name": "vestingPlan",
            "type": "string"
          },
          {
            "name": "claim",
            "type": "u64"
          },
          {
            "name": "burn",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "depositEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": {
              "defined": {
                "name": "round"
              }
            }
          },
          {
            "name": "quoteAmount",
            "type": "u64"
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
    },
    {
      "name": "vestingConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vestingPlan",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "vestingType",
            "type": {
              "option": {
                "defined": {
                  "name": "vestingType"
                }
              }
            }
          },
          {
            "name": "tokensClaimed",
            "type": "u64"
          },
          {
            "name": "tokensBurnt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vestingPeriod",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startTimestamp",
            "type": "u64"
          },
          {
            "name": "claimRatio",
            "type": "f64"
          },
          {
            "name": "burnRatio",
            "type": "f64"
          },
          {
            "name": "basePeriodIndex",
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    },
    {
      "name": "vestingPlan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "periods",
            "type": {
              "vec": {
                "defined": {
                  "name": "vestingPeriod"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "vestingType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "deterministic",
            "fields": [
              {
                "name": "allocation",
                "type": "u64"
              }
            ]
          },
          {
            "name": "priceless",
            "fields": [
              {
                "name": "deposit",
                "type": "u64"
              }
            ]
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "bucketPoolSeed",
      "type": "bytes",
      "value": "[66, 85, 67, 75, 69, 84, 95, 80, 79, 79, 76]"
    },
    {
      "name": "bucketSeed",
      "type": "bytes",
      "value": "[66, 85, 67, 75, 69, 84]"
    },
    {
      "name": "deployer",
      "type": "pubkey",
      "value": "BMBeWpWc16LQNtqw4JxjSWTf5E9mUBhhPzuTmaVFvxrf"
    },
    {
      "name": "saleBucketSeed",
      "type": "bytes",
      "value": "[83, 65, 76, 69]"
    },
    {
      "name": "seedRoot",
      "type": "bytes",
      "value": "[82, 79, 79, 84]"
    }
  ]
};
