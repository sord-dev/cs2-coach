/**
 * Embedded CS2 rank distribution data for edge deployment compatibility
 * Replaces filesystem-dependent cs2-rank-distribution.json loading
 */

export const RANK_DISTRIBUTION = {
  "premier_distribution": [
    {
      "rating": "1k",
      "percentage": 1.0,
      "player_count": 22160
    },
    {
      "rating": "2k",
      "percentage": 2.8,
      "player_count": 60623
    },
    {
      "rating": "3k",
      "percentage": 5.8,
      "player_count": 126761
    },
    {
      "rating": "4k",
      "percentage": 8.0,
      "player_count": 176543
    },
    {
      "rating": "5k",
      "percentage": 6.8,
      "player_count": 149482
    },
    {
      "rating": "6k",
      "percentage": 6.5,
      "player_count": 143313
    },
    {
      "rating": "7k",
      "percentage": 7.2,
      "player_count": 157114
    },
    {
      "rating": "8k",
      "percentage": 7.5,
      "player_count": 164882
    },
    {
      "rating": "9k",
      "percentage": 8.8,
      "player_count": 192864
    },
    {
      "rating": "10k",
      "percentage": 7.4,
      "player_count": 161718
    },
    {
      "rating": "11k",
      "percentage": 6.9,
      "player_count": 152249
    },
    {
      "rating": "12k",
      "percentage": 6.5,
      "player_count": 142923
    },
    {
      "rating": "13k",
      "percentage": 5.8,
      "player_count": 127587
    },
    {
      "rating": "14k",
      "percentage": 5.6,
      "player_count": 122742
    },
    {
      "rating": "15k",
      "percentage": 3.9,
      "player_count": 84836
    },
    {
      "rating": "16k",
      "percentage": 3.0,
      "player_count": 66033
    },
    {
      "rating": "17k",
      "percentage": 2.3,
      "player_count": 50213
    },
    {
      "rating": "18k",
      "percentage": 1.6,
      "player_count": 35679
    },
    {
      "rating": "19k",
      "percentage": 1.2,
      "player_count": 26259
    },
    {
      "rating": "20k",
      "percentage": 0.6,
      "player_count": 13634
    },
    {
      "rating": "21k",
      "percentage": 0.4,
      "player_count": 8239
    },
    {
      "rating": "22k",
      "percentage": 0.2,
      "player_count": 4739
    },
    {
      "rating": "23k+",
      "percentage": 0.2,
      "player_count": 4555
    }
  ],
  "rank_equivalencies": [
    {
      "csgo_rank": "S1 - SEM",
      "cs2_premier_rating": "1,000 - 6,768",
      "percentage": 29.0
    },
    {
      "csgo_rank": "GN1 - GNM",
      "cs2_premier_rating": "7,502 - 11,178",
      "percentage": 33.6
    },
    {
      "csgo_rank": "MG1 - MGE",
      "cs2_premier_rating": "11,179 - 14,588",
      "percentage": 21.2
    },
    {
      "csgo_rank": "DMG - LEM",
      "cs2_premier_rating": "14,589 - 18,156",
      "percentage": 12.4
    },
    {
      "csgo_rank": "SMFC",
      "cs2_premier_rating": "18,157 - 20,000",
      "percentage": 2.6
    },
    {
      "csgo_rank": "GE",
      "cs2_premier_rating": "20,001+",
      "percentage": 1.2
    }
  ],
  "faceit_distribution": [
    {
      "faceit_level": "Level 1",
      "percentage": 2.3
    },
    {
      "faceit_level": "Level 2",
      "percentage": 7.1
    },
    {
      "faceit_level": "Level 3",
      "percentage": 11.7
    },
    {
      "faceit_level": "Level 4",
      "percentage": 21.8
    },
    {
      "faceit_level": "Level 5",
      "percentage": 14.1
    },
    {
      "faceit_level": "Level 6",
      "percentage": 9.8
    },
    {
      "faceit_level": "Level 7",
      "percentage": 8.6
    },
    {
      "faceit_level": "Level 8",
      "percentage": 7.6
    },
    {
      "faceit_level": "Level 9",
      "percentage": 6.4
    },
    {
      "faceit_level": "Level 10",
      "percentage": 10.5
    }
  ],
  "performance_benchmarks": {
    "0-4999": {
      "tier": "gray",
      "rating": {
        "solid": 0.7,
        "strong": 0.8,
        "excellent": 0.9
      },
      "kd": {
        "average": 0.6,
        "good": 0.8,
        "exceptional": 1.0
      },
      "adr": {
        "solid": 45,
        "strong": 55,
        "excellent": 65
      },
      "kast": {
        "good": 55,
        "strong": 60,
        "excellent": 65
      },
      "hs_percentage": {
        "average": 20,
        "good": 25,
        "exceptional": 30
      }
    },
    "5000-9999": {
      "tier": "light_blue",
      "rating": {
        "solid": 0.8,
        "strong": 0.9,
        "excellent": 1.0
      },
      "kd": {
        "average": 0.7,
        "good": 0.9,
        "exceptional": 1.1
      },
      "adr": {
        "solid": 55,
        "strong": 65,
        "excellent": 75
      },
      "kast": {
        "good": 60,
        "strong": 65,
        "excellent": 70
      },
      "hs_percentage": {
        "average": 25,
        "good": 30,
        "exceptional": 35
      }
    },
    "10000-14999": {
      "tier": "blue",
      "rating": {
        "solid": 0.9,
        "strong": 1.0,
        "excellent": 1.1
      },
      "kd": {
        "average": 0.8,
        "good": 1.0,
        "exceptional": 1.2
      },
      "adr": {
        "solid": 65,
        "strong": 75,
        "excellent": 85
      },
      "kast": {
        "good": 65,
        "strong": 70,
        "excellent": 75
      },
      "hs_percentage": {
        "average": 30,
        "good": 35,
        "exceptional": 40
      }
    },
    "15000-19999": {
      "tier": "purple",
      "rating": {
        "solid": 1.0,
        "strong": 1.1,
        "excellent": 1.2
      },
      "kd": {
        "average": 0.9,
        "good": 1.1,
        "exceptional": 1.3
      },
      "adr": {
        "solid": 75,
        "strong": 85,
        "excellent": 95
      },
      "kast": {
        "good": 70,
        "strong": 75,
        "excellent": 80
      },
      "hs_percentage": {
        "average": 35,
        "good": 40,
        "exceptional": 45
      }
    },
    "20000-24999": {
      "tier": "pink",
      "rating": {
        "solid": 1.1,
        "strong": 1.2,
        "excellent": 1.3
      },
      "kd": {
        "average": 1.0,
        "good": 1.2,
        "exceptional": 1.4
      },
      "adr": {
        "solid": 85,
        "strong": 95,
        "excellent": 105
      },
      "kast": {
        "good": 75,
        "strong": 80,
        "excellent": 85
      },
      "hs_percentage": {
        "average": 40,
        "good": 45,
        "exceptional": 50
      }
    },
    "25000-29999": {
      "tier": "red",
      "rating": {
        "solid": 1.2,
        "strong": 1.3,
        "excellent": 1.4
      },
      "kd": {
        "average": 1.1,
        "good": 1.3,
        "exceptional": 1.5
      },
      "adr": {
        "solid": 95,
        "strong": 105,
        "excellent": 115
      },
      "kast": {
        "good": 80,
        "strong": 85,
        "excellent": 90
      },
      "hs_percentage": {
        "average": 45,
        "good": 50,
        "exceptional": 55
      }
    },
    "30000-99999": {
      "tier": "gold",
      "rating": {
        "solid": 1.3,
        "strong": 1.4,
        "excellent": 1.5
      },
      "kd": {
        "average": 1.2,
        "good": 1.4,
        "exceptional": 1.6
      },
      "adr": {
        "solid": 105,
        "strong": 115,
        "excellent": 125
      },
      "kast": {
        "good": 85,
        "strong": 90,
        "excellent": 95
      },
      "hs_percentage": {
        "average": 50,
        "good": 55,
        "exceptional": 60
      }
    }
  }
} as const;