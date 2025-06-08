/**
 * Ana sunucu dosyası
 * Bu dosya, Express.js ve Socket.IO kullanarak gerçek zamanlı mesajlaşma sunucusunu oluşturur.
 * 
 * Kullanılan teknolojiler:
 * - Express.js: HTTP sunucusu için
 * - Socket.IO: Gerçek zamanlı iletişim için
 * - JWT: Kimlik doğrulama için
 * - CORS: Cross-origin istekleri için
 */

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",  // Tüm kaynaklara izin ver
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true,
    path: '/socket.io/'
});
const os = require('os');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// CORS ayarlarını güncelle
app.use(cors({
    origin: true, // Tüm originlere izin ver
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hata ayıklama için middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Test route'u
app.get('/', (req, res) => {
    console.log('Ana sayfa isteği alındı');
    res.send(`
        <html>
            <head>
                <title>Socket.IO Test</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #121212;
                        color: #fff;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background-color: #1E1E1E;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    }
                    h1 { color: #6C63FF; }
                    .status {
                        padding: 10px;
                        margin: 10px 0;
                        border-radius: 5px;
                        background-color: #2A2A2A;
                    }
                    .connected { color: #4CAF50; }
                    .disconnected { color: #f44336; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Socket.IO Sunucu Durumu</h1>
                    <div class="status">
                        <p>Sunucu IP: <strong>${getLocalIP()}</strong></p>
                        <p>Port: <strong>${PORT}</strong></p>
                        <p>Bağlı Kullanıcılar: <strong id="userCount">0</strong></p>
                    </div>
                    <div id="status" class="status">
                        <p>Sunucu Durumu: <span class="connected">Çalışıyor</span></p>
                    </div>
                </div>
                <script src="/socket.io/socket.io.js"></script>
                <script>
                    const socket = io();
                    socket.on('connect', () => {
                        console.log('Bağlantı başarılı');
                        document.getElementById('status').innerHTML = 
                            '<p>Sunucu Durumu: <span class="connected">Bağlandı</span></p>';
                    });
                    socket.on('disconnect', () => {
                        console.log('Bağlantı kesildi');
                        document.getElementById('status').innerHTML = 
                            '<p>Sunucu Durumu: <span class="disconnected">Bağlantı Kesildi</span></p>';
                    });
                    socket.on('userList', (users) => {
                        document.getElementById('userCount').textContent = users.length;
                    });
                </script>
            </body>
        </html>
    `);
});

// IP adresini al
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const PORT = 3000;
const IP = '0.0.0.0'; // Tüm arayüzlerde dinlemek için 0.0.0.0 olarak ayarlandı

// Veritabanı yerine geçici depolama (userCode bazlı)
const connectedUsers = new Map();
// conversations Map'inin anahtarını userCode'lara dayalı yapıyoruz
const conversations = new Map(); // Key: sorted_user_codes (string), Value: conversation object
const messages = new Map(); // Key: conversationId (string), Value: Array of message objects

const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Mesajları dosyadan yükle
function loadMessages() {
    if (fs.existsSync(MESSAGES_FILE)) {
        try {
            const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
            const parsedMessages = JSON.parse(data);
            for (const convId in parsedMessages) {
                messages.set(convId, parsedMessages[convId]);
            }
            console.log('Mesajlar dosyadan yüklendi.');
        } catch (error) {
            console.error('Mesajları yüklerken hata oluştu:', error);
        }
    }
}

// Mesajları dosyaya kaydet
function saveMessages() {
    try {
        const data = JSON.stringify(Object.fromEntries(messages), null, 2);
        fs.writeFileSync(MESSAGES_FILE, data, 'utf8');
        console.log('Mesajlar dosyaya kaydedildi.');
    } catch (error) {
        console.error('Mesajları kaydederken hata oluştu:', error);
    }
}

// Benzersiz kod oluşturma fonksiyonu
function generateUserCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

io.on('connection', (socket) => {
    console.log('Yeni kullanıcı bağlandı:', socket.id);
    console.log('Bağlantı detayları:', {
        id: socket.id,
        handshake: socket.handshake,
        transport: socket.conn.transport.name
    });

    // Kullanıcı kaydı
    socket.on('register', (userData) => {
        console.log('Kullanıcı kaydı alındı:', {
            socketId: socket.id,
            userData: userData,
            timestamp: new Date().toISOString()
        });

        try {
            // Eğer userCode yoksa, anonim kullanıcı olarak kabul et ve otomatik kod oluştur
            if (!userData || !userData.userCode) {
                userData = {
                    ...userData,
                    userCode: generateUserCode(),
                    name: `Kullanıcı_${generateUserCode()}`
                };
                console.log('Anonim kullanıcı için kod oluşturuldu:', userData.userCode);
            }

            const userCodeUpper = userData.userCode.toUpperCase();
            console.log('Kullanıcı kodu dönüştürüldü:', userCodeUpper);
            
            // Bağlı kullanıcıları socket id ile takip etmeye devam et
            const user = {
                id: socket.id,
                userCode: userCodeUpper,
                name: userData.name || `Kullanıcı_${userCodeUpper}`,
                deviceType: userData.deviceType || 'mobile',
                lastSeen: new Date()
            };
            
            console.log('Oluşturulan kullanıcı objesi:', user);
            
            connectedUsers.set(socket.id, user);
            console.log('Güncel bağlı kullanıcılar:', Array.from(connectedUsers.values()));
            
            // Kullanıcı listesini yayınla
            io.emit('userList', Array.from(connectedUsers.values()));
            console.log('Kullanıcı listesi yayınlandı');
            
            // Kayıt başarılı yanıtı gönder
            socket.emit('registered', user);
            console.log('Kayıt başarılı yanıtı gönderildi');

            // Kullanıcı kaydolduktan sonra mevcut konuşmalarını gönder
            const userConversations = Array.from(conversations.values())
                .filter(conv => conv.participants.includes(userCodeUpper));
            console.log(`Kullanıcı ${userCodeUpper} için bulunan konuşmalar:`, userConversations);
            
            socket.emit('conversations', userConversations);
            console.log(`Kullanıcı ${userCodeUpper} için ${userConversations.length} konuşma gönderildi.`);
        } catch (error) {
            console.error('Kullanıcı kaydı sırasında hata:', {
                error: error.message,
                stack: error.stack,
                socketId: socket.id,
                userData: userData
            });
            socket.emit('error', { 
                message: 'Kullanıcı kaydı sırasında bir hata oluştu',
                details: error.message 
            });
        }
    });

    // Sohbet başlatma
    socket.on('startConversation', async ({ userCode, messageMode }, callback) => {
        console.log('Sohbet başlatma isteği:', { userCode, messageMode });
        const senderSocketId = socket.id;
        const sender = connectedUsers.get(senderSocketId);

        if (!sender) {
            console.error('Gönderici kullanıcı bulunamadı:', senderSocketId);
            if (callback) callback({ error: 'Gönderici kullanıcı bulunamadı' });
            return;
        }

        const receiverUserCode = userCode.toUpperCase();

        // Konuşma ID'sini userCode'lardan oluştur
        const participantUserCodes = [sender.userCode, receiverUserCode].sort();
        const conversationId = participantUserCodes.join('_');

        let conversation = conversations.get(conversationId);

        if (!conversation) {
            // Yeni konuşma oluştur
            // Alıcı kullanıcının bilgilerini bağlı kullanıcılar listesinden çekmeye çalış
            const receiver = Array.from(connectedUsers.values()).find(u => u.userCode === receiverUserCode);
            
            conversation = {
                id: conversationId,
                participants: participantUserCodes, // Katılımcılar userCode olarak saklanıyor
                participantDetails: { // Katılımcı detayları (isteğe bağlı, server tarafında tutulabilir)
                    [sender.userCode]: { name: sender.name, userCode: sender.userCode },
                    // Eğer alıcı bağlıysa onun bilgilerini de ekle
                    ...(receiver && { [receiver.userCode]: { name: receiver.name, userCode: receiver.userCode } })
                },
                messageMode,
                lastMessage: 'Yeni bir sohbet başlatıldı',
                lastMessageTime: new Date(),
                // Başlık için kullanılacak kullanıcı adını burada belirleyebiliriz (alıcının adı)
                userName: receiver ? receiver.name : `Kullanıcı_${receiverUserCode}`,
                userCode: receiverUserCode // Alıcının userCode'u
            };
            conversations.set(conversationId, conversation);
            console.log('Yeni konuşma oluşturuldu:', conversation);

            // Yeni konuşmayı gönderen ve alıcıya haber ver
            socket.emit('newConversation', conversation);
            // Alıcı bağlıysa ona da gönder
            const receiverSocket = Array.from(connectedUsers.values()).find(u => u.userCode === receiverUserCode && u.id !== senderSocketId);
            if (receiverSocket) {
                io.to(receiverSocket.id).emit('newConversation', conversation);
            } else {
                console.log(`Alıcı kullanıcı ${receiverUserCode} bağlı değil, newConversation gönderilemedi.`);
            }

        } else {
             console.log('Mevcut konuşma bulundu:', conversation);
             // Mevcut konuşmayı gönderen ve alıcıya (eğer bağlıysa) güncelleme olarak gönder
            socket.emit('conversationUpdated', conversation);
            const receiverSocket = Array.from(connectedUsers.values()).find(u => u.userCode === receiverUserCode && u.id !== senderSocketId);
            if (receiverSocket) {
                 io.to(receiverSocket.id).emit('conversationUpdated', conversation);
            }
        }

        // Sohbet başlatma başarılı callback'ini çağır
        if (callback) callback({ conversationId });
    });

    // Mesaj gönderme
    socket.on('sendMessage', (data) => {
        console.log('Mesaj gönderme:', data);
        const { conversationId, content, type } = data;
        const senderSocketId = socket.id;
        const sender = connectedUsers.get(senderSocketId);

        if (!sender) {
            console.error('Gönderici kullanıcı bulunamadı:', senderSocketId);
            socket.emit('error', { message: 'Gönderici kullanıcı bulunamadı' });
            return;
        }

        const conversation = conversations.get(conversationId);

        if (!conversation) {
            console.error('Sohbet bulunamadı:', conversationId);
            socket.emit('error', { message: 'Sohbet bulunamadı' });
            return;
        }

        const message = {
            id: Date.now().toString(),
            conversationId,
            senderId: senderSocketId, // Mesajı gönderen socket ID'si (geçici)
            senderUserCode: sender.userCode, // Mesajı gönderen userCode'u (kalıcı)
            content,
            type,
            timestamp: new Date(),
            read: false
        };

        if (!messages.has(conversationId)) {
            messages.set(conversationId, []);
        }
        messages.get(conversationId).push(message);
        console.log(`Yeni mesaj eklendi: ${conversationId}`, message);

        saveMessages(); // Mesajı kaydet

        // Konuşmayı güncelle: son mesaj ve zamanı
        conversation.lastMessage = content;
        conversation.lastMessageTime = new Date();
         // conversation updated eventini gonder (lastMessage ve lastMessageTime guncellendi bilgisi icin)
        io.to(conversationId).emit('conversationUpdated', conversation); // Conversation ID'si bir socket odası gibi kullanılıyor

        // Mesajı sohbetteki tüm katılımcılara gönder
        // Katılımcıların güncel socket idlerini bulmamız gerekiyor userCode'larına bakarak
        const participantSocketIds = conversation.participants
            .map(userCode => Array.from(connectedUsers.values()).find(u => u.userCode === userCode)?.id)
            .filter(id => id !== undefined);

        console.log(`Mesaj ${conversationId} sohbetindeki katılımcılara gönderiliyor:`, participantSocketIds);
        // io.to() socket ID'leri listesi veya oda adı alabilir. Biz conversationId'yi oda adı gibi kullanalım.
        // Veya her katılımcının socket id'sine tek tek gönderebiliriz.
        // Conversation ID'sini oda olarak kullanmak daha kolay:
        io.to(conversationId).emit('newMessage', message);

         // Ensure sockets join the conversation room
         participantSocketIds.forEach(socketId => {
             const participantSocket = io.sockets.sockets.get(socketId);
             if (participantSocket) {
                 participantSocket.join(conversationId);
                 console.log(`Socket ${socketId} odaya ${conversationId} katıldı.`);
             }
         });
    });

    // Kullanıcı bir konuşmaya katıldığında o odaya dahil et
    socket.on('joinConversation', (conversationId) => {
        console.log(`Socket ${socket.id} odaya ${conversationId} katılıyor.`);
        socket.join(conversationId);
    });

    // Mesajları getir
    socket.on('getMessages', ({ conversationId }) => {
        console.log('Mesajları getir:', conversationId);
        const conversationMessages = messages.get(conversationId) || [];
        socket.emit('messages', conversationMessages);

        // Mesajlar çekildiğinde ilgili conversation odasına katıl
        socket.join(conversationId);
        console.log(`Socket ${socket.id} odaya ${conversationId} katıldı (getMessages).`);
    });

    // Konuşmaları getir
    socket.on('getConversations', () => {
        console.log('Konuşmaları getir isteği');
        const sender = connectedUsers.get(socket.id);
        if (!sender) {
             console.error('getConversations: Gönderici kullanıcı bulunamadı:', socket.id);
             socket.emit('error', { message: 'Kullanıcı bilgisi eksik' });
             return;
        }
        
        // Kullanıcının userCode'una göre konuşmaları filtrele
        const userConversations = Array.from(conversations.values())
            .filter(conv => conv.participants.includes(sender.userCode));
        
        console.log(`getConversations: ${sender.userCode} için ${userConversations.length} konuşma bulundu.`);
        socket.emit('conversations', userConversations);
    });

    // Mesaj silme (bu kısım userCode bazlı conversationId ile çalışmalı)
    socket.on('deleteMessage', ({ messageId, conversationId }) => {
        console.log(`Mesaj silme isteği: ${messageId} from ${conversationId}`);
        if (messages.has(conversationId)) {
            const conversationMessages = messages.get(conversationId);
            const initialLength = conversationMessages.length;
            messages.set(conversationId, conversationMessages.filter(msg => msg.id !== messageId));
            if (messages.get(conversationId).length < initialLength) {
                 console.log(`Mesaj ${messageId} sohbetten ${conversationId} silindi.`);
                 saveMessages(); // Mesaj silindikten sonra kaydet
                 // Mesajın silindiğini katılımcılara duyur (isteğe bağlı)
                 io.to(conversationId).emit('messageDeleted', { messageId, conversationId });
            } else {
                 console.log(`Mesaj ${messageId} sohbette ${conversationId} bulunamadı.`);
            }
        }
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
        // Kullanıcıyı bağlı kullanıcı listesinden kaldır
        connectedUsers.delete(socket.id);
        // Güncel kullanıcı listesini yayınla
        io.emit('userList', Array.from(connectedUsers.values()));
    });
});

// Sunucuyu belirli IP ve portta dinlemeye başla
server.listen(PORT, () => { // Sadece port belirtilerek tüm arayüzlerde dinleme sağlanıyor
    console.log(`Sunucu başlatıldı: http://${IP === '0.0.0.0' ? getLocalIP() : IP}:${PORT}`);
    console.log(`Socket.IO sunucusu dinleniyor: ws://${IP === '0.0.0.0' ? getLocalIP() : IP}:${PORT}`);
    
    // Sunucunun dinlediği tüm arayüzleri göstermek için:
    console.log('Tüm ağ arayüzleri:');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`- http://${iface.address}:${PORT}`);
            }
        }
    }

    loadMessages(); // Sunucu başladığında mesajları yükle
}); 