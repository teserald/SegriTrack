const mongoose = require('mongoose');
const fs = require('fs');
const Worker = require('./src/models/Worker');
const Pickup = require('./src/models/Pickup');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/segritrack').then(async () => {
    try {
        let out = '';
        const workers = await Worker.find({}, 'name email').sort({email: 1});
        out += '--- WORKERS ---\n';
        workers.forEach(w => out += `${w.name} - ${w.email}\n`);
        const users = await User.find({}).sort({email: 1});
        out += '\n--- USERS ---\n';
        users.forEach(u => out += `${u.name} - ${u.email}\n`);
        
        const pickups = await Pickup.find({ status: 'completed' }).limit(15);
        out += '\n--- RECENT HISTORY USERS ---\n';
        for(let p of pickups) {
            const u = await User.findById(p.user);
            out += `User: ${u ? u.name : 'Unknown User'}\n`;
        }
        fs.writeFileSync('verify_output.txt', out);
    } catch(e) {
        fs.writeFileSync('verify_output.txt', e.toString());
    }
    process.exit(0);
});
