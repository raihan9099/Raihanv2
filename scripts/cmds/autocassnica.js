const axios = require("axios");
let status = true;

const style = {
  titleStyle: {
    text_font: "typewriter",
    line_bottom: "none",
    line_bottom_akhiro: "13chars",
  },
  contentStyle: {
    text_font: "none",
    line_bottom: "none",
    line_bottom_inside_x: "none",
  },
};

const defStyle = {
  title: "Cassidy Bot",
};

const mappings = new Map();

module.exports = {
  config: {
    name: "autocassnica",
    version: "1.0",
    author: "LiANE @nealianacagara",
    role: 0,
    category: "Ai-Chat",
    shortDescription: {
      en: ``,
    },
    longDescription: {
      en: ``,
    },
    guide: {
      en: "{pn} [query]",
    },
  },
  onStart({ message, event, api, args }) {
    let choice =
      args[0] === "on"
        ? true
        : args[0] === "off"
        ? false
        : mappings.get(event.threadID)
        ? !mappings.get(event.threadID)
        : true;
    mappings.set(event.threadID, choice);

    return message.reply(`✅ ${choice ? "Enabled" : "Disabled"} successfully!`);
  },
  async onChat({ message, event, api }) {
    const state = mappings.get(event.threadID) ?? false;
    if (!state) {
      return;
    }
    if (!event.body?.toLowerCase().startsWith("!")) {
      return;
    }
    const timeA = Date.now();
    if (!status) return;
    try {
      event.prefixes = ["!"];

      if (
        event.type === "message_reply" &&
        api.getCurrentUserID() === event.messageReply.senderID
      ) {
        return;
      }
      const response = await axios.get(
        "https://cassidynica.onrender.com/postWReply",
        { params: event }
      );
      const {
        result: { body, messageID },
        status: estatus,
        result,
      } = response.data;
      if (estatus === "fail") {
        return;
      }
      const timeB = Date.now();
      message.reply(`${body}`, (_, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "autocassnica",
          author: event.senderID,
          result,
        });
      });
    } catch (error) {}
  },
  async onReply({ Reply, message, event }) {
    const timeA = Date.now();
    const { author, result: messageReply } = Reply;

    messageReply.body = "";

    event.prefixes = ["!"];
    event.strictPrefix = true;
    const response = await axios.get(
      "https://cassidynica.onrender.com/postWReply",
      { params: { ...event, messageReply } }
    );
    const {
      result: { body, messageID },
      status: estatus,
      result,
    } = response.data;
    if (estatus === "fail") {
      return;
    }
    const timeB = Date.now();
    message.reply(`${body}`, (_, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "autocassnica",
        author: event.senderID,
        result,
      });
    });
  },
};
