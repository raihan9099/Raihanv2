const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TASK_JSON = path.join(__dirname, "midj_tasks.json");
if (!fs.existsSync(TASK_JSON)) fs.writeFileSync(TASK_JSON, "{}");

module.exports = {
  config: {
    name: "midjourney",
    aliases: ["midj", "mj"],
    author: "Mahi--",
    version: "1.0",
    role: 1,
    shortDescription: "AI image gen with MJ + U/V variation",
    longDescription: "Generate images with upscale/variation options",
    category: "image",
    guide: "{pn} <prompt> [--cref <image_url>] [--sref <image_url>] [--ar <ratio>]"
  },

  onStart: async function ({ args, message, event }) {
    try {
      // Parse arguments
      let prompt = "";
      let cref = "";
      let sref = "";
      let ratio = "1:1"; // Default ratio set to 1:1
      
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "--cref" && i + 1 < args.length) {
          cref = args[i + 1];
          i++;
        } else if (args[i] === "--sref" && i + 1 < args.length) {
          sref = args[i + 1];
          i++;
        } else if (args[i] === "--ar" && i + 1 < args.length) {
          ratio = args[i + 1];
          i++;
        } else {
          prompt += args[i] + " ";
        }
      }

      prompt = prompt.trim();
      
      // Handle image reply for cref (enhanced to handle multiple attachments)
      if (event.type === "message_reply" && 
          event.messageReply.attachments?.length > 0) {
        // Get first image attachment
        const imageAttachment = event.messageReply.attachments.find(
          att => ["photo", "image"].includes(att?.type)
        );
        if (imageAttachment) {
          cref = imageAttachment.url;
        }
      }

      if (!prompt) return message.reply("⚠ Please provide a prompt.");

      // Build API URL
      let apiUrl = `https://egret-driving-cattle.ngrok-free.app/api/midjourney?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;
      if (cref) apiUrl += `&cref=${encodeURIComponent(cref)}`;
      if (sref) apiUrl += `&sref=${encodeURIComponent(sref)}`;

      const processingMsg = await message.reply("🔄 Generating your image...");

      // Submit generation request
      const genRes = await axios.get(apiUrl);
      if (genRes.data?.status !== "success") {
        await message.unsend(processingMsg.messageID);
        return message.reply("❌ Failed to start generation. Please try again.");
      }

      const taskId = genRes.data.taskId;
      
      // Store task ID
      const tasks = JSON.parse(fs.readFileSync(TASK_JSON, "utf8"));
      tasks[event.threadID] = taskId;
      fs.writeFileSync(TASK_JSON, JSON.stringify(tasks, null, 2));

      // Check image status
      const imageUrl = await this.checkImageStatus(taskId, message, processingMsg);
      if (!imageUrl) return;

      // Send result
      await message.unsend(processingMsg.messageID);
      const stream = await global.utils.getStreamFromURL(imageUrl);
      
      let resultMessage = `🖼 Generated Image (Ratio: ${ratio})`;
      if (cref) resultMessage += "\n🔗 Using reference image from your reply";
      resultMessage += "\n💬 Reply with:\nU1-U4 for Upscale\nV1-V4 for Variations";
      
      const sentMsg = await message.reply({
        body: resultMessage,
        attachment: stream
      });

      // Set reply handler
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        taskId: taskId,
        threadID: event.threadID,
        messageID: sentMsg.messageID,
        cref: cref // Store the cref for future variations
      });

    } catch (err) {
      console.error("Generation error:", err);
      return message.reply("❌ Failed to generate image. Please try again.");
    }
  },

  onReply: async function ({ event, Reply, message }) {
    try {
      const action = event.body.toLowerCase();
      if (!["u1","u2","u3","u4","v1","v2","v3","v4"].includes(action)) return;

      const actionMsg = await message.reply(`🔄 Processing ${action.toUpperCase()}...`);
      
      // Include original cref if available
      const crefParam = Reply.cref ? `&cref=${encodeURIComponent(Reply.cref)}` : '';
      
      // Submit action request
      const actionRes = await axios.get(
        `https://egret-driving-cattle.ngrok-free.app/api/action?taskid=${Reply.taskId}&action=${action}${crefParam}`
      );
      
      if (actionRes.data?.status !== "success") {
        await message.unsend(actionMsg.messageID);
        return message.reply("❌ Failed to process action. Please try again.");
      }

      const newTaskId = actionRes.data.taskId;
      
      // Update stored task ID
      const tasks = JSON.parse(fs.readFileSync(TASK_JSON, "utf8"));
      tasks[event.threadID] = newTaskId;
      fs.writeFileSync(TASK_JSON, JSON.stringify(tasks, null, 2));

      // Check new image status
      const imageUrl = await this.checkImageStatus(newTaskId, message, actionMsg);
      if (!imageUrl) return;

      // Send result
      await message.unsend(actionMsg.messageID);
      const stream = await global.utils.getStreamFromURL(imageUrl);
      
      let resultMessage = `🎯 ${action.toUpperCase()} Result`;
      if (Reply.cref) resultMessage += "\n🔗 Using original reference image";
      resultMessage += "\n💬 Reply with U1-U4 or V1-V4 to modify again";
      
      const sentMsg = await message.reply({
        body: resultMessage,
        attachment: stream
      });

      // Update reply handler
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        taskId: newTaskId,
        threadID: event.threadID,
        messageID: sentMsg.messageID,
        cref: Reply.cref // Preserve the original cref
      });

    } catch (err) {
      console.error("Action error:", err);
      return message.reply("❌ Failed to process action. Please try again.");
    }
  },

  checkImageStatus: async function(taskId, message, statusMsg) {
    try {
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts (2.5 minutes max)
      
      while (attempts < maxAttempts) {
        attempts++;
        
        const statusRes = await axios.get(
          `https://egret-driving-cattle.ngrok-free.app/api/mj-task?taskid=${taskId}`
        );
        
        if (statusRes.data?.task?.outputFileUrl) {
          return statusRes.data.task.outputFileUrl;
        }
        
        // Update status message every 5 attempts
        if (attempts % 5 === 0 && statusMsg) {
          await message.unsend(statusMsg.messageID);
          statusMsg = await message.reply(`🔄 Still processing (attempt ${attempts}/${maxAttempts})...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      if (statusMsg) await message.unsend(statusMsg.messageID);
      message.reply("⏳ Image is taking longer than expected. Please try again later.");
      return null;
      
    } catch (err) {
      console.error("Status check error:", err);
      if (statusMsg) await message.unsend(statusMsg.messageID);
      message.reply("❌ Error checking image status. Please try again.");
      return null;
    }
  }
};