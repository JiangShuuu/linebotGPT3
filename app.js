require('dotenv').config()

const express = require('express')
const line = require('@line/bot-sdk')
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  if (event.message.text === '抽') {

    const images = {
        type: 'image',
        originalContentUrl: 'https://upload.cc/i1/2022/10/28/TWcEhD.jpeg',
        previewImageUrl: 'https://upload.cc/i1/2022/10/28/TWcEhD.jpeg'
    }

    return client.replyMessage(event.replyToken, images);
  }

  if (event.message.text === '地址') {
    return client.replyMessage(event.replyToken, 
        {
            type: 'location',
            title: '出沒地',
            address: "251新北市淡水區沙崙路333號",
            latitude: 25.1878538,
            longitude: 121.4276130
        }
    )
  }

  // create a echoing text message
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text ,
    max_tokens: 1000,
  });

  // create a echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});