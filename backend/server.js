import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  PORT = 3000
} = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.post('/api/send-sms', async (req, res) => {
  const { to, lat, lng, accuracy, message } = req.body;
  if (!to || !lat || !lng) return res.status(400).json({ ok: false, error: 'Faltan datos' });

  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}&z=18`;
  const body = `${message || 'ALERTA SISMICA'}\n${mapsLink}\nPrecision: +/-${Math.round(accuracy || 0)} m\nHora: ${new Date().toLocaleString('es-MX')}`;

  try {
    const msg = await client.messages.create({ body, from: TWILIO_PHONE_NUMBER, to });
    res.json({ ok: true, sid: msg.sid });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, servicio: 'EduSismos' }));
app.listen(PORT, () => console.log(`Backend activo en puerto ${PORT}`));
