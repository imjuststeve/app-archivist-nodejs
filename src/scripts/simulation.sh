cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node -r ts-node/register src/scripts/simulation-server.ts 8087 >log.log 2>&1 &

cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node --inspect=8082 -r ts-node/register src/scripts/simulation-server.ts 8088 >log.log 2>&1 &

cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node --inspect-brk=8083 -r ts-node/register src/scripts/simulation-client.ts >log.log 2>&1 &

