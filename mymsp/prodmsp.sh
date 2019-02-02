##########################################################################################
echo "This script should NOT be executed wholely."
echo "It only includes some individual commands for msp."
#exit 1
##########################################################################################

##########################################################################################
################################# FOR BCTEST.EXAMPLE.COM #################################
##########################################################################################

# Self-signed CA Root Cert - ca.bctest.example.com
./mymsputils.sh selfsign -n ca.bctest.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=ca.bctest.example.com" \
-o ./ca.bctest.example.com/

# Self-signed TLS CA Root Cert
./mymsputils.sh selfsign -n tlsca.bctest.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=tlsca.bctest.example.com" \
-o ./tlsca.bctest.example.com/

# msp admin@bctest.example.com
./mymsputils.sh msp -n admin@bctest.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=admin@bctest.example.com" \
-o ./ -c ./ca.bctest.example.com/ca.bctest.example.com.pem -k ./ca.bctest.example.com/ca.bctest.example.com.key \
-C ./tlsca.bctest.example.com/tlsca.bctest.example.com.pem -K ./tlsca.bctest.example.com/tlsca.bctest.example.com.key

# msp orderer.bctest.example.com
./mymsputils.sh msp -n orderer.bctest.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=Blockchain Test/CN=orderer.bctest.example.com" \
-o ./ -c ./ca.bctest.example.com/ca.bctest.example.com.pem -k ./ca.bctest.example.com/ca.bctest.example.com.key \
-C ./tlsca.bctest.example.com/tlsca.bctest.example.com.pem -K ./tlsca.bctest.example.com/tlsca.bctest.example.com.key \
-a ./localmsp/admin@bctest.example.com/msp/admincerts/admin@bctest.example.com.pem -M

##########################################################################################
################################# FOR VEHICLE.EXAMPLE.COM ################################
##########################################################################################

# Self-signed CA Root Cert - ca.vehicle.example.com
./mymsputils.sh selfsign -n ca.vehicle.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/CN=ca.vehicle.example.com" \
-o ./ca.vehicle.example.com/

# Self-signed TLS CA Root Cert
./mymsputils.sh selfsign -n tlsca.vehicle.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/CN=tlsca.vehicle.example.com" \
-o ./tlsca.vehicle.example.com/

# msp admin@vehicle.example.com
./mymsputils.sh msp -n admin@vehicle.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/OU=client/CN=admin@vehicle.example.com" \
-o ./ -c ./ca.vehicle.example.com/ca.vehicle.example.com.pem -k ./ca.vehicle.example.com/ca.vehicle.example.com.key \
-C ./tlsca.vehicle.example.com/tlsca.vehicle.example.com.pem -K ./tlsca.vehicle.example.com/tlsca.vehicle.example.com.key

# msp peer0.vehicle.example.com
./mymsputils.sh msp -n peer0.vehicle.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Vehicle Company/OU=peer/CN=peer0.vehicle.example.com" \
-o ./ -c ./ca.vehicle.example.com/ca.vehicle.example.com.pem -k ./ca.vehicle.example.com/ca.vehicle.example.com.key \
-C ./tlsca.vehicle.example.com/tlsca.vehicle.example.com.pem -K ./tlsca.vehicle.example.com/tlsca.vehicle.example.com.key \
-a ./localmsp/admin@vehicle.example.com/msp/admincerts/admin@vehicle.example.com.pem -M -g

##########################################################################################
################################# FOR SHARING.EXAMPLE.COM ################################
##########################################################################################

# Self-signed CA Root Cert - ca.sharing.example.com
./mymsputils.sh selfsign -n ca.sharing.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/CN=ca.sharing.example.com" \
-o ./ca.sharing.example.com/

# Self-signed TLS CA Root Cert
./mymsputils.sh selfsign -n tlsca.sharing.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/CN=tlsca.sharing.example.com" \
-o ./tlsca.sharing.example.com/

# msp admin@sharing.example.com
./mymsputils.sh msp -n admin@sharing.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/OU=client/CN=admin@sharing.example.com" \
-o ./ -c ./ca.sharing.example.com/ca.sharing.example.com.pem -k ./ca.sharing.example.com/ca.sharing.example.com.key \
-C ./tlsca.sharing.example.com/tlsca.sharing.example.com.pem -K ./tlsca.sharing.example.com/tlsca.sharing.example.com.key

# msp peer0.sharing.example.com
./mymsputils.sh msp -n peer0.sharing.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A Sharing Company/OU=peer/CN=peer0.sharing.example.com" \
-o ./ -c ./ca.sharing.example.com/ca.sharing.example.com.pem -k ./ca.sharing.example.com/ca.sharing.example.com.key \
-C ./tlsca.sharing.example.com/tlsca.sharing.example.com.pem -K ./tlsca.sharing.example.com/tlsca.sharing.example.com.key \
-a ./localmsp/admin@sharing.example.com/msp/admincerts/admin@sharing.example.com.pem -M -g
