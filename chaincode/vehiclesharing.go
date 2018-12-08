// This is a simple testing chaincode based on Fabric tutorial.
// Steps to deploy this chaincode by chaincode dev env.
// ######## On host
// # Clear the env
// docker kill $(docker ps -q)
// docker rm $(docker ps -aq)
// docker rmi $(docker images dev-* -q)
// # Copy the file under fabric/fabric-samples/chaincode/vehiclesharing, and build it for validation
// cd vehiclesharing
// go get -u github.com/hyperledger/fabric/core/chaincode/shim
// go build
// # If go build gets failed, maybe need to run
// # apt install build-essential
// ######## Terminal 1
// cd chaincode-docker-devmode
// docker-compose -f docker-compose-simple.yaml up
// ######## Terminal 2
// docker exec -it chaincode bash
// cd vehiclesharing
// # Start the chaincode as myvs:0
// CORE_PEER_ADDRESS=peer:7052 CORE_CHAINCODE_ID_NAME=myvs:0 ./vehiclesharing
// ######## Terminal 3
// docker exec -it cli bash
// peer chaincode install -p chaincodedev/chaincode/vehiclesharing -n myvs -v 0
// peer chaincode instantiate -n myvs -v 0 -c '{"Args":[]}' -C myc
// peer chaincode invoke -n myvs -c '{"Args":["set", "Tom", "Mustang"]}' -C myc
// peer chaincode invoke -n myvs -c '{"Args":["set", "Jack", "BMW"]}' -C myc
// peer chaincode query -n myvs -c '{"Args":["get","Tom"]}' -C myc
// peer chaincode query -n myvs -c '{"Args":["get","Jack"]}' -C myc
// peer chaincode list --instantiated -C myc

package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

func init() {
	log.SetPrefix("VehicleSharing: ")
	log.SetFlags(log.Ldate | log.Lmicroseconds | log.Lshortfile)
}

type VehicleSharing struct {
}

func (t *VehicleSharing) Init(stub shim.ChaincodeStubInterface) peer.Response {
	log.Printf("The chaincode VehicleSharing is instantiated.")
	return shim.Success(nil)
}

func (t *VehicleSharing) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()
	var res string
	var err error

	if fn == "set" {
		res, err = set(stub, args)
	} else if fn == "get" {
		res, err = get(stub, args)
	} else {
		var err = fmt.Sprintf("Function '%s' must be set|get.", fn)
		log.Printf(err)
		return shim.Error(err)
	}

	if err == nil {
		log.Printf("Invoke %s %s get succeed. Result: %s", fn, args, res)
		return shim.Success([]byte(res))
	} else {
		log.Printf("Invoke %s %s get failed.", fn, args)
		return shim.Error(err.Error())
	}
}

func set(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 2 {
		return "", fmt.Errorf("There is not enough 2 arguments in set function.")
	} else if err := stub.PutState(args[0], []byte(strings.TrimSpace(args[1]))); err == nil {
		return args[0], nil
	} else {
		return "", err
	}
}

func get(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 argument in get method.")
	} else if value, err := stub.GetState(args[0]); err == nil {
		return string(value), nil
	} else {
		return "", err
	}
}

func main() {
	log.Printf("Begin to start the chaincode VehicleSharing")
	if err := shim.Start(new(VehicleSharing)); err != nil {
		log.Printf("Starting the chaincode VehicleSharing get failed.")
	}
}
