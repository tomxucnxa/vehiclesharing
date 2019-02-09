##########################################################################################
echo "This script will generate genesis block and channel creation transaction under ./channel-artifacts folder."
echo "And the existing files under ./channel-artifacts will be removed."
echo "Please config configtx.yaml at first."

mkdir -p ./channel-artifacts
rm -rf ./channel-artifacts/*
##########################################################################################

# Generate

export FABRIC_CFG_PATH=${PWD}

# Generate genesis block.
# Use a different channel ID for genesis block!!!
configtxgen -profile VehicleSharingOrdererGenesis -outputBlock ./channel-artifacts/vehiclesharing_genesis.block -channelID vsgenesis

# Generate channel creation transaction.
configtxgen -profile VehicleSharingChannel -outputCreateChannelTx ./channel-artifacts/vehiclesharing_channel.tx -channelID vschannel
