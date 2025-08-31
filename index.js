require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const { Client, GatewayIntentBits, Events, PermissionsBitField } = require("discord.js");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

// -------------------
// Express server
// -------------------
const app = express();
app.use("/generated", express.static(path.join(__dirname, "generated")));
app.listen(process.env.PORT || 3000, () => console.log("Express running"));

// -------------------
// Bot setup
// -------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const GUILD_ID = process.env.GUILD_ID;

const LOG_CHANNEL_ID = "1411696190130753579"; // Replace
const ROLE_DOCUMENT_MANAGER = "1411736453389619240"; // Replace
const ROLE_ANNOUNCEMENT = "ROLE_ANNOUNCEMENT_ID"; // Replace
const ROLE_DM_PERMISSIONS = "1411736453389619240"; // Replace
const MODMAIL_CATEGORY_ID = "1411736315963113482"; // Replace
const SENIOR_LEADERSHIP_ROLE = "1411736453389619240"; // Replace

client.once(Events.ClientReady, () => console.log(`Logged in as ${client.user.tag}`));

// -------------------
// Helpers
// -------------------
function hasRole(member, roleId) {
  return member.roles.cache.has(roleId) || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

async function logAction(message) {
  const ch = await client.channels.fetch(LOG_CHANNEL_ID);
  if (ch) ch.send(message);
}

function loadJSON(file) { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {}; }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// -------------------
// DOCX templates
// -------------------
const TEMPLATES_FILE = "templates.json";
if (!fs.existsSync(TEMPLATES_FILE)) saveJSON(TEMPLATES_FILE, {});

// -------------------
// Modmail storage
// -------------------
const MODMAIL_FILE = "modmail.json";
if (!fs.existsSync(MODMAIL_FILE)) saveJSON(MODMAIL_FILE, {});

// -------------------
// Bot events
// -------------------
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const guild = client.guilds.cache.get(GUILD_ID);

  // ------------------- MODMAIL -------------------
  if (message.channel.type === 1) { // DM channel
    let tickets = loadJSON(MODMAIL_FILE);
    let channel;

    if (!tickets[message.author.id]) {
      // Create ticket channel
      const category = guild.channels.cache.get(MODMAIL_CATEGORY_ID);
      const overwrites = {
        [guild.id]: { ViewChannel: false },
        [SENIOR_LEADERSHIP_ROLE]: { ViewChannel: true, SendMessages: true },
        [client.user.id]: { ViewChannel: true, SendMessages: true }
      };

      channel = await guild.channels.create({
        name: `ticket-${message.author.username}`,
        type: 0, // text channel
        parent: category,
        permissionOverwrites: overwrites
      });

      tickets[message.author.id] = channel.id;
      saveJSON(MODMAIL_FILE, tickets);
    } else {
      channel = guild.channels.cache.get(tickets[message.author.id]);
    }

    const payload = {
      flags: 32768,
      components: [
        { type: 17, components: [{ type: 10, content: `📩 Message from ${message.author.tag}: ${message.content}` }] }
      ]
    };

    await channel.send({ content: "New message:", components: payload.components });

    for (const attach of message.attachments.values()) {
      await channel.send({ content: `📎 Attachment:`, files: [attach.url] });
    }
  }

  // ------------------- !startsession -------------------
  if (message.content.toLowerCase() === "!startsession") {
    const payload = {
      flags: 32768,
      components: [
        {
          type: 17,
          components: [
            { type: 12, items: [{ media: { url: "https://media.discordapp.net/attachments/1411696190130753579/1411704677057433706/Banners_11.png" } }] },
            { type: 9, components: [{ type: 10, content: "# The gates are open! Please line up..." }], accessory: { type: 2, style: 5, url: "https://www.roblox.com/games/83329354034194/Thornvale", label: "Join" } }
          ]
        }
      ]
    };
    await message.channel.send({ content: "Session starting:", components: payload.components });
  }
});

// -------------------
// Slash commands (simplified for brevity) -------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const templates = loadJSON(TEMPLATES_FILE);

  // ------------------- Generate document -------------------
  if (interaction.commandName === "generate_document") {
    if (!hasRole(interaction.member, ROLE_DOCUMENT_MANAGER)) return interaction.reply({ content: "❌ No permission.", ephemeral: true });

    const templateName = interaction.options.getString("template_name");
    if (!templates[templateName]) return interaction.reply({ content: "Template not found", ephemeral: true });

    const fields = templates[templateName].fields;

    // Dummy responses (replace with forms later)
    const responses = {};
    fields.forEach(f => responses[f] = `Test ${f}`);

    const content = fs.readFileSync(templates[templateName].file_path, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(responses);
    const buf = doc.getZip().generate({ type: "nodebuffer" });

    const outPath = path.join("generated", `${interaction.user.id}_${templateName}.docx`);
    fs.writeFileSync(outPath, buf);

    const viewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${BASE_URL}/generated/${path.basename(outPath)}`;
    interaction.reply({ content: `✅ Document ready! [View in browser](${viewUrl})`, ephemeral: true });
    logAction(`${interaction.user.tag} generated document from '${templateName}'`);
  }

  // ------------------- Session info -------------------
  if (interaction.commandName === "sessioninfo") {
    const payload = {
      flags: 32768,
      components: [
        {
          type: 17,
          components: [
            { type: 12, items: [{ media: { url: "https://media.discordapp.net/attachments/1411696190130753579/1411704677057433706/Banners_11.png" } }] },
            { type: 9, components: [{ type: 10, content: "# Session Notice\nSessions daily at 8PM UK..." }], accessory: { type: 2, style: 5, url: "https://www.roblox.com/communities/36087451/Thornvale-Academy#!/about", label: "Join the group" } }
          ]
        }
      ]
    };
    await interaction.reply({ content: "Session info:", components: payload.components });
  }

  // Add kick/ban/warn/timeout/announcement/modmail-close here as needed in same container format
});

client.login(process.env.DISCORD_TOKEN);
