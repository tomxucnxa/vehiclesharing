// This is another chaincode based on Fabric tutorial.
// It will be deployed based on the example first-network.

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

const OBJECTTYPE_JSON = "objectType"
const OBJECTTYPE_VEHICLE = "VEHICLE"
const OBJECTTYPE_LEASE = "LEASE"

const PRIVATE_COLLECTION_LEASE = "leaseRecords"

func init() {
	log.SetPrefix("VehicleSharing: ")
	log.SetFlags(log.Ldate | log.Lmicroseconds | log.Lshortfile)
}

type VehicleSharing struct {
}

type Vehicle struct {
	ObjectType string  `json:"objectType"`
	CreateTime int64   `json:"createTime"`
	Id         string  `json:"id"`
	Brand      string  `json:"brand"`
	Price      float64 `json:"price"`
	OwnerId    string  `json:"ownerId"`
	Status     int32   `json:"status"`
	UserId     string  `json:"userId"`
}

type Lease struct {
	ObjectType string `json:"objectType"`
	CreateTime int64  `json:"createTime"`
	Id         string `json:"id"`
	VehicleId  string `json:"vehicleId"`
	UserId     string `json:"UserId"`
	BeginTime  int64  `json:"beginTime"`
	EndTime    int64  `json:"endTime"`
}

func (t *VehicleSharing) Init(stub shim.ChaincodeStubInterface) peer.Response {
	log.Printf("The chaincode VehicleSharing is instantiated.")
	return shim.Success(nil)
}

func (t *VehicleSharing) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()
	var res string
	var err error

	fn = strings.TrimSpace(fn)
	log.Printf("Invoke %s %v", fn, args)

	var FUNCMAP = map[string]func(shim.ChaincodeStubInterface, []string) (string, error){
		// Vehicle functions
		"createVehicle":         createVehicle,
		"findVehicle":           findVehicle,
		"deleteVehicle":         deleteVehicle,
		"updateVehiclePrice":    updateVehiclePrice,
		"updateVehicleDynPrice": updateVehicleDynPrice,
		"queryVehiclesByBrand":  queryVehiclesByBrand,
		"queryVehicles":         queryVehicles,
		"getVehicleHistory":     getVehicleHistory,
		"wronglyTxRandValue":    wronglyTxRandValue,
		// Lease functions
		"createLease": createLease,
		"findLease":   findLease}

	var ccAction = FUNCMAP[fn]
	if ccAction == nil {
		var errStr = fmt.Sprintf("Function %s doesn't exist.", fn)
		log.Printf(errStr)
		return shim.Error(errStr)
	}

	// TODO To handle the function if it doesn't exist.
	res, err = ccAction(stub, args)

	if err == nil {
		log.Printf("Invoke %s %s get succeed. Result: %s", fn, args, res)
		return shim.Success([]byte(res))
	} else {
		log.Printf("Invoke %s %s get failed. Reason: %s", fn, args, err.Error())
		return shim.Error(err.Error())
	}
}

func createVehicle(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	// Id, Brand is required currently.
	if len(args) < 2 {
		return "", fmt.Errorf("There is not enough 2 arguments in this function createVehicle.")
	}
	var id = strings.TrimSpace(args[0])
	var brand = strings.TrimSpace(args[1])

	var v = Vehicle{ObjectType: OBJECTTYPE_VEHICLE, Id: id, Brand: brand}
	return addVehicle(stub, &v)
}

func addVehicle(stub shim.ChaincodeStubInterface, v *Vehicle) (string, error) {
	var res []byte
	var err error
	var jByte []byte

	if v.Id == "" || v.Brand == "" {
		return "", fmt.Errorf("The id and brand cannot be blank.")
	}

	res, err = stub.GetState(v.Id)
	if err != nil {
		return "", err
	} else if res != nil {
		return "", fmt.Errorf("The vehicle %s has already existed.", v.Id)
	}

	jByte, err = json.Marshal(v)
	if err != nil {
		return "", err
	}
	err = stub.PutState(v.Id, jByte)
	if err != nil {
		return "", err
	}

	return v.Id, nil
}

// Find Vehicle by the state key (Id).
func findVehicle(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 argument in this function findVehicle.")
	}
	var id = strings.TrimSpace(args[0])
	if id == "" {
		return "", fmt.Errorf("The id cannot be blank.")
	}

	var res, err = stub.GetState(id)
	if err != nil {
		return "", fmt.Errorf("The vehicle %s doesn't exist.", id)
	}

	return string(res), nil
}

func deleteVehicle(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 argument in this function deleteVehicle.")
	}
	var id = strings.TrimSpace(args[0])
	if id == "" {
		return "", fmt.Errorf("The id cannot be blank.")
	}

	var err = stub.DelState(id)
	if err != nil {
		return "", err
	}

	return id, nil
}

func updateVehiclePrice(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	var res []byte
	var err error
	var v *Vehicle = new(Vehicle)
	var price float64
	var j []byte

	// Id, Price is required currently.
	if len(args) < 2 {
		return "", fmt.Errorf("There is not enough 2 arguments in this function updateVehiclePrice.")
	}
	var id = strings.TrimSpace(args[0])
	price, err = strconv.ParseFloat(args[1], 64)
	if err != nil {
		return "", err
	}

	res, err = stub.GetState(id)
	if err != nil {
		return "", err
	} else if res == nil {
		return "", fmt.Errorf("The vehicle %s does not exist.", id)
	}

	err = json.Unmarshal(res, v)
	if err != nil {
		return "", err
	}

	v.Price = price

	j, err = json.Marshal(v)
	if err != nil {
		return "", err
	}

	// Cannot use addVehicle.
	err = stub.PutState(v.Id, j)
	if err != nil {
		return "", err
	}

	return v.Id, nil
}

func updateVehicleDynPrice(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	var res []byte
	var err error
	var v *Vehicle = new(Vehicle)
	var j []byte

	// Id, Price is required currently.
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 arguments in this function updateVehicleDynPrice.")
	}
	var id = strings.TrimSpace(args[0])

	res, err = stub.GetState(id)
	if err != nil {
		return "", err
	} else if res == nil {
		return "", fmt.Errorf("The vehicle %s does not exist.", id)
	}

	err = json.Unmarshal(res, v)
	if err != nil {
		return "", err
	}

	// Update the price as original price * 2
	v.Price = v.Price * 2

	j, err = json.Marshal(v)
	if err != nil {
		return "", err
	}

	// Cannot use addVehicle.
	err = stub.PutState(v.Id, j)
	if err != nil {
		return "", err
	}

	return v.Id, nil
}

// The wronglyTxRandValue trying won't work, since the proposal response will be different on different chaincode env, for each execution.
// Error: could not assemble transaction: ProposalResponsePayloads do not match - proposal response: version:1 response:<status:200 payload:"R294287" >...
func wronglyTxRandValue(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	// Create a random value Vehicle.
	var brandChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	var r = rand.New(rand.NewSource(time.Now().UnixNano()))
	var id = "R" + strconv.FormatUint(r.Uint64(), 10)[0:6]
	var p = r.Intn(len(brandChars) - 2)
	var brand = brandChars[p : p+3]

	var v Vehicle = Vehicle{
		ObjectType: OBJECTTYPE_VEHICLE,
		Id:         id,
		Brand:      brand,
		Price:      r.Float64() * 1000.0}

	return addVehicle(stub, &v)
}

func queryVehiclesByBrand(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There should be at least one arg of queryVehiclesByBrand.")
	}
	// There should be only 1 arg for brand.
	var brand = strings.TrimSpace(args[0])
	if brand == "" {
		return "", fmt.Errorf("The brand cannot be blank.")
	}
	return queryVehicles(stub, []string{fmt.Sprintf(`{"selector":{"%s":"%s","brand":"%s"}}`, OBJECTTYPE_JSON, OBJECTTYPE_VEHICLE, brand)})
}

func queryVehicles(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is at least one query.")
	}
	var query = strings.TrimSpace(args[0])
	if query == "" {
		return "", fmt.Errorf("The query string cannot be blank.")
	}
	log.Printf(query)

	// There should be only 1 query string.
	var stateIterator shim.StateQueryIteratorInterface
	var err error

	stateIterator, err = stub.GetQueryResult(query)
	if err != nil {
		return "", err
	}
	defer stateIterator.Close()
	return joinKVList(stateIterator)
}

func joinKVList(stateIterator shim.StateQueryIteratorInterface) (string, error) {
	var resList []string
	for stateIterator.HasNext() {
		var kv, err = stateIterator.Next()
		if err != nil {
			return "", err
		}
		//resList = append(resList, fmt.Sprintf(`{"key":%s, "value":%s}`, kv.Key, string(kv.Value)))
		resList = append(resList, string(kv.Value))
	}
	return "[" + strings.Join(resList, ",") + "]", nil
}

func getVehicleHistory(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is at least one arg for getVehicleHistory.")
	}
	var historyIterator shim.HistoryQueryIteratorInterface
	var err error
	var id = strings.TrimSpace(args[0])
	if id == "" {
		return "", fmt.Errorf("The id cannot be blank.")
	}

	historyIterator, err = stub.GetHistoryForKey(id)
	if err != nil {
		return "", err
	}
	defer historyIterator.Close()
	return joinKMList(historyIterator)
}

func joinKMList(histIterator shim.HistoryQueryIteratorInterface) (string, error) {
	var resList []string
	var jByte []byte
	for histIterator.HasNext() {
		var km, err = histIterator.Next()
		if err != nil {
			return "", err
		}
		jByte, err = json.Marshal(map[string]interface{}{
			"TxId":      km.TxId,
			"Timestamp": km.Timestamp,
			"IsDelete":  km.IsDelete,
			"Value":     km.Value})
		if err != nil {
			return "", err
		}
		resList = append(resList, string(jByte))
	}
	return "[" + strings.Join(resList, ",") + "]", nil
}

func createLease(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	// Id, Brand is required currently.
	// Only for demo purpose, no any validation of existance of VehicleId, UserId.
	if len(args) < 3 {
		return "", fmt.Errorf("There is not enough 3 arguments in this function createLease.")
	}
	var id = strings.TrimSpace(args[0])
	var vehicleId = strings.TrimSpace(args[1])
	var userId = strings.TrimSpace(args[2])

	var l = Lease{ObjectType: OBJECTTYPE_LEASE, Id: id, VehicleId: vehicleId, UserId: userId}
	return addLease(stub, &l)
}

func addLease(stub shim.ChaincodeStubInterface, l *Lease) (string, error) {
	var res []byte
	var err error
	var jByte []byte

	if l.Id == "" || l.VehicleId == "" || l.UserId == "" {
		return "", fmt.Errorf("The id, vehicleId and userId cannot be blank.")
	}

	res, err = stub.GetState(l.Id)
	if err != nil {
		return "", err
	} else if res != nil {
		return "", fmt.Errorf("The lease %s has already existed.", l.Id)
	}

	jByte, err = json.Marshal(l)
	if err != nil {
		return "", err
	}

	err = stub.PutPrivateData(PRIVATE_COLLECTION_LEASE, l.Id, jByte)
	if err != nil {
		return "", err
	}

	return l.Id, nil
}

// Find Lease by the state key (Id).
func findLease(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("There is not enough 1 argument in this function findLease.")
	}
	var id = strings.TrimSpace(args[0])
	if id == "" {
		return "", fmt.Errorf("The id cannot be blank.")
	}

	var res, err = stub.GetPrivateData(PRIVATE_COLLECTION_LEASE, id)
	if err != nil {
		return "", fmt.Errorf("The lease %s doesn't exist.", id)
	}

	return string(res), nil
}

func main() {
	log.Printf("Begin to start the chaincode VehicleSharing")
	var err = shim.Start(new(VehicleSharing))
	if err != nil {
		log.Printf("Starting the chaincode VehicleSharing get failed.")
		log.Printf(err.Error())
	}
}
