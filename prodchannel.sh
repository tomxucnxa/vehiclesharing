##########################################################################################
echo "This script will generate genesis block and channel creation transaction under ./channel-artifacts folder."
echo "And the existing files under ./channel-artifacts will be removed."
echo "Please config configtx.yaml at first."

mkdir -p ./channel-artifacts
rm -rf ./channel-artifacts/*
##########################################################################################

# Generate

export FABRIC_CFG_PATH=${PWD}
export CLI_TIMEOUT=10
export CLI_DELAY=3
#export CHANNEL_NAME="vschannel"
#export LANGUAGE=golang
#export VERBOSE=true

# Generate cert files and genesis block.
# Use a different channel ID for genesis block!!!
configtxgen -profile VehicleSharingOrdererGenesis -outputBlock ./channel-artifacts/vehiclesharing_genesis.block -channelID vsgenesis

# Generate channel creation transaction.
configtxgen -profile VehicleSharingChannel -outputCreateChannelTx ./channel-artifacts/vehiclesharing_channel.tx -channelID vschannel
configtxgen -profile VehicleSharingChannel -outputAnchorPeersUpdate ./channel-artifacts/vehicle_org_anchors.tx -channelID vschannel -asOrg VehicleOrg
configtxgen -profile VehicleSharingChannel -outputAnchorPeersUpdate ./channel-artifacts/sharing_org_anchors.tx -channelID vschannel -asOrg SharingOrg
