cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node -r ts-node/register src/scripts/simulation-server.ts 8087 &

cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node -r ts-node/register src/scripts/simulation-server.ts 8088 &

sleep 10

cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node --inspect-brk=8081 -r ts-node/register src/scripts/simulation-client.ts &

