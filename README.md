# hitechbot

Bot for https://matchup.hitech-gamer.com/game/start

--

## Requirements

- Node v15.X
- twitch-account

## Running the Bot

 - `$ npm i`
 - (With DevTools open) Go to https://matchup.hitech-gamer.com/dashboard#mitmachen and start a game
 - Extract cookie string from http-headers from "start" request and replace cookieString of `src/index.js`
 - `$ npm start`
 
