mkdir -p ./data/8087/origin-blocks
mkdir -p ./data/8087/next-hash-index
mkdir -p ./data/8087/origin-chain
mkdir -p ./data/8088/origin-blocks
mkdir -p ./data/8088/next-hash-index
mkdir -p ./data/8088/origin-chain

DIR_1=$(pwd)
DIR_1="$DIR_1/data/8087"

DIR_2=$(pwd)
DIR_2="$DIR_2/data/8088"

node -r ts-node/register src/scripts/simulation-server.ts $DIR_1 8087 &
node -r ts-node/register src/scripts/simulation-server.ts $DIR_2 8088 &
sleep 7
node -r ts-node/register src/scripts/simulation-client.ts &

