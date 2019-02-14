##########################################################################################
echo "This script will generate additional OnlinePay MSP materials under ./mymsp folder."
##########################################################################################

##########################################################################################
################################ FOR ONLINEPAY.EXAMPLE.COM ###############################
##########################################################################################

# Self-signed CA Root Cert - ca.onlinepay.example.com
./utils/mymsputils.sh selfsign -n ca.onlinepay.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A OnlinePay Company/CN=ca.onlinepay.example.com" \
-o ./mymsp/ca.onlinepay.example.com/

# Self-signed TLS CA Root Cert
./utils/mymsputils.sh selfsign -n tlsca.onlinepay.example.com \
-s "/C=CN/ST=Shaan Xi/L=Xi An/O=A OnlinePay Company/CN=tlsca.onlinepay.example.com" \
-o ./mymsp/tlsca.onlinepay.example.com/

# msp admin@onlinepay.example.com
./utils/mymsputils.sh msp -n admin@onlinepay.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A OnlinePay Company/OU=client/CN=admin@onlinepay.example.com" \
-o ./mymsp/ -c ./mymsp/ca.onlinepay.example.com/ca.onlinepay.example.com.pem -k ./mymsp/ca.onlinepay.example.com/ca.onlinepay.example.com.key \
-C ./mymsp/tlsca.onlinepay.example.com/tlsca.onlinepay.example.com.pem -K ./mymsp/tlsca.onlinepay.example.com/tlsca.onlinepay.example.com.key

# msp peer0.onlinepay.example.com
./utils/mymsputils.sh msp -n peer0.onlinepay.example.com -s "/C=CN/ST=Shaan Xi/L=Xi An/O=A OnlinePay Company/OU=peer/CN=peer0.onlinepay.example.com" \
-o ./mymsp/ -c ./mymsp/ca.onlinepay.example.com/ca.onlinepay.example.com.pem -k ./mymsp/ca.onlinepay.example.com/ca.onlinepay.example.com.key \
-C ./mymsp/tlsca.onlinepay.example.com/tlsca.onlinepay.example.com.pem -K ./mymsp/tlsca.onlinepay.example.com/tlsca.onlinepay.example.com.key \
-a ./mymsp/localmsp/admin@onlinepay.example.com/msp/admincerts/admin@onlinepay.example.com.pem -M -g
