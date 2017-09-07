const io = require('socket.io');

class Sockets {
	constructor() {
		this.activeSocketService = 'Hello';
	}

	init(server) {
		this.io = this.io || io.listen(server);
		this.io.sockets.on('connection', (socket) => {
			console.log('user connected');

			// socket.on('change', (data) => {
			// 	console.log(data);
			// 	socket.broadcast.emit('update', { data: 'newdata' });
			// });

			socket.on('disconnect', () => {
				console.log('user disconnected');
			});
		});
	}

	sendMessage(message, data) {
		this.io.sockets.emit(message, data);
	}
}
// module.exports = Sockets || new Sockets();
module.exports = new Sockets();

