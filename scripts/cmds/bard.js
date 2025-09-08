const axios = require('axios');

module.exports = {
  config: {
    name: 'bard',
    version: '1.0',
    author: 'OtinxSandip | ArYAN',
    role: 0,
    category: 'ai',
    longDescription: {
      en: '𝖡𝖺𝗋𝖽 is a large language model trained by 𝖦𝗈𝗈𝗀𝗅𝖾. It is designed to assist with a wide range of tasks.',
    },
    guide: {
      en: '{p}𝖻𝖺𝗋𝖽 <questions>\n\n🔎 𝗚𝘂𝗶𝗱𝗲\n{p}𝖻𝖺𝗋𝖽 who are you?',
    },
  },

  langs: {
    en: {
      final: "",
      loading: "wait for Årcano and Şad will answer you 🙂........"
    }
  },

  onStart: async function ({ api, event, args, getLang, message }) {
    try {
      const prompt = args.join(' ');
      if (!prompt) {
        return api.sendMessage("Please provide a question for 𝖡𝖺𝗋𝖽 AI.", event.threadID);
      }

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);

      const response = await axios.get(`https://itsaryan.onrender.com/api/bard?prompt=${encodeURIComponent(prompt)}`);

      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid or missing response from API');
      }

      const messageText = response.data; 

      const finalMsg = `${messageText}`;
      api.editMessage(finalMsg, loadingReply.messageID);

      console.log('Sent answer as a reply to user');
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(
        `${error.message}.`,
        event.threadID
      );
    }
  }
};
