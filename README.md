## Démarrer le projet

- attention si lien ne pas oublier https devant sinon supprimer par gmail
- Préferer utiliser this.configService.get('VARIABLE') à proccess.env.VARIABLE

```bash
#Cloner le repository
$ Git clone https://git.alt-tools.tech/gp_gitgud_perf/cvtools/ms-email.git

#Installer les dépendances
$ pnpm i

#Créer son .env à partir du .env.example
touch touch .env

#Créer son .env et le remplir avec ses infos
$ pnpx prisma migrate dev --name init

#Lancer le serveur
$ pnpm run start:dev


#Côté Gateway Ex: avec Nest js ----------------

#Installer les microservices
pnpm i --save @nestjs/microservices
# Ou
npm i --save @nestjs/microservices

# Installer nats
pnpm i --save nats
# Ou
npm i --save nats


# Execute docker compose
docker compose up
# Ou
docker-compose up


# Add NATS in you module imports

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_TRANSPORT',
        transport: Transport.NATS,
        options: {
          servers:
          [
            `nats://${process.env.NATS_DNS}:${process.env.NATS_PORT}`
          ],
        }
      },
    ]),
  ],


# Inject and Call Nats in your service
  @Inject('NATS_TRANSPORT') private natsClient: ClientProxy,

# Call Nats in your service
 await firstValueFrom(this.natsClient.send('listener', payload))



```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
