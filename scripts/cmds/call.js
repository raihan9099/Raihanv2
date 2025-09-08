const axios = require("axios");

module.exports = {
  config: {
    name: "call",
    aliases: [],
    version: "1.0.0",
    author: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    role: 0,
    shortDescription: {
      en: "কল বোম্বার, শুধুমাত্র বাংলাদেশি নাম্বারের জন্য"
    },
    longDescription: {
      en: "কল বোম্বিং চালাও বাংলাদেশি নাম্বারে — শুধুমাত্র মজার জন্য"
    },
    category: "tool",
    guide: {
      en: "/call 01xxxxxxxxx"
    },
    cooldown: 15
  },

  onStart: async function ({ message, args }) {
    const number = args[0];

    if (!number || !/^01[0-9]{9}$/.test(number)) {
      return message.reply(
        "অনুগ্রহ করে সঠিক বাংলাদেশি নাম্বার দিন (উদাহরণ: /call 01xxxxxxxxx)\n\n⚠️ দয়া করে কেউ খারাপ কাজে ব্যবহার করবেন না,\nএই টুলটি শুধুমাত্র মজার জন্য তৈরি করা হয়েছে।"
      );
    }

    await message.reply(`কল বোম্বিং শুরু হয়েছে: ${number} নম্বরে...📞💣\n\n⚠️ কাউকে বিরক্ত করার জন্য এই টুল ব্যবহার সম্পূর্ণ নিষিদ্ধ এবং আইনত অপরাধ।`);

    try {
      await axios.get(`https://tbblab.shop/callbomber.php?mobile=${number}`);
      await new Promise(r => setTimeout(r, 90000)); // 90 seconds delay
      return message.reply(`✅ কল বোম্বিং সম্পন্ন হয়েছে ${number} নম্বরে।\n\n—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️`);
    } catch (error) {
      return message.reply(`❌ ত্রুটি: ${error.message}`);
    }
  }
};
