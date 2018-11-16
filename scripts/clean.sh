echo "Cleaning"
rm -rf node_modules
pwd
cd packages

echo "Cleaning sdk-archivist-nodejs"
cd ../sdk-archivist-nodejs
rm -rf dist
rm -rf node_modules

echo "Cleaning api-archivist-graphql"
cd ../api-archivist-graphql
rm -rf dist
rm -rf node_modules

echo "Cleaning app-archivist-nodejs"
cd ../app-archivist-nodejs
rm -rf dist
rm -rf node_modules