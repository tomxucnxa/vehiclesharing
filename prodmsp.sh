##########################################################################################
echo "This script will generate all example MSP materials under ./mymsp folder."
echo "And the existing files under ./mymsp will be removed."

mkdir -p ./mymsp
rm -rf ./mymsp/*
##########################################################################################

##########################################################################################
################################# FOR BCTEST.EXAMPLE.COM #################################
##########################################################################################

# Self-signed CA Root Cert - ca.bctest.example.com
./utils/mymsputils.sh selfsign -n ca.bctest.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=ca.bctest.example.com" \
-o ./mymsp/ca.bctest.example.com/

# Self-signed TLS CA Root Cert
./utils/mymsputils.sh selfsign -n tlsca.bctest.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=tlsca.bctest.example.com" \
-o ./mymsp/tlsca.bctest.example.com/

# msp admin@bctest.example.com
./utils/mymsputils.sh msp -n admin@bctest.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=admin@bctest.example.com" \
-o ./mymsp/ -c ./mymsp/ca.bctest.example.com/ca.bctest.example.com.pem -k ./mymsp/ca.bctest.example.com/ca.bctest.example.com.key \
-C ./mymsp/tlsca.bctest.example.com/tlsca.bctest.example.com.pem -K ./mymsp/tlsca.bctest.example.com/tlsca.bctest.example.com.key

# msp orderer.bctest.example.com
./utils/mymsputils.sh msp -n orderer.bctest.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=orderer.bctest.example.com" \
-o ./mymsp/ -c ./mymsp/ca.bctest.example.com/ca.bctest.example.com.pem -k ./mymsp/ca.bctest.example.com/ca.bctest.example.com.key \
-C ./mymsp/tlsca.bctest.example.com/tlsca.bctest.example.com.pem -K ./mymsp/tlsca.bctest.example.com/tlsca.bctest.example.com.key \
-a ./mymsp/localmsp/admin@bctest.example.com/msp/admincerts/admin@bctest.example.com.pem -M

##########################################################################################
################################# FOR VEHICLE.EXAMPLE.COM ################################
##########################################################################################

# Self-signed CA Root Cert - ca.vehicle.example.com
./utils/mymsputils.sh selfsign -n ca.vehicle.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/CN=ca.vehicle.example.com" \
-o ./mymsp/ca.vehicle.example.com/

# Self-signed TLS CA Root Cert
./utils/mymsputils.sh selfsign -n tlsca.vehicle.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/CN=tlsca.vehicle.example.com" \
-o ./mymsp/tlsca.vehicle.example.com/

# msp admin@vehicle.example.com
./utils/mymsputils.sh msp -n admin@vehicle.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/OU=client/CN=admin@vehicle.example.com" \
-o ./mymsp/ -c ./mymsp/ca.vehicle.example.com/ca.vehicle.example.com.pem -k ./mymsp/ca.vehicle.example.com/ca.vehicle.example.com.key \
-C ./mymsp/tlsca.vehicle.example.com/tlsca.vehicle.example.com.pem -K ./mymsp/tlsca.vehicle.example.com/tlsca.vehicle.example.com.key

# msp peer0.vehicle.example.com
./utils/mymsputils.sh msp -n peer0.vehicle.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/OU=peer/CN=peer0.vehicle.example.com" \
-o ./mymsp/ -c ./mymsp/ca.vehicle.example.com/ca.vehicle.example.com.pem -k ./mymsp/ca.vehicle.example.com/ca.vehicle.example.com.key \
-C ./mymsp/tlsca.vehicle.example.com/tlsca.vehicle.example.com.pem -K ./mymsp/tlsca.vehicle.example.com/tlsca.vehicle.example.com.key \
-a ./mymsp/localmsp/admin@vehicle.example.com/msp/admincerts/admin@vehicle.example.com.pem -M -g

##########################################################################################
################################# FOR SHARING.EXAMPLE.COM ################################
##########################################################################################

# Self-signed CA Root Cert - ca.sharing.example.com
./utils/mymsputils.sh selfsign -n ca.sharing.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/CN=ca.sharing.example.com" \
-o ./mymsp/ca.sharing.example.com/

# Self-signed TLS CA Root Cert
./utils/mymsputils.sh selfsign -n tlsca.sharing.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/CN=tlsca.sharing.example.com" \
-o ./mymsp/tlsca.sharing.example.com/

# msp admin@sharing.example.com
./utils/mymsputils.sh msp -n admin@sharing.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/OU=client/CN=admin@sharing.example.com" \
-o ./mymsp/ -c ./mymsp/ca.sharing.example.com/ca.sharing.example.com.pem -k ./mymsp/ca.sharing.example.com/ca.sharing.example.com.key \
-C ./mymsp/tlsca.sharing.example.com/tlsca.sharing.example.com.pem -K ./mymsp/tlsca.sharing.example.com/tlsca.sharing.example.com.key

# msp peer0.sharing.example.com
./utils/mymsputils.sh msp -n peer0.sharing.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/OU=peer/CN=peer0.sharing.example.com" \
-o ./mymsp/ -c ./mymsp/ca.sharing.example.com/ca.sharing.example.com.pem -k ./mymsp/ca.sharing.example.com/ca.sharing.example.com.key \
-C ./mymsp/tlsca.sharing.example.com/tlsca.sharing.example.com.pem -K ./mymsp/tlsca.sharing.example.com/tlsca.sharing.example.com.key \
-a ./mymsp/localmsp/admin@sharing.example.com/msp/admincerts/admin@sharing.example.com.pem -M -g
