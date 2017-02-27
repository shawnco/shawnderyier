var tmi = require('tmi.js');
var fs = require('fs');
var options = {
	options: {
		debug: true
	},
	connection: {
		cluster: 'aws',
		reconnect: true
	},
	identity: {
		username: 'shawnderyier',
		password: 'oauth:qqzk3f196vqducyysv87csobevanba'
	},
	channels: ['shawntc', 'honneyplay']
};
var badWords = ['***', 'mod', 'mods'];
var client = new tmi.client(options);

// Load responses
var responses = JSON.parse(fs.readFileSync('responses.json'));
var mods = JSON.parse(fs.readFileSync('mods.json'));
console.log(mods);

// Helper function so that r9k doesn't stop output
function displayMessage(channel, msg){
	var symbols = ['!', '#', '$', '%', '&', '?'];
	var prefix = Math.floor(Math.random()*(symbols.length-1));
	client.action(channel, symbols[prefix] + '- ' + msg);
}


client.connect();

client.on('connected', function(address, port){
});

client.on('chat', function(channel, user, message, self){
	// Split the message
	var parts = message.split(' ');
	
	// Get the start of the command
	var cmd = parts[0];
	
	// Retrieve params if there are any.
	if(parts.length > 1){
		var params = parts[1];
	}
	
	// Responses
	if(responses.responses.hasOwnProperty(cmd)){
		displayMessage(channel, responses.responses[cmd]);
	}
	
	// Counters
	else if(responses.counters.hasOwnProperty(cmd)){
		var msg = responses.counters[cmd].msg;
		var count = responses.counters[cmd].count;
		
		// If we're passed a number, then inc/dec by that number.
		// Otherwise just show the count.
		if(params !== undefined){
			if(params.match(/(\+|\-)[0-9]*$/g)){
				match = /(\+|\-)[0-9]*$/g.exec(params)[0];
				eval('count = count ' + match);
				responses.counters[cmd].count = count;
				
				// Update the count
				fs.writeFile('responses.json', JSON.stringify(responses), function(err){
					if(err){
						console.log(err);
					}
				});				
				
			}
		}
		displayMessage(channel, msg.replace('$$', count));
	}
		
	// Interactives
	else if(responses.interactives.hasOwnProperty(cmd)){
		if(params !== undefined){
			var msg = responses.interactives[cmd];
			displayMessage(channel, msg.replace('$$', params));
		}
	}
	
	// Special commands here
	else if(message === '+shpun'){
		var puns = [
			"I don't trust stairs, they're always up to something.",
			"Why don't some couples go to the gym? Because some relationships don't work out.",
			"Did you hear about the guy whose whole left side was cut off? He's all right now.",
			"I wasn't originally going to get a brain transplant, but then I changed my mind.",
			"I'd tell you a chemistry joke but I know I wouldn't get a reaction.",
			"I wondered why the baseball was getting bigger. Then it hit me."
		]
		var index = Math.floor(Math.random()*(puns.length-1));
		displayMessage(channel, puns[index]);
	}
	else if(message === "+shwaves"){
		client.action(channel, '!waves');
	}
	for(b in badWords){
		if(/*channel === '#honneyplay' && */message.indexOf(badWords[b]) !== -1){
			for(m in mods){
				if(mods[m] === "on"){
					client.whisper(m, Date() + " You may be needed in Honney chat.");
				}
			}
		}
	}
});

// Whisper based commands
client.on('whisper', function(from, userstate, message, self){
	if(self) return;
	if(message === 'on'){
		mods[from] = 'on';
		client.whisper(from, 'You will now be notified if modes are requested.');
	}else if(message === 'off'){
		mods[from] = 'off';
		client.whisper(from, 'You will not be notified if mods are requested.');
	}
	fs.writeFile('mods.json', JSON.stringify(responses), function(err){
		if(err){
			console.log(err);
		}
	});	
	
});