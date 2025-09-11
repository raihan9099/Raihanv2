/**
 * flux11pro.js
 * Goat Bot V2 command module
 *
 * Usage: .flux11pro <prompt>
 *
 * This command calls: https://api.oculux.xyz/api/flux-1.1-pro?prompt=<encoded prompt>
 * It attempts to handle common response formats:
 *  - raw image bytes (image/jpeg, image/png)
 *  - JSON with { url: 'https://...', image: '<base64...>' }
 *
 * Dependencies: axios, fs, path
 * Install: npm install axios fs-extra
 *
 * Note: adapt api.sendMessage call to match your Goat Bot V2 API if needed.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'flux11pro',
    aliases: [''],
    version: '1.0',
    author: 'Fahad Islam',
    countDown: 5,
    role: 0,
    shortDescription: 'Generate image with Flux 1.1 Pro',
    longDescription: 'Calls oculux flux-1.1-pro endpoint and returns the generated image.',
    category: 'image',
    guide: '{pn} <prompt>'
  },

  onStart: async function ({ event, api, args, Reply, message, getLang }) {
    try {
      const threadID = event.threadID || (event.message && event.message.threadID) || event.senderID;
      const messageID = event.messageID || (event.message && event.message.messageID) || event.messageID;

      const prompt = args && args.length ? args.join(' ') : null;
      if (!prompt) return api.sendMessage('Usage: .flux11pro <prompt>', threadID, messageID);

      const baseUrl = 'https://api.oculux.xyz/api/flux-1.1-pro?prompt=';
      const url = baseUrl + encodeURIComponent(prompt);

      // Notify (simple typing-like message) — remove or adapt if your bot framework has a different method
      try { api.sendMessage('Generating image... (flux-1.1-pro)', threadID, messageID); } catch (e) { /* ignore */ }

      // Try fetching as binary (many image endpoints return an image stream)
      const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
      const contentType = resp.headers['content-type'] || '';

      const tmpDir = path.join(__dirname, 'tmp_images');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      // Helper to write buffer to file and send
      const writeAndSend = (buffer, ext = 'jpg') => {
        const filename = `flux11pro_${Date.now()}.${ext}`;
        const filepath = path.join(tmpDir, filename);
        fs.writeFileSync(filepath, buffer);

        // send as attachment — adapt api.sendMessage signature if needed by your bot
        try {
          api.sendMessage({ body: 'Here is your image (flux-1.1-pro)', attachment: fs.createReadStream(filepath) }, threadID, messageID);
        } catch (err) {
          // fallback older signature: (message, threadID)
          try { api.sendMessage({ body: 'Here is your image (flux-1.1-pro)', attachment: fs.createReadStream(filepath) }, threadID); } catch (err2) {
            console.error('Failed to send message with attachment:', err, err2);
            api.sendMessage('Image generated but failed to send. Check bot logs for details.', threadID, messageID);
          }
        }
      };

      // Case 1: Response is an image (content-type like image/jpeg/png)
      if (contentType.startsWith('image/') || contentType.includes('jpeg') || contentType.includes('png')) {
        return writeAndSend(Buffer.from(resp.data), contentType.includes('png') ? 'png' : 'jpg');
      }

      // Case 2: Response might be JSON (some APIs return JSON with a URL or base64)
      let textBody = resp.data.toString('utf8');
      let parsed;
      try { parsed = JSON.parse(textBody); } catch (e) { parsed = null; }

      if (parsed) {
        // If API returned a direct url to image
        if (parsed.url && typeof parsed.url === 'string') {
          const imageResp = await axios.get(parsed.url, { responseType: 'arraybuffer', timeout: 120000 });
          const ct = imageResp.headers['content-type'] || '';
          return writeAndSend(Buffer.from(imageResp.data), ct.includes('png') ? 'png' : 'jpg');
        }

        // If API returned base64 image
        if (parsed.image && typeof parsed.image === 'string') {
          // remove data:<type>;base64, prefix if present
          const base64 = parsed.image.replace(/^data:\w+\/\w+;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          return writeAndSend(buffer, 'jpg');
        }

        // Generic fallback: stringify JSON and return as message
        return api.sendMessage('Received JSON response from API. Check logs or adapt parsing in the command.', threadID, messageID);
      }

      // If we reach here, we couldn't identify the response
      return api.sendMessage('Unexpected response format from flux-1.1-pro API. Check logs for details.', threadID, messageID);

    } catch (error) {
      console.error('flux11pro error:', error);
      try { api.sendMessage('Error while generating image: ' + (error.message || String(error)), event.threadID, event.messageID); } catch (e) { /* ignore */ }
    }
  }
}
