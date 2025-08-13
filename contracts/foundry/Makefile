-include .env

deploy-factories :; forge script script/Deploy.s.sol:DeployFactories --rpc-url pacifica --verify --verifier blockscout --verifier-url "https://pacifica.explorer.testnet.syndicate.io/api/" --broadcast 
deploy-factories-and-game :; forge script script/Deploy.s.sol:DeployFactoriesAndGame --rpc-url pacifica --verify --verifier blockscout --verifier-url "https://pacifica.explorer.testnet.syndicate.io/api/" --broadcast
deploy-bundler :; forge script script/Deploy.s.sol:DeployAdriftBundler --rpc-url risa --verify --verifier blockscout --verifier-url "https://risa-testnet.explorer.alchemy.com/api/" --broadcast
deploy-random :; forge script script/Deploy.s.sol:DeployRandom --rpc-url pacifica --verify --verifier blockscout --verifier-url "https://pacifica.explorer.testnet.syndicate.io/api/" --broadcast
create-game :; forge script script/Game.s.sol:CreateAdrift --rpc-url pacifica --broadcast
deploy-new:; forge script script/Deploy.s.sol:DeployAdriftFactoryWithCheckInOutcomes --rpc-url pacifica --broadcast
