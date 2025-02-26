#!/bin/bash
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"

cd $SCRIPT_PATH

docker compose down -v
docker compose up -d orion_db
docker compose run --rm orion_graphql-api npm run db:migrate
docker compose run --rm -v $(pwd)/orionData.json:/input/seedData.json orion_graphql-api npm run db:seed /input/seedData.json
docker compose up -d orion_graphql-api