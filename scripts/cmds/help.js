const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

// ------------------- Fonts -------------------
const categoryFont = {
  A:"𝗔",B:"𝗕",C:"𝗖",D:"𝗗",E:"𝗘",F:"𝗙",G:"𝗚",H:"𝗛",I:"𝗜",J:"𝗝",
  K:"𝗞",L:"𝗟",M:"𝗠",N:"𝗡",O:"𝗢",P:"𝗣",Q:"𝗤",R:"𝗥",S:"𝗦",T:"𝗧",
  U:"𝗨",V:"𝗩",W:"𝗪",X:"𝗫",Y:"𝗬",Z:"𝗭",
  a:"𝗮",b:"𝗯",c:"𝗰",d:"𝗱",e:"𝗲",f:"𝗳",g:"𝗴",h:"𝗵",i:"𝗶",j:"𝗷",
  k:"𝗸",l:"𝗹",m:"𝗺",n:"𝗻",o:"𝗼",p:"𝗽",q:"𝗾",r:"𝗿",s:"𝘀",t:"𝘁",
  u:"𝘂",v:"𝘃",w:"𝘄",x:"𝘅",y:"𝘆",z:"𝘇"
};

const commandFont = {
  A:"ᴀ",B:"ʙ",C:"ᴄ",D:"ᴅ",E:"ᴇ",F:"ғ",G:"ɢ",H:"ʜ",I:"ɪ",J:"ᴊ",
  K:"ᴋ",L:"ʟ",M:"ᴍ",N:"ɴ",O:"ᴏ",P:"ᴘ",Q:"ǫ",R:"ʀ",S:"s",T:"ᴛ",
  U:"ᴜ",V:"ᴠ",W:"ᴡ",X:"x",Y:"ʏ",Z:"ᴢ",
  a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ғ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",
  k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",
  u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"
};

// ------------------- Category emojis -------------------
const categoryEmojis = {
  "ADMIN":"🛡️ |","AI":"🤖 |","AI-IMAGE":"🖼️ |","ANIME":"😺 |",
  "AUTOMATION":"⚙️ |","BOX CHAT":"🗃️ |","CHAT":"💬 |","CONFIG":"⚙️ |",
  "CONVERT":"🔄 |","CUSTOM":"✨ |","ECONOMY":"💰 |",
  "FUN":"😜 |","GAME":"🎮 |","GENERATOR":"⚙️ |","GROUP CHAT":"👥 |","IMAGE":"🖼️ |",
  "IMAGE GENERATOR":"🎨 |","INFO":"ℹ️ |","INFORMATION":"📰 |",
  "ISLAMIC":"🕌 |","LOVE":"❤️ |","MEDIA":"🎞️ |","MUSIC":"🎵 |",
  "OWNER":"👑 |","RANK":"🏆 |","SONG LYRICS":"🎶 |","SYSTEM":"⚙️ |","TEXT":"✍️ |",
  "TOOLS":"🛠️ |","UTILITY":"🧰 |","ECONOMY (BANK)":"🏦 |"
};

module.exports = {
  config: {
    name: "help",
    version: "3.0",
    author: "Raihan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View command usage and list all commands directly" },
    longDescription: { en: "View command usage and list all commands directly" },
    category: "info",
    guide: { en: "{pn} [page] or {pn} [commandName]" },
    priority: 1,
  },

  onStart: async function({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const categories = {};
    const categoriesPerPage = 5;
    const applyFont = (text, map) => [...text].map(ch => map[ch] || ch).join("");

    // Collect commands into categories
    for (const [name, cmd] of commands) {
      if (!cmd?.config || typeof cmd.onStart !== "function") continue;

      // Skip 18+ content
      if (cmd.config.category && /(18\+|adult)/i.test(cmd.config.category)) continue;
      if ((cmd.config.shortDescription?.en && /18\+/i.test(cmd.config.shortDescription.en)) ||
          (cmd.config.longDescription?.en && /18\+/i.test(cmd.config.longDescription.en))) continue;

      if (cmd.config.role > 1 && role < cmd.config.role) continue;

      const catName = cmd.config.category?.toUpperCase() || "UNCATEGORIZED";
      if (!categories[catName]) categories[catName] = [];
      categories[catName].push(name);
    }

    // Sort categories (OWNER always first, then largest)
    const sortedCats = Object.keys(categories).sort((a, b) => {
      if (a === "OWNER") return -1;
      if (b === "OWNER") return 1;
      return categories[b].length - categories[a].length;
    });

    // Show paginated categories
    if (args.length === 0 || !isNaN(args[0])) {
      const page = args.length > 0 ? parseInt(args[0]) : 1;
      const totalPages = Math.ceil(sortedCats.length / categoriesPerPage);
      if (isNaN(page) || page < 1 || page > totalPages) {
        return message.reply(`❌ Invalid page number. There are only ${totalPages} pages.`);
      }

      let msg = "━━━━━━━━━━━━━━\n";
      msg += `${applyFont("Available Commands", categoryFont)} (Page ${page}/${totalPages}):\n\n`;

      const startIndex = (page - 1) * categoriesPerPage;
      const endIndex = Math.min(startIndex + categoriesPerPage, sortedCats.length);

      for (let i = startIndex; i < endIndex; i++) {
        const cat = sortedCats[i];
        const cmdList = categories[cat].sort((a, b) => a.localeCompare(b));
        const emoji = categoryEmojis[cat] || "";

        msg += `╭─╼ ${emoji}${applyFont(cat, categoryFont)} (${cmdList.length})\n`;
        for (const cmdName of cmdList) {
          msg += `│ ⤜ ${applyFont(cmdName, commandFont)}\n`;
        }
        msg += "╰─━━━━━━━━━╾─╯\n\n";
      }

      let totalCommands = Object.values(categories).reduce((a, b) => a + b.length, 0);
      msg += `• Use ${prefix}help <commandName> for details.\n`;
      msg += `• Use ${prefix}help <page> to navigate pages.\n`;
      msg += "━━━━━━━━━━━━━━\n";
      msg += `🔢 Total Categories: ${sortedCats.length}\n`;
      msg += `🔢 Total Commands: ${totalCommands}\n`;
      msg += `⚡️ Prefix: ${prefix}\n`;
      msg += `👑 Bot Author: ${applyFont("RaiHan", commandFont)}\n`;
      msg += "━━━━━━━━━━━━━━";

      return message.reply(msg);
    }

    // Command details
    const input = args[0].toLowerCase();
    const command = commands.get(input) || commands.get(aliases.get(input));
    if (!command || !command.config) {
      return message.reply(`❌ Command "${input}" not found.\nUse ${prefix}help to see the full list.`);
    }

    const config = command.config;
    const usage = (config.guide?.en || "No guide available.").replace(/{pn}/g, prefix + config.name);
    const roleText = config.role === 0 ? "All users" :
                     config.role === 1 ? "Group Admins" :
                     config.role === 2 ? "Bot Admins" : "Unknown";

    let info = "━━━━━━━━━━━━━━\n";
    info += applyFont("Command Info", categoryFont) + ":\n";
    info += "╭─╼━━━━━━━━╾─╮\n";
    info += `│ Name : ${applyFont(config.name, commandFont)}\n`;
    info += `│ Category : ${config.category || "Uncategorized"}\n`;
    info += `│ Version : ${config.version || "1.0"}\n`;
    info += `│ Author : ${applyFont("RaiHan", commandFont)}\n`;
    info += `│ Permission : ${config.role} (${roleText})\n`;
    info += `│ Cooldown : ${config.countDown || 5}s\n`;
    info += `│ Description: ${config.longDescription?.en || config.shortDescription?.en || "No description available."}\n`;
    info += `│ Usage : ${usage}\n`;
    info += "╰─━━━━━━━━━╾─╯\n";
    info += "━━━━━━━━━━━━━━";

    return message.reply(info);
  }
};
