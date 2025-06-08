/**
 * Port kontrol dosyası
 * Bu dosya, sunucunun kullanacağı portun müsait olup olmadığını kontrol eder.
 * 
 * Kullanılan teknolojiler:
 * - net: Node.js'in yerleşik ağ modülü
 */

const net = require('net');

const PORT = 3000;

const server = net.createServer()
    .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} zaten kullanımda!`);
        } else {
            console.error('Port kontrolü sırasında hata:', err);
        }
    })
    .once('listening', () => {
        server.close();
        console.log(`Port ${PORT} kullanılabilir!`);
    })
    .listen(PORT); 