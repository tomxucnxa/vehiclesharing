
cd ~/fabric/vehiclesharing

# Generate

export FABRIC_CFG_PATH=${PWD}
export CLI_TIMEOUT=10
export CLI_DELAY=3
export CHANNEL_NAME="vschannel"
export LANGUAGE=golang
export VERBOSE=true

mkdir -p channel-artifacts
rm -rf channel-artifacts/*

# Generate cert files and genesis block

configtxgen -profile VehicleSharingOrdererGenesis -outputBlock ./channel-artifacts/vehiclesharing_genesis.block 

#### (In this case now)

configtxgen -profile VehicleSharingChannel -outputCreateChannelTx ./channel-artifacts/vehiclesharing_channel.tx -channelID ${CHANNEL_NAME}

configtxgen -profile VehicleSharingChannel -outputAnchorPeersUpdate ./channel-artifacts/vehicle_org_anchors.tx -channelID ${CHANNEL_NAME} -asOrg VehicleOrg
configtxgen -profile VehicleSharingChannel -outputAnchorPeersUpdate ./channel-artifacts/sharing_org_anchors.tx -channelID ${CHANNEL_NAME} -asOrg SharingOrg
