
const startSessionPayload = {
  flags: 32768,
  components: [
    {
      type: 17,
      components: [
        {
          type: 12,
          items: [
            {
              media: {
                url: "https://media.discordapp.net/attachments/1411696190130753579/1411704677057433706/Banners_11.png?ex=68b59fef&is=68b44e6f&hm=52b6127a52cd6b4d5013eeddbd1f3d7c48c92073139e0dbcc43de343745d6e6c&=&format=webp&quality=lossless&width=1860&height=261"
              }
            }
          ]
        },
        {
          type: 9,
          components: [
            {
              type: 10,
              content: "# The gates are open,\n\nWe have now opened our gates to allow students to begin making their way to the hall. Please line up with your form group and await for the Headteacher to begin morning announcements. \n\nPlease ensure you are wearing your uniform, or it will be automatically applied to you when you join. Sixth Form students and visitors must visit reception to request their lanyard. "
            }
          ],
          accessory: {
            type: 2,
            style: 5,
            url: "https://www.roblox.com/games/83329354034194/Thornvale",
            label: "Join"
          }
        }
      ],
      spoiler: false
    }
  ]
};

require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!startsession') {
    // Send the raw container payload
    await message.channel.send(startSessionPayload);
  }
});

client.login(process.env.DISCORD_TOKEN);
