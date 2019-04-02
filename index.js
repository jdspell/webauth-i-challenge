const express = require('express');
const helmet = require('helmet');
const knex = require('knex');
const bcrypt = require('bcryptjs');

const knexConfig = require('./knexfile.js');
const db = knex(knexConfig.development);
const server = express();

server.use(helmet());
server.use(express.json());

server.get('/api/users', restricted, async (req, res) => {
    try {
        const users = await db('users');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error);
    }
});

async function restricted(req, res, next) {
    const { username, password} = req.headers;

    if(username && password) {

        try {
            console.log(username, password);
            const user = await db('users')
                .where({ username: username })
                .first();
            console.log(user);
            console.log(bcrypt.compareSync(password, user.password));
            if(user && bcrypt.compareSync(password, user.password)) {
                console.log("hello");
                next();
            } else {
                res.status(401).json({ message: 'You shall not pass!' });
            }
        } catch (error) {
            res.status(500).json(error);
        }
        

    } else {
        res.status(401).json({ message: "Please provide credentials."});
    }
    
}

server.post('/api/register', async (req, res) => {
    try {
        let userInfo = req.body;
        const hash = bcrypt.hashSync(userInfo.password, 8);
        userInfo.password = hash;
        
        const [id] = await db('users').insert(userInfo);
        const newUser = await db('users')
            .where({ id: id })
            .first();
        res.status(200).json(newUser);
    } catch (error) {
        res.status(500).json(error);
    }
});

server.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db('users')
            .where({ username: username })
            .first()
        if(user && bcrypt.compareSync(password, user.password)){
            res.status(200).json({ message: "Logged in", cookie: user.id });
        } else {
            res.status(401).json({ message: 'You shall not pass!' });
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

const port = 5000;
server.listen(port, () => {
    console.log(`\n*** API running on http:localhost:${port} ***\n`);
});