var tmi = require('tmi.js');
var fs = require('fs');
var credentials = JSON.parse(fs.readFileSync('credentials.json'));
var options = {
	options: {
		debug: true
	},
	connection: {
		cluster: 'aws',
		reconnect: true
	},
	identity: {
		username: credentials.username,
		password: credentials.password
	},
	channels: ['shawntc', 'honneyplay', 'dillonea', 'pakratt0013', 'jessicamak']
};
var badWords = ['***', 'mod', 'mods'];
var client = new tmi.client(options);
var COOLDOWN = 30;
var currentCooldown = COOLDOWN;

// Load responses
var responses = JSON.parse(fs.readFileSync('responses.json'));
var mods = JSON.parse(fs.readFileSync('mods.json'));
var users = JSON.parse(fs.readFileSync('users.json'));
console.log(mods);

// Helper function so that r9k doesn't stop output
function displayMessage(channel, msg){
	var symbols = ['!', '#', '$', '%', '&', '?'];
	var prefix = Math.floor(Math.random()*(symbols.length-1));
	client.say(channel, symbols[prefix] + '- ' + msg);
}

// Helper function to decide if enough time has passed for it to be used
function guard(channel){
	if(currentCooldown < 0){
		currentCooldown = COOLDOWN;
		return true;
	}else{
		client.say(channel, 'You may use me again in ' + currentCooldown + ' messages.');
		return false;
	}
}


client.connect();

client.on('connected', function(address, port){
});

client.on('chat', function(channel, user, message, self){
	
	// Overcome the 14-num name attacks
	if(/^[0-9]{14}$/g.test(user)){
		client.ban(channel, user, 'Spam bot');
	}
	
	
	
	// Decrement cooldown
	currentCooldown--;
	
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
		//if(!guard(channel)) return;
		displayMessage(channel, responses.responses[cmd]);
	}
	
	// Counters
	else if(responses.counters.hasOwnProperty(cmd)){
		//if(!guard(channel)) return;
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
		//if(!guard(channel)) return;
		if(params !== undefined){
			var msg = responses.interactives[cmd];
			displayMessage(channel, msg.replace('$$', params));
		}
	}
	
	// Special commands here
	else if(message === '+shpun'){
		//if(!guard(channel))return;
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
		//if(!guard(channel))return;
		client.say(channel, '!waves');
	}


	for(b in badWords){
		if((channel === '#honneyplay' || channel === '#thelilocean_b') && message.indexOf(badWords[b]) !== -1){
			for(m in mods){
				if(mods[m] === "on"){
					console.log(user);
					client.whisper(m, '[' + Date() + '][' + channel + '] ' + user + ': ' + message);
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
		client.whisper(from, 'You will now be notified if mods are requested.');
	}else if(message === 'off'){
		mods[from] = 'off';
		client.whisper(from, 'You will not be notified if mods are requested.');
	}else if(message.indexOf('leave') !== -1){
		// Only allow botmods to force leave
		//if(users.moderator.includes(from)){
			var toLeave = message.split(' ')[1];
			if(toLeave.indexOf(',') !== -1){
				var channels = toLeave.split(',');
				for(c in channels){
					client.part(channels[c]);
					client.whisper(from, 'I have left ' + channels[c]);
				}
			}else{		
				client.part(toLeave);
				client.whisper(from, 'I have left ' + toLeave);
			}
		//}
	}else if(message.indexOf('join') !== -1){
		// Only allow botmods to force join
		//if(users.moderator.includes(from)){
			var toJoin = message.split(' ')[1];
			if(toJoin.indexOf(',') !== -1){
				var channels = toJoin.split(',');
				for(c in channels){
					client.join(channels[c]);
					client.whisper(from, 'I have joined ' + channels[c]);
				}
			}else{
				client.join(toJoin);
				client.whisper(from, 'I have joined ' + toJoin);
			}
		//}
	}else if(message.indexOf('sleep') !== -1){
		for(m in mods){
			if(mods[m] === "on"){
				client.whisper(m, 'Shawnderyier is going down for the night. Happy modding!');
			}
		}
	}
	fs.writeFile('mods.json', JSON.stringify(mods), function(err){
		if(err){
			console.log(err);
		}
	});	
	
});

// 3-3-2017: Whisper Honney mods if onesittingbull joins - they like to fake donations
client.on('join', function(channel, username, self){
	if(channel === '#honneyplay'){
		if(username === 'onesittingbull'){
			client.whisper('shawntc', 'onesittingbull has joined Honney chat, please be advised.');
			client.whisper('dacoolbros', 'onesittingbull has joined Honney chat, please be advised.');
		}
	}
});