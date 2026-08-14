import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mercado_ia_123';

// Verificacion webhook Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recibir mensajes
app.post('/webhook', async (req, res) => {
  console.log('Webhook:', JSON.stringify(req.body, null, 2));
  res.status(200).send('EVENT_RECEIVED');
});

// Enviar WhatsApp
app.post('/api/whatsapp/send', async (req, res) => {
  const { to, text } = req.body;
  try {
    const r = await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      { messaging_product: 'whatsapp', to, text: { body: text } },
      { headers: { Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}` } }
    );
    res.json(r.data);
  } catch (e) { res.status(500).json(e.response?.data || e.message); }
});

app.listen(process.env.PORT || 3000, () => console.log('Mercado-IA listo'));
