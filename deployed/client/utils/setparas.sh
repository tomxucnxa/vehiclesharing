# This is to be used in cli container, to connect peer and execute peer commands.
# This is only for example of the vehiclesharing channel, and there are many assumptions.

export CLI_TIMEOUT=10
export CLI_DELAY=3

export CRYPTO_PATH="/etc/hyperledger/fabric"
export CHANNEL_NAME="vschannel"

# To export the environment variables for orderer. It is identical for all commands, in this case.
export ORDERER_CA="${CRYPTO_PATH}/orgmsp/orderer.bctest.example.com/msp/tlscacerts/tlsca.bctest.example.com.pem"
export ORDERER_ADDRESS="orderer.bctest.example.com:7050"

# To export the environment variables for admin@bctest.example.com.
envAdminBctest() {
  export CORE_PEER_LOCALMSPID="OrdererMSP"
  export CORE_PEER_TLS_ROOTCERT_FILE="${CRYPTO_PATH}/orgmsp/orderer.bctest.example.com/msp/tlscacerts/tlsca.bctest.example.com.pem"
  export CORE_PEER_MSPCONFIGPATH="${CRYPTO_PATH}/localmsp/admin@bctest.example.com/msp"
}

# To export the environment variables for admin@onlinepay.example.com.
envAdminOnlinePay() {
  export CORE_PEER_LOCALMSPID="OnlinePayMSP"
  export CORE_PEER_ADDRESS="peer0.onlinepay.example.com:7051"
  export CORE_PEER_TLS_ROOTCERT_FILE="${CRYPTO_PATH}/orgmsp/peer0.onlinepay.example.com/msp/tlscacerts/tlsca.onlinepay.example.com.pem"
  export CORE_PEER_MSPCONFIGPATH="${CRYPTO_PATH}/localmsp/admin@onlinepay.example.com/msp"
}

# To export the environment variables for admin@sharing.example.com.
envAdminSharing() {
  export CORE_PEER_LOCALMSPID="SharingMSP"
  export CORE_PEER_ADDRESS="peer0.sharing.example.com:7051"
  export CORE_PEER_TLS_ROOTCERT_FILE="${CRYPTO_PATH}/orgmsp/peer0.sharing.example.com/msp/tlscacerts/tlsca.sharing.example.com.pem"
  export CORE_PEER_MSPCONFIGPATH="${CRYPTO_PATH}/localmsp/admin@sharing.example.com/msp"
}

# To export the environment variables for admin@vehicle.example.com.
envAdminVehicle() {
  export CORE_PEER_LOCALMSPID="VehicleMSP"
  export CORE_PEER_ADDRESS="peer0.vehicle.example.com:7051"
  export CORE_PEER_TLS_ROOTCERT_FILE="${CRYPTO_PATH}/orgmsp/peer0.vehicle.example.com/msp/tlscacerts/tlsca.vehicle.example.com.pem"
  export CORE_PEER_MSPCONFIGPATH="${CRYPTO_PATH}/localmsp/admin@vehicle.example.com/msp"
}

opt=$1

if [ "${opt}" == "adminBctest" ]; then
  envAdminBctest
elif [ "${opt}" == "adminOnlinePay" ]; then
  envAdminOnlinePay
elif [ "${opt}" == "adminSharing" ]; then
  envAdminSharing
elif [ "${opt}" == "adminVehicle" ]; then
  envAdminVehicle
else
  echo "Please specify the identity."
fi

# env | grep CORE_PEER