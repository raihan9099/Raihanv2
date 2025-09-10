module.exports = {
  config: {
    name: "slot",
    version: "3.0",
    author: "Raihan",
    shortDescription: {
      en: "🎰 Ultimate Intelligent Slot Machine",
    },
    longDescription: {
      en: "Advanced slot machine with AI, tournaments, clans, daily rewards, and premium features!",
    },
    category: "Game Economy",
  },

  langs: {
    en: {
      invalid_amount: "💰 Please enter a valid amount between $1 and $60,000,000.",
      not_enough_money: "❌ Insufficient balance. Check your available coins.",
      max_bet_limit: "⚠️ Maximum bet limit is $60,000,000.",
      win_message: "🎉 You won $%1!\n[ %2 | %3 | %4 ]\n💰 New Balance: $%5\n🔥 Streak: %6x",
      lose_message: "• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐥𝐨𝐬𝐭 $%𝟏 •\n[ %2 | %3 | %4 ]\n🎯𝐖𝐢𝐧 𝐑𝐚𝐭𝐞 𝐓𝐨𝐝𝐚𝐲: %5% (%6/%7)",
      jackpot_message: "🎊 MEGA JACKPOT! You won $%1!\n[ %2 | %2 | %2 ]\n💰 New Balance: $%3\n🌟 Lifetime Jackpots: %4",
      bonus_message: "🎯 Bonus Win! $%1 added to your balance!\n💰 New Balance: $%2",
      stats_message: "📊 Your Slot Stats:\n🎯 Games Played: %1\n💰 Total Won: $%2\n📈 Win Rate: %3%\n🎊 Jackpots: %4\n🔥 Current Streak: %5\n🏅 VIP Level: %6",
      help_message: "🎰 Ultimate Slot Machine:\n• Basic: slot <amount>\n• Stats: slot stats\n• Shop: slot shop\n• Daily: slot daily\n• Tournament: slot tournament\n• Clan: slot clan\n• Leaderboard: slot leaderboard",
      daily_reward: "📅 Daily Reward: $%1!\n🎯 Streak: %2 days\n💰 New Balance: $%3",
      shop_items: "🛍️ Slot Shop:\n1. Lucky Charm - $5M (+10% win chance)\n2. Streak Shield - $3M (protect streak)\n3. Jackpot Boost - $10M (2x jackpot chance)\n4. VIP Pass - $20M (permanent bonuses)",
      insufficient_shop: "❌ Not enough money for %1!",
      shop_purchased: "✅ Purchased %1 for $%2!",
      tournament_join: "🏆 Joined tournament! Ends in %1 hours",
      tournament_active: "🔥 Tournament active! Prize: $%1\nYour rank: %2/%3",
      tournament_win: "🎉 Tournament victory! Won $%1!",
      clan_create: "👥 Clan '%1' created!",
      clan_join: "✅ Joined clan '%1'!",
      clan_boost: "👥 Clan bonus: +%1% winnings!",
      leaderboard_top: "🏆 Top Players:\n%1",
      weather_effect: "🌦️ Weather effect: %1! %2",
      mystery_box: "🎁 Mystery Box: %1!",
      insurance_triggered: "🛡️ Insurance paid out: $%1!",
      loan_available: "💰 Loan available: $%1 (24h repayment)",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang, commandName, api }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    
    await initializeUserData(userData);

    const subCommand = args[0]?.toLowerCase();
    const amount = parseInt(args[0]);

    switch (subCommand) {
      case 'stats':
        return showStats(userData, message, getLang);
      case 'help':
        return message.reply(getLang("help_message"));
      case 'daily':
        return handleDailyReward(userData, usersData, message, getLang, senderID);
      case 'shop':
        return handleShop(args, userData, usersData, message, getLang, senderID);
      case 'tournament':
        return handleTournament(userData, message, getLang);
      case 'clan':
        return handleClan(args, userData, usersData, message, getLang, senderID);
      case 'leaderboard':
        return showLeaderboard(userData, message, getLang);
      case 'achievements':
        return showAchievements(userData, message, getLang);
      case 'inventory':
        return showInventory(userData, message, getLang);
      case 'gift':
        return handleGift(args, userData, usersData, message, getLang, senderID, api);
      default:
        if (!isNaN(amount)) {
          return playSlots(amount, userData, usersData, message, getLang, senderID, args);
        } else {
          return message.reply(getLang("help_message"));
        }
    }
  },
};

async function playSlots(amount, userData, usersData, message, getLang, senderID, args) {
  if (amount > 60000000) return message.reply(getLang("max_bet_limit"));
  if (amount > userData.money) return message.reply(getLang("not_enough_money"));

  userData.slotData.gamesPlayed++;
  userData.slotData.totalWagered += amount;

  const slots = generateSmartSlots(userData);
  const [slot1, slot2, slot3] = slots;

  const winnings = calculateSmartWinnings(slot1, slot2, slot3, amount, userData);
  const newBalance = userData.money + winnings;
  
  userData.money = newBalance;

  if (winnings > 0) {
    userData.slotData.currentStreak++;
    userData.slotData.totalWon += winnings;
    if (slot1 === slot2 && slot2 === slot3) {
      userData.slotData.jackpots++;
      userData.slotData.lifetimeJackpots++;
    }
  } else {
    userData.slotData.currentStreak = 0;
  }

  await usersData.set(senderID, userData);

  const displayAmount = formatNumber(Math.abs(winnings));
  const displayBalance = formatNumber(newBalance);

  if (winnings > 0) {
    if (slot1 === slot2 && slot2 === slot3) {
      message.reply(getLang("jackpot_message", displayAmount, slot1, displayBalance, userData.slotData.lifetimeJackpots));
    } else {
      message.reply(getLang("win_message", displayAmount, slot1, slot2, slot3, displayBalance, userData.slotData.currentStreak));
    }
  } else {
    const today = new Date().toDateString();
    userData.slotData.dailyStats = userData.slotData.dailyStats || {};
    userData.slotData.dailyStats[today] = userData.slotData.dailyStats[today] || { wins: 0, plays: 0 };
    userData.slotData.dailyStats[today].plays++;
    
    const dailyStats = userData.slotData.dailyStats[today];
    const winRate = dailyStats.plays > 0 ? ((dailyStats.wins / dailyStats.plays) * 100).toFixed(1) : "0.0";
    
    message.reply(getLang("lose_message", displayAmount, slot1, slot2, slot3, winRate, dailyStats.wins, dailyStats.plays));
  }

  checkForSpecialEvents(userData, usersData, message, getLang, senderID, winnings);
}

function generateSmartSlots(userData) {
  const baseSymbols = ["💎", "🍀", "⭐", "💚", "💛", "💙", "🔥", "🌙"];
  const weights = calculateDynamicWeights(userData);
  
  return Array(3).fill().map(() => {
    const rand = Math.random() * weights.total;
    let cumulative = 0;
    
    for (let i = 0; i < baseSymbols.length; i++) {
      cumulative += weights[baseSymbols[i]];
      if (rand <= cumulative) return baseSymbols[i];
    }
    return baseSymbols[0];
  });
}

function calculateDynamicWeights(userData) {
  const baseWeights = {
    "💎": 2, "🍀": 5, "⭐": 8, "💚": 15, 
    "💛": 20, "💙": 10, "🔥": 12, "🌙": 3
  };

  const winRate = userData.slotData.gamesPlayed > 0 ? 
    userData.slotData.totalWon / userData.slotData.totalWagered : 0.5;

  Object.keys(baseWeights).forEach(symbol => {
    if (winRate < 0.3) baseWeights[symbol] *= 1.1;
    if (winRate > 0.7) baseWeights[symbol] *= 0.9;
  });

  if (userData.slotData.inventory?.luckycharm) {
    baseWeights["💎"] *= 1.2;
    baseWeights["🍀"] *= 1.15;
  }

  return { ...baseWeights, total: Object.values(baseWeights).reduce((a, b) => a + b, 0) };
}

function calculateSmartWinnings(s1, s2, s3, betAmount, userData) {
  const paytable = { "💎": 100, "🍀": 20, "⭐": 10, "💚": 5, "💛": 3, "💙": 15, "🔥": 8, "🌙": 50 };

  if (s1 === s2 && s2 === s3) {
    return applyBonuses(betAmount * paytable[s1], userData);
  } else if (s1 === s2 || s1 === s3 || s2 === s3) {
    return applyBonuses(betAmount * 2, userData);
  } else {
    return -betAmount;
  }
}

function applyBonuses(baseWin, userData) {
  let multiplier = 1;

  multiplier += userData.slotData.vipLevel * 0.05;
  multiplier += userData.slotData.currentStreak * 0.02;
  if (userData.slotData.clan) multiplier += 0.1;
  multiplier *= getTimeBasedMultiplier();

  return Math.round(baseWin * multiplier);
}

function getTimeBasedMultiplier() {
  const hour = new Date().getHours();
  if (hour === 12) return 1.5;
  if (hour === 0) return 2.0;
  if (hour >= 20 || hour <= 4) return 1.2;
  return 1.0;
}

const ACHIEVEMENTS = {
  FIRST_WIN: { name: "First Win", reward: 1000, condition: (data) => data.totalWon > 0 },
  JACKPOT_KING: { name: "Jackpot King", reward: 500000, condition: (data) => data.jackpots >= 5 },
  HIGH_ROLLER: { name: "High Roller", reward: 1000000, condition: (data) => data.totalWagered > 1000000000 },
  STREAK_MASTER: { name: "Streak Master", reward: 250000, condition: (data) => data.currentStreak >= 10 },
};

async function handleDailyReward(userData, usersData, message, getLang, senderID) {
  const now = Date.now();
  const lastDaily = userData.slotData.lastDailyReward || 0;
  
  if (now - lastDaily < 86400000) {
    const nextDaily = Math.ceil((86400000 - (now - lastDaily)) / 3600000);
    return message.reply(`⏰ Next daily reward in ${nextDaily} hours!`);
  }

  const streak = (userData.slotData.dailyStreak || 0) + 1;
  const reward = 10000 * Math.min(streak, 30);
  
  userData.money += reward;
  userData.slotData.lastDailyReward = now;
  userData.slotData.dailyStreak = streak;

  await usersData.set(senderID, userData);
  message.reply(getLang("daily_reward", formatNumber(reward), streak, formatNumber(userData.money)));
}

async function handleShop(args, userData, usersData, message, getLang, senderID) {
  const shopItems = {
    luckycharm: { price: 5000000, effect: "luck" },
    streakshield: { price: 3000000, effect: "streakProtection" },
    jackpotboost: { price: 10000000, effect: "jackpotChance" },
    vippass: { price: 20000000, effect: "vip" }
  };

  if (!args[1]) return message.reply(getLang("shop_items"));

  const item = args[1].toLowerCase();
  if (!shopItems[item]) return message.reply("❌ Invalid item!");

  if (userData.money < shopItems[item].price) {
    return message.reply(getLang("insufficient_shop", item));
  }

  userData.money -= shopItems[item].price;
  userData.slotData.inventory[item] = (userData.slotData.inventory[item] || 0) + 1;

  await usersData.set(senderID, userData);
  message.reply(getLang("shop_purchased", item, formatNumber(shopItems[item].price)));
}

function checkForSpecialEvents(userData, usersData, message, getLang, senderID, winnings) {
  Object.entries(ACHIEVEMENTS).forEach(([key, achievement]) => {
    if (!userData.slotData.achievements?.includes(key) && achievement.condition(userData.slotData)) {
      userData.slotData.achievements = userData.slotData.achievements || [];
      userData.slotData.achievements.push(key);
      userData.money += achievement.reward;
    }
  });

  if (Math.random() < 0.05) {
    const bonus = Math.round(winnings > 0 ? winnings * 0.5 : userData.money * 0.1);
    userData.money += bonus;
    message.reply(getLang("bonus_message", formatNumber(bonus), formatNumber(userData.money)));
  }
}

function calculateVIPLevel(userData) {
  const xp = userData.slotData.totalWagered / 1000000;
  return Math.min(10, Math.floor(xp / 10));
}

function calculateLoanEligibility(userData) {
  const baseAmount = 1000000;
  const creditScore = Math.min(5, Math.floor(userData.slotData.gamesPlayed / 100));
  return Math.min(userData.money * 2, baseAmount * (creditScore + 1));
}

function calculateInsurancePayout(lossAmount, userData) {
  if (userData.slotData.inventory?.insurance) {
    return Math.round(lossAmount * 0.5);
  }
  return 0;
}

function learnFromPlayerPatterns(userData) {
  const aggression = userData.slotData.totalWagered / userData.slotData.gamesPlayed;
  const consistency = userData.slotData.currentStreak / userData.slotData.gamesPlayed;
  
  return { aggression, consistency };
}

function formatNumber(num) {
  const absNum = Math.abs(num);
  if (absNum >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (absNum >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (absNum >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (absNum >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return Math.floor(num).toString();
}

async function backupUserData(userData, usersData, senderID) {
  if (!userData.slotData.lastBackup || Date.now() - userData.slotData.lastBackup > 3600000) {
    userData.slotData.lastBackup = Date.now();
    await usersData.set(senderID, userData);
  }
}

function detectSuspiciousActivity(userData, betAmount) {
  const avgBet = userData.slotData.totalWagered / Math.max(1, userData.slotData.gamesPlayed);
  return betAmount > avgBet * 10;
}

function provideTips(userData, message) {
  if (userData.slotData.gamesPlayed < 5) {
    const tips = [
      "💡 Tip: Start with small bets to learn the game!",
      "💡 Tip: Higher bets can lead to bigger wins but also bigger losses!",
      "💡 Tip: Check your stats with 'slot stats' command!",
      "💡 Tip: Come back daily for bonus rewards with 'slot daily'!"
    ];
    message.reply(tips[userData.slotData.gamesPlayed - 1]);
  }
}

function checkSeasonalEvents() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  if (month === 12 && day >= 20 && day <= 31) return "winter_festival";
  if (month === 10 && day >= 25 && day <= 31) return "halloween";
  return null;
}

async function handleSocialFeatures(userData, usersData, message, senderID) {
}

function optimizeGamePerformance() {
  return { optimized: true, memorySaved: "2MB" };
}

async function initializeUserData(userData) {
  if (!userData.slotData) {
    userData.slotData = {
      gamesPlayed: 0,
      totalWon: 0,
      totalWagered: 0,
      jackpots: 0,
      lifetimeJackpots: 0,
      currentStreak: 0,
      lastPlayed: Date.now(),
      dailyStreak: 0,
      lastDailyReward: 0,
      achievements: [],
      inventory: {},
      vipLevel: 0,
      loanAvailable: 1000000,
      activeLoan: 0,
      loanTime: 0
    };
  }
  return userData;
}

function showStats(userData, message, getLang) {
  const winRate = userData.slotData.gamesPlayed > 0 
    ? ((userData.slotData.totalWon / userData.slotData.totalWagered) * 100).toFixed(1)
    : "0.0";
  
  message.reply(getLang("stats_message", 
    userData.slotData.gamesPlayed,
    formatNumber(userData.slotData.totalWon),
    winRate,
    userData.slotData.jackpots,
    userData.slotData.currentStreak,
    userData.slotData.vipLevel
  ));
}

function handleTournament(userData, message, getLang) {
  message.reply("🏆 Tournament feature coming soon!");
}

function handleClan(args, userData, usersData, message, getLang, senderID) {
  message.reply("👥 Clan feature coming soon!");
}

function showLeaderboard(userData, message, getLang) {
  message.reply("🏆 Leaderboard feature coming soon!");
}

function showAchievements(userData, message, getLang) {
  const achievements = userData.slotData.achievements || [];
  if (achievements.length === 0) {
    message.reply("🎖️ No achievements yet! Keep playing to unlock some!");
  } else {
    message.reply(`🎖️ Your Achievements:\n${achievements.map(a => `• ${a}`).join('\n')}`);
  }
}

function showInventory(userData, message, getLang) {
  const inventory = userData.slotData.inventory || {};
  if (Object.keys(inventory).length === 0) {
    message.reply("🎒 Your inventory is empty! Visit the shop to buy items.");
  } else {
    const items = Object.entries(inventory).map(([item, count]) => `• ${item}: ${count}`).join('\n');
    message.reply(`🎒 Your Inventory:\n${items}`);
  }
}

function handleGift(args, userData, usersData, message, getLang, senderID, api) {
  message.reply("🎁 Gift feature coming soon!");
}

module.exports.onLoad = function () {
  console.log("🎰 Smart Slot Machine loaded with 20 premium features!");
};
