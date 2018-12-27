# This is to be used in cli container, to connect peer and execute peer commands.
# This is only for example of the fabric first-network, and there are many assumptions.

CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto"

export CHANNEL_NAME="mychannel"
export LANGUAGE="golang"
export ORDERER_CA=${CRYPTO_PATH}/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export ORDERER_ADDRESS="orderer.example.com:7050"
export DEFAULT_POLICY="AND ('Org1MSP.peer','Org2MSP.peer')"

# To export the environment variables.
exportPeerEnv() {
    peer=$1
    org=$2
    export CORE_PEER_TLS_ROOTCERT_FILE="${CRYPTO_PATH}/peerOrganizations/org${org}.example.com/peers/peer${peer}.org${org}.example.com/tls/ca.crt"
    export CORE_PEER_MSPCONFIGPATH="${CRYPTO_PATH}/peerOrganizations/org${org}.example.com/users/Admin@org${org}.example.com/msp"
    export CORE_PEER_LOCALMSPID="Org${org}MSP"
    export CORE_PEER_ADDRESS="peer${peer}.org${org}.example.com:7051"
    export CORE_PEER_TLS_CERT_FILE="${CRYPTO_PATH}/peerOrganizations/org${org}.example.com/peers/peer${peer}.org${org}.example.com/tls/server.crt"
    export CORE_PEER_TLS_KEY_FILE="${CRYPTO_PATH}/peerOrganizations/org${org}.example.com/peers/peer${peer}.org${org}.example.com/tls/server.key"

    echo "These CORE_PEER environment variables are set:"
    env | grep CORE_PEER
}

# To set the peer connection parameters. It is only for the fixed 2 peers, 2 orgs in the example.
exportPeerConn2Nodes() {    
    peer=$1
    org=$2
    peerSecond=$3
    orgSecond=$4
    export PEER_CONN_PARMS="--peerAddresses peer${peer}.org${org}.example.com:7051 --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/org${org}.example.com/peers/peer${peer}.org${org}.example.com/tls/ca.crt --peerAddresses peer${peerSecond}.org${orgSecond}.example.com:7051 --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/org${orgSecond}.example.com/peers/peer${peerSecond}.org${orgSecond}.example.com/tls/ca.crt"

    echo "The PEER_CONN_PARMS is set:"
    echo $PEER_CONN_PARMS
}

opt=$1
peer=$2
org=$3
peerSecond=$4
orgSecond=$5

if [ "${opt}" == "peerenv" ]; then
  exportPeerEnv ${peer} ${org}
elif [ "${opt}" == "peerconn" ]; then
  exportPeerConn2Nodes ${peer} ${org} ${peerSecond} ${orgSecond}
else
  echo "The common environment variables are exported."
fi

# env | grep CORE_PEER