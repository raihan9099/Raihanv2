 module.exports = {
  config:{
    name:'xl3',
    author:'Nyx',
    category:'GEN',
    version:'0.0.0.'
  },
  onStart: async function ({api,event,args}) {
    const query= args.join(" ");
    const axios = require("axios");
    try {
      if(!query){
      api.sendMessage("Prompt is required",event.threadID,event.messageID)
      }
      api.setMessageReaction("⌚", event.messageID, () => {}, true);
      const ok = await axios.get(`${global.GoatBot.config.nyx}api/xl3?prompt=`+query, { responseType: "stream" });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage({
        body:"Here is your Xl3 image",
        attachment: ok.data
      },
      event.threadID,event.messageID
      )
    } catch (e) {
      api.setMessageReaction("❎", event.messageID, () => {}, true);
      api.sendMessage("error: "+ "" + e.message,event.threadID,event.messageID)
    }
  }
}