cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node -r ts-node/register src/scripts/simulation-server.ts 8087 &

cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node -r ts-node/register src/scripts/simulation-server.ts 8088 &

sleep 5

cd /Users/ryan/dev/projects/sdk-archivist-nodejs
/Users/ryan/.nvm/versions/node/v8.11.4/bin/node -r ts-node/register src/scripts/simulation-client.ts &

