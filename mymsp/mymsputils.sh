########################################################################3

SUFFIX_KEY=".key"
SUFFIX_CSR=".csr"
SUFFIX_CRT=".pem"
LOCALMSP_DIR="localmsp"
ORGMSP_DIR="orgmsp"

# Print the usage message
function printHelp() {
    echo "To generate certificates."
    echo "Usage: "
    echo "  mymsputils.sh <command> <options>"
    echo "    <command> - one of 'selfsign', 'sign'"
    echo "      - 'selfsign' - generate a self-signed certificate"
    echo "      - 'sign' - sign a certificate by another CA certificate"
    echo "    -n <cert_name> - the certificate and key file name to be created"
    echo "    -s <subject_field_values> - /C=c_str/ST=st_str/L=l_str/O=o_str/OU=ou_str/CN=cn_str"
    echo "    -o <save_to_dir> - the directory where certificate file and key file to be saved to"
    echo "    -c <ca_cert_file> - the CA certificate file, required for 'sign|msp'"
    echo "    -k <ca_key_file> - the CA key file, required for 'sign|msp'"
    echo "    -a <admin_cert_file> - the admin cert file of this organization, required for 'msp'"
    echo "    -C <tls_ca_cert_file> - the TLS CA certificate file, required for 'msp'"
    echo "    -K <tls_ca_key_file> - the TLS CA key file, required for 'msp'"
    echo "    -M - if create organization msp folder for public"
    echo "    -g - if create node OU enable config.yaml"
    echo "  mymsputils.sh -h (print this message)"           
}

function getSerial() {
    SERIAL="0X$(cat /dev/urandom | tr -dc 'A-Fa-f0-9' | fold -w 40 | head -n 1)"
}

function selfSign() {
    # Get 3 args from command
    _NAME="$1"
    _SUBJ="$2"
    _OUT="$3"
    
    mkdir -p "${_OUT}"

    _KEYFILE="$(realpath -sm "${_OUT}/${_NAME}${SUFFIX_KEY}")"
    _KEYFILETEMP="${_KEYFILE}__"
    _CERTFILE="$(realpath -sm "${_OUT}/${_NAME}${SUFFIX_CRT}")"
    
    # Generate Private key
    openssl ecparam -genkey -name prime256v1 -out "${_KEYFILETEMP}" -noout
    # openssl pkey -in ${_KEYFILE} -out ${_KEYFILE}
    openssl pkcs8 -topk8 -nocrypt -in "${_KEYFILETEMP}" -out "${_KEYFILE}"
    rm "${_KEYFILETEMP}"

    # Request Root Cert
    getSerial
    openssl req -x509 -new -SHA256 -nodes -key "${_KEYFILE}" -days 3650 -out "${_CERTFILE}" -set_serial ${SERIAL} -subj "$_SUBJ"
    
    # Show Cert
    #openssl x509 -in ca.crt -text -noout

    echo "Key generated: $(tput setaf 2)${_KEYFILE}$(tput sgr0)"
    echo "Cert generated: $(tput setaf 2)${_CERTFILE}$(tput sgr0)"
}

function sign() {
    # Get 5 args from command
    _NAME="$1"
    _SUBJ="$2"
    _OUT="$3"
    _CA="$4"
    _CAKEY="$5"
    # _FILEPREFIX arg is not available for command, it is only for function.
    _FILEPREFIX="$6"
    if [ ! -z "${_FILEPREFIX}" ]
    then
        _FILEPREFIX="${_FILEPREFIX}-"
    fi

    mkdir -p "${_OUT}"

    _KEYFILE="$(realpath -sm "${_OUT}/${_FILEPREFIX}${_NAME}${SUFFIX_KEY}")"
    _KEYFILETEMP="${_KEYFILE}__"
    _CSRFILE="$(realpath -sm "${_OUT}/${_FILEPREFIX}${_NAME}${SUFFIX_CSR}")"
    _CERTFILE="$(realpath -sm "${_OUT}/${_FILEPREFIX}${_NAME}${SUFFIX_CRT}")"
    
    # Generate Private key
    openssl ecparam -genkey -name prime256v1 -out "${_KEYFILETEMP}" -noout
    openssl pkcs8 -topk8 -nocrypt -in "${_KEYFILETEMP}" -out "${_KEYFILE}"
    rm "${_KEYFILETEMP}"

    getSerial
    openssl req -new -SHA256 -key "${_KEYFILE}" -nodes -out "${_CSRFILE}" -subj "$_SUBJ"
    openssl x509 -req -SHA256 -days 3650 -in "${_CSRFILE}" -CA "${_CA}" -CAkey "${_CAKEY}" -set_serial ${SERIAL} -out "${_CERTFILE}"
    rm "${_CSRFILE}"

    echo "Key generated: $(tput setaf 2)${_KEYFILE}$(tput sgr0)"
    echo "Cert generated: $(tput setaf 2)${_CERTFILE}$(tput sgr0)"
}

function mspcfg() {    
    _CA_FILE_NAME="$1"
    _CFG_FILE_DIR="$2"
    _CFG_FILE="$(realpath -sm "${_CFG_FILE_DIR}/config.yaml")"

    rm -f "${_CFG_FILE}"
    echo "NodeOUs:" >> "${_CFG_FILE}"
    echo "    Enable: true" >> "${_CFG_FILE}"
    echo "    ClientOUIdentifier:" >> "${_CFG_FILE}"
    echo "        Certificate: cacerts/${_CA_FILE_NAME}" >> "${_CFG_FILE}"
    echo "        OrganizationalUnitIdentifier: client" >> "${_CFG_FILE}"
    echo "    PeerOUIdentifier:" >> "${_CFG_FILE}"
    echo "        Certificate: cacerts/${_CA_FILE_NAME}" >> "${_CFG_FILE}"
    echo "        OrganizationalUnitIdentifier: peer" >> "${_CFG_FILE}"
}

function msp() {
    # Get 8 args from command
    _NAME="$1"
    _SUBJ="$2"
    _OUT="$3"
    _CA="$4"
    _CAKEY="$5"
    _ADMIN="$6"
    _TLSCA="$7"
    _TLSCAKEY="$8"
    _USEORGMSP="$9"
    _WITHCONFIG="${10}"
    # _OUT, _CA conflict in sign function
    _OUT__="${_OUT}"
    _CA__="${_CA}"

    #echo "Begin msp..."

    ######## Local MSP ########
    _LOCALMSP_DIR="$(realpath -sm "${_OUT}/${LOCALMSP_DIR}/${_NAME}/msp")"    
    _KEY_DIR="$(realpath -sm "${_LOCALMSP_DIR}/keystore/")"
    _CERT_DIR="$(realpath -sm "${_LOCALMSP_DIR}/signcerts/")"
    _ADMINCERT_DIR="$(realpath -sm "${_LOCALMSP_DIR}/admincerts/")"
    _TLSCACERT_DIR="$(realpath -sm "${_LOCALMSP_DIR}/tlscacerts/")"
    _CACERT_DIR="$(realpath -sm "${_LOCALMSP_DIR}/cacerts/")"
    mkdir -p "${_KEY_DIR}"
    mkdir -p "${_CERT_DIR}"
    mkdir -p "${_ADMINCERT_DIR}"
    mkdir -p "${_TLSCACERT_DIR}"
    mkdir -p "${_CACERT_DIR}"
    
    # Sign cert
    sign "${_NAME}" "${_SUBJ}" "${_CERT_DIR}" "${_CA}" "${_CAKEY}"
    # _KEYFILE generated via sign command
    # _CERTFILE generated via sign command
    
    cp "${_CA}" "${_CACERT_DIR}"    
    cp "${_TLSCA}" "${_TLSCACERT_DIR}"
    mv "${_KEYFILE}" "${_KEY_DIR}"

    if [ "${_WITHCONFIG}" == "true" ]
    then
        mspcfg "$(basename "${_CA}")" "${_LOCALMSP_DIR}"
    fi

    if [ -e "${_ADMIN}" ]
    then
        cp "${_ADMIN}" "${_ADMINCERT_DIR}"
    else
        cp "${_CERTFILE}" "${_ADMINCERT_DIR}"
    fi

    ######## TLS ########
    _LOCALTLS_DIR="$(realpath -sm "${_OUT__}/${LOCALMSP_DIR}/${_NAME}/tls")"
    mkdir -p "${_LOCALTLS_DIR}"       
    sign "${_NAME}" "${_SUBJ}" "${_LOCALTLS_DIR}" "${_TLSCA}" "${_TLSCAKEY}" "tls"
    cp "${_TLSCA}" "${_LOCALTLS_DIR}"    

    ######## ORGMSP #########
    if [ "${_USEORGMSP}" == "true" ]
    then
        _ORGMSP_DIR="$(realpath -sm "${_OUT__}/${ORGMSP_DIR}/${_NAME}/msp")"
        mkdir -p "${_ORGMSP_DIR}" 
        cp -r "${_LOCALMSP_DIR}/admincerts/" "${_ORGMSP_DIR}/"
        cp -r "${_LOCALMSP_DIR}/cacerts/" "${_ORGMSP_DIR}/"
        cp -r "${_LOCALMSP_DIR}/tlscacerts/" "${_ORGMSP_DIR}/"

        if [ "${_WITHCONFIG}" == "true" ]
        then
            mspcfg "$(basename "${_CA__}")" "${_ORGMSP_DIR}"
        fi
    fi
}

function valiArg() {
    _VAL=$1
    _VARN=$2
    if [ -z "$_VAL" ]; then
        echo "$_VARN is blank"
        exit 1
    fi
}

COMMAND=$1
shift

if [ "${COMMAND}" == "-h" ]; then
    printHelp
    exit 1
fi

while getopts "n:s:o:c:k:a:C:K:Mgh" arg ; do
    case $arg in
        n)
            NAME="$OPTARG"
            ;;
        s)
            SUBJ="$OPTARG"
            ;;
        o)
            OUT="$OPTARG"
            ;;
        c)
            CA="$OPTARG"
            ;;
        k)
            CAKEY="$OPTARG"
            ;;
        a)
            ADMIN="$OPTARG"
            ;;
        C)
            TLSCA="$OPTARG"
            ;;
        K)
            TLSCAKEY="$OPTARG"
            ;;
        M)
            USEORGMSP="true"
            ;;
        g)
            WITHCONFIG="true"
            ;;
        h)
            printHelp
            exit 1
            ;;
    esac
done

if [ "${COMMAND}" == "selfsign" ]
then
    valiArg "$NAME" -n
    valiArg "$SUBJ" -s
    valiArg "$OUT" -o
    selfSign "$NAME" "$SUBJ" "$OUT"
elif [ "${COMMAND}" == "sign" ]
then
    valiArg "$NAME" -n
    valiArg "$SUBJ" -s
    valiArg "$OUT" -o
    valiArg "$CA" -c
    valiArg "$CAKEY" -k
    sign "$NAME" "$SUBJ" "$OUT" "$CA" "$CAKEY"
elif [ "${COMMAND}" == "msp" ]
then
    valiArg "$NAME" -n
    valiArg "$SUBJ" -s
    valiArg "$OUT" -o
    valiArg "$CA" -c
    valiArg "$CAKEY" -k
    #valiArg "$ADMIN" -a
    valiArg "$TLSCA" -C
    valiArg "$TLSCAKEY" -K
    msp "$NAME" "$SUBJ" "$OUT" "$CA" "$CAKEY" "$ADMIN" "$TLSCA" "$TLSCAKEY" "$USEORGMSP" "$WITHCONFIG"
else
    printHelp
    exit 1
fi
