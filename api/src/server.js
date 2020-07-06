import express from 'express';
import { Kafka, logLevel } from 'kafkajs';
import routes from './routes';


const app = express();

//faz conexão com o kafka
const kafka = new Kafka({
  clientId: 'api',
  brokers: ['localhost:9092'],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 10
  },
});

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: 'certificate-group-receiever' })

//Disponibiliza o producer para todas rotas
app.use((req, res, next) => {
  req.producer = producer;
  return next();
})

//cadastra rotas da aplicação
app.use(routes);

async function run() {
  await producer.connect()
  await consumer.connect()

  await consumer.subscribe({ topic: 'certification-response' });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('Resposta', String(message.value));
    },
  });

  app.listen(3333);
}

run().catch(console.error);

