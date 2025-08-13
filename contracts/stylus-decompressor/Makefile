include .env

check :; cargo stylus check

test :; cargo test

# Make sure you are running the devnode locally: https://github.com/OffchainLabs/nitro-devnode
deploy-local-dry-run :; cargo stylus deploy \
  --endpoint='http://localhost:8547' \
  --private-key="${DEV_PRIVATE_KEY}" \
  --estimate-gas \
  --verbose

deploy-local :; cargo stylus deploy \
  --endpoint='http://localhost:8547' \
  --private-key="${DEV_PRIVATE_KEY}" \
  --verbose

deploy-risa :; cargo stylus deploy \
  --endpoint="${RISA_API_URL}" \
  --private-key="${DEPLOYER_PRIVATE_KEY}" \
  --verbose


