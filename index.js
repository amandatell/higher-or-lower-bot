require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios')

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let deck
let currCard
let amount = 0
let participants = []
let index = 0
let isShuffled = false
let inGame = false
let start = false

client.on('message', msg => {
    const awaitTime = async (msg, value = false, time = 2000) => {
        await sleep(time);
        if (value)
            msg.channel.send(value)
    }
    if (msg.content === '-help') {
        msg.channel.send('**HIGHER OR LOWER Games Rules**\nThe rules are simple. Guess if the next card presented is higher or lower. If you are wrong you have to drink as many times as cards there have been since last time someone got it wrong.\nCommands are:\n**-new game** to start a new game\n**-join** to join the game\n**-start** to start the game once everyones joined\n**-shuffle** to shuffle a new deck of cards\n**-higher/-lower** to guess if the next card is higher or lower\n**-quit** to quit the game')
    }
    else if (msg.content === '-new game') {
        participants = []
        msg.channel.send('New game started! Type -join to join in, once you are ready type -start!')
        inGame = true
    }
    else if (msg.content === '-quit') {
        if (inGame) {
            msg.channel.send('It was fun to play! Enjoy the rest of your day.')
            deck = ''
            currCard = ''
            amount = 0
            participants = []
            index = 0
            isShuffled = false
            inGame = false
            start = false
        }
        else msg.channel.send("You can't quit something you haven't started! Type -new game to start a game.")
    }
    else if (msg.content === '-shuffle') {
        if (inGame && start) {
            getDeck().then(res => {
                deck = res.data.deck_id;
                drawCard().then(res => {
                    currCard = res.data.cards[0]
                    msg.channel.send(`All shuffled! The first card of the deck if ${currCard.value} of ${currCard.suit}`, { files: [currCard.image] })
                    awaitTime(msg, `${participants[index]}, you turn! If you think the next card is higher type -higher else type -lower.`, 1500)
                })
            })
            isShuffled = true
        }

    } else if (msg.content === '-higher' || msg.content === '-lower') {
        if (inGame && start) {
            if (`<@${msg.author.id}>` != participants[index]) {
                msg.reply('wait for your turn!')
                return
            }
            drawCard().then(res => {
                msg.reply(`you drew a ${res.data.cards[0].value} of ${res.data.cards[0].suit}`, { files: [res.data.cards[0].image] })
                if (res.data.remaining === 0) {
                    msg.channel.send(`The deck has finished. Write -shuffle to shuffle a new deck of cards`)
                    isShuffled = false
                }
                amount++
                awaitTime(msg)
                if (getRealValue(res.data.cards[0].value) < getRealValue(currCard.value) && msg.content === '-higher') {
                    awaitTime(msg, `${participants[index]}, you were wrong, it was LOWER! DRINK ${amount} times!`, 1000)
                    amount = 0
                } else if (getRealValue(res.data.cards[0].value) > getRealValue(currCard.value) && msg.content === '-lower') {
                    awaitTime(msg, `${participants[index]}, you were wrong, it was HIGHER! DRINK ${amount} times!`, 1000)
                    amount = 0
                } else if (getRealValue(res.data.cards[0].value) === getRealValue(currCard.value)) {
                    awaitTime(msg, value = `OH NO, ${participants[index]}! You have to down your drink.`, 1000)
                    amount = 0
                }
                else
                    awaitTime(msg, `${participants[index]}, CORRECT! No drinks for you.`, 1000)

                if (index + 1 === participants.length) index = 0
                else index++

                awaitTime(msg, `${participants[index]}, you turn! If you think the next card is higher type -higher, else type -lower.`, 2000)
                currCard = res.data.cards[0]
            })
        }
        else if (!inGame) msg.channel.send(`You are not playing a game! Type -new game to start a game.`)
        else if (!start) msg.channel.send(`You haven't started the game yet! Type -start to start a game.`)
        else if (!isShuffled) msg.channel.send(`You need to shuffle the cards to continue the game. Type -shuffle.`)
    } else if (msg.content === '-join') {
        if (!participants.includes(`<@${msg.member.user.id}>`)) {
            participants.push(`<@${msg.member.user.id}>`)
            msg.react('👍')
        }
        else msg.reply("there's no need to join twice, you are in the game!")
    } else if (msg.content === '-start') {
        if (participants.length < 1) msg.channel.send('At least two people needs to join to play!')
        else {
            msg.channel.send("Let's play! First let's shuffle the deck of cards! Type -shuffle")
            start = true
        }
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getRealValue = (value) => {
    switch (value) {
        case 'JACK': return 11
        case 'QUEEN': return 12
        case 'KING': return 13
        case 'ACE': return 14
        default: return value
    }
}

const drawCard = async () => {
    try {
        return await axios.get(`https://deckofcardsapi.com/api/deck/${deck}/draw/?count=1`)
    } catch (error) {
        console.error(error)
    }
}

const getDeck = async () => {
    try {
        return await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    } catch (error) {
        console.error(error)
    }
}

const TOKEN = process.env.TOKEN;

client.login(TOKEN);