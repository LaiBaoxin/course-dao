// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package vault

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// CourseVaultMetaData contains all meta data concerning the CourseVault contract.
var CourseVaultMetaData = &bind.MetaData{
	ABI: "[{\"type\":\"constructor\",\"inputs\":[{\"name\":\"_medalAddress\",\"type\":\"address\",\"internalType\":\"address\"}],\"stateMutability\":\"nonpayable\"},{\"type\":\"receive\",\"stateMutability\":\"payable\"},{\"type\":\"function\",\"name\":\"MEDAL\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"address\",\"internalType\":\"contractCourseMedal\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"createProposal\",\"inputs\":[{\"name\":\"_desc\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"_amount\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"execute\",\"inputs\":[{\"name\":\"_pid\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"function\",\"name\":\"hasVoted\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"\",\"type\":\"address\",\"internalType\":\"address\"}],\"outputs\":[{\"name\":\"\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"proposalCount\",\"inputs\":[],\"outputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"proposals\",\"inputs\":[{\"name\":\"\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[{\"name\":\"description\",\"type\":\"string\",\"internalType\":\"string\"},{\"name\":\"amount\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"snapshotBlock\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"votesFor\",\"type\":\"uint256\",\"internalType\":\"uint256\"},{\"name\":\"executed\",\"type\":\"bool\",\"internalType\":\"bool\"}],\"stateMutability\":\"view\"},{\"type\":\"function\",\"name\":\"vote\",\"inputs\":[{\"name\":\"_pid\",\"type\":\"uint256\",\"internalType\":\"uint256\"}],\"outputs\":[],\"stateMutability\":\"nonpayable\"},{\"type\":\"error\",\"name\":\"ReentrancyGuardReentrantCall\",\"inputs\":[]}]",
}

// CourseVaultABI is the input ABI used to generate the binding from.
// Deprecated: Use CourseVaultMetaData.ABI instead.
var CourseVaultABI = CourseVaultMetaData.ABI

// CourseVault is an auto generated Go binding around an Ethereum contract.
type CourseVault struct {
	CourseVaultCaller     // Read-only binding to the contract
	CourseVaultTransactor // Write-only binding to the contract
	CourseVaultFilterer   // Log filterer for contract events
}

// CourseVaultCaller is an auto generated read-only Go binding around an Ethereum contract.
type CourseVaultCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// CourseVaultTransactor is an auto generated write-only Go binding around an Ethereum contract.
type CourseVaultTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// CourseVaultFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type CourseVaultFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// CourseVaultSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type CourseVaultSession struct {
	Contract     *CourseVault      // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// CourseVaultCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type CourseVaultCallerSession struct {
	Contract *CourseVaultCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts      // Call options to use throughout this session
}

// CourseVaultTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type CourseVaultTransactorSession struct {
	Contract     *CourseVaultTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts      // Transaction auth options to use throughout this session
}

// CourseVaultRaw is an auto generated low-level Go binding around an Ethereum contract.
type CourseVaultRaw struct {
	Contract *CourseVault // Generic contract binding to access the raw methods on
}

// CourseVaultCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type CourseVaultCallerRaw struct {
	Contract *CourseVaultCaller // Generic read-only contract binding to access the raw methods on
}

// CourseVaultTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type CourseVaultTransactorRaw struct {
	Contract *CourseVaultTransactor // Generic write-only contract binding to access the raw methods on
}

// NewCourseVault creates a new instance of CourseVault, bound to a specific deployed contract.
func NewCourseVault(address common.Address, backend bind.ContractBackend) (*CourseVault, error) {
	contract, err := bindCourseVault(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &CourseVault{CourseVaultCaller: CourseVaultCaller{contract: contract}, CourseVaultTransactor: CourseVaultTransactor{contract: contract}, CourseVaultFilterer: CourseVaultFilterer{contract: contract}}, nil
}

// NewCourseVaultCaller creates a new read-only instance of CourseVault, bound to a specific deployed contract.
func NewCourseVaultCaller(address common.Address, caller bind.ContractCaller) (*CourseVaultCaller, error) {
	contract, err := bindCourseVault(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &CourseVaultCaller{contract: contract}, nil
}

// NewCourseVaultTransactor creates a new write-only instance of CourseVault, bound to a specific deployed contract.
func NewCourseVaultTransactor(address common.Address, transactor bind.ContractTransactor) (*CourseVaultTransactor, error) {
	contract, err := bindCourseVault(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &CourseVaultTransactor{contract: contract}, nil
}

// NewCourseVaultFilterer creates a new log filterer instance of CourseVault, bound to a specific deployed contract.
func NewCourseVaultFilterer(address common.Address, filterer bind.ContractFilterer) (*CourseVaultFilterer, error) {
	contract, err := bindCourseVault(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &CourseVaultFilterer{contract: contract}, nil
}

// bindCourseVault binds a generic wrapper to an already deployed contract.
func bindCourseVault(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := CourseVaultMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_CourseVault *CourseVaultRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _CourseVault.Contract.CourseVaultCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_CourseVault *CourseVaultRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _CourseVault.Contract.CourseVaultTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_CourseVault *CourseVaultRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _CourseVault.Contract.CourseVaultTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_CourseVault *CourseVaultCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _CourseVault.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_CourseVault *CourseVaultTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _CourseVault.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_CourseVault *CourseVaultTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _CourseVault.Contract.contract.Transact(opts, method, params...)
}

// MEDAL is a free data retrieval call binding the contract method 0x6c7cb15e.
//
// Solidity: function MEDAL() view returns(address)
func (_CourseVault *CourseVaultCaller) MEDAL(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _CourseVault.contract.Call(opts, &out, "MEDAL")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// MEDAL is a free data retrieval call binding the contract method 0x6c7cb15e.
//
// Solidity: function MEDAL() view returns(address)
func (_CourseVault *CourseVaultSession) MEDAL() (common.Address, error) {
	return _CourseVault.Contract.MEDAL(&_CourseVault.CallOpts)
}

// MEDAL is a free data retrieval call binding the contract method 0x6c7cb15e.
//
// Solidity: function MEDAL() view returns(address)
func (_CourseVault *CourseVaultCallerSession) MEDAL() (common.Address, error) {
	return _CourseVault.Contract.MEDAL(&_CourseVault.CallOpts)
}

// HasVoted is a free data retrieval call binding the contract method 0x43859632.
//
// Solidity: function hasVoted(uint256 , address ) view returns(bool)
func (_CourseVault *CourseVaultCaller) HasVoted(opts *bind.CallOpts, arg0 *big.Int, arg1 common.Address) (bool, error) {
	var out []interface{}
	err := _CourseVault.contract.Call(opts, &out, "hasVoted", arg0, arg1)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// HasVoted is a free data retrieval call binding the contract method 0x43859632.
//
// Solidity: function hasVoted(uint256 , address ) view returns(bool)
func (_CourseVault *CourseVaultSession) HasVoted(arg0 *big.Int, arg1 common.Address) (bool, error) {
	return _CourseVault.Contract.HasVoted(&_CourseVault.CallOpts, arg0, arg1)
}

// HasVoted is a free data retrieval call binding the contract method 0x43859632.
//
// Solidity: function hasVoted(uint256 , address ) view returns(bool)
func (_CourseVault *CourseVaultCallerSession) HasVoted(arg0 *big.Int, arg1 common.Address) (bool, error) {
	return _CourseVault.Contract.HasVoted(&_CourseVault.CallOpts, arg0, arg1)
}

// ProposalCount is a free data retrieval call binding the contract method 0xda35c664.
//
// Solidity: function proposalCount() view returns(uint256)
func (_CourseVault *CourseVaultCaller) ProposalCount(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _CourseVault.contract.Call(opts, &out, "proposalCount")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// ProposalCount is a free data retrieval call binding the contract method 0xda35c664.
//
// Solidity: function proposalCount() view returns(uint256)
func (_CourseVault *CourseVaultSession) ProposalCount() (*big.Int, error) {
	return _CourseVault.Contract.ProposalCount(&_CourseVault.CallOpts)
}

// ProposalCount is a free data retrieval call binding the contract method 0xda35c664.
//
// Solidity: function proposalCount() view returns(uint256)
func (_CourseVault *CourseVaultCallerSession) ProposalCount() (*big.Int, error) {
	return _CourseVault.Contract.ProposalCount(&_CourseVault.CallOpts)
}

// Proposals is a free data retrieval call binding the contract method 0x013cf08b.
//
// Solidity: function proposals(uint256 ) view returns(string description, uint256 amount, uint256 snapshotBlock, uint256 votesFor, bool executed)
func (_CourseVault *CourseVaultCaller) Proposals(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Description   string
	Amount        *big.Int
	SnapshotBlock *big.Int
	VotesFor      *big.Int
	Executed      bool
}, error) {
	var out []interface{}
	err := _CourseVault.contract.Call(opts, &out, "proposals", arg0)

	outstruct := new(struct {
		Description   string
		Amount        *big.Int
		SnapshotBlock *big.Int
		VotesFor      *big.Int
		Executed      bool
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Description = *abi.ConvertType(out[0], new(string)).(*string)
	outstruct.Amount = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	outstruct.SnapshotBlock = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)
	outstruct.VotesFor = *abi.ConvertType(out[3], new(*big.Int)).(**big.Int)
	outstruct.Executed = *abi.ConvertType(out[4], new(bool)).(*bool)

	return *outstruct, err

}

// Proposals is a free data retrieval call binding the contract method 0x013cf08b.
//
// Solidity: function proposals(uint256 ) view returns(string description, uint256 amount, uint256 snapshotBlock, uint256 votesFor, bool executed)
func (_CourseVault *CourseVaultSession) Proposals(arg0 *big.Int) (struct {
	Description   string
	Amount        *big.Int
	SnapshotBlock *big.Int
	VotesFor      *big.Int
	Executed      bool
}, error) {
	return _CourseVault.Contract.Proposals(&_CourseVault.CallOpts, arg0)
}

// Proposals is a free data retrieval call binding the contract method 0x013cf08b.
//
// Solidity: function proposals(uint256 ) view returns(string description, uint256 amount, uint256 snapshotBlock, uint256 votesFor, bool executed)
func (_CourseVault *CourseVaultCallerSession) Proposals(arg0 *big.Int) (struct {
	Description   string
	Amount        *big.Int
	SnapshotBlock *big.Int
	VotesFor      *big.Int
	Executed      bool
}, error) {
	return _CourseVault.Contract.Proposals(&_CourseVault.CallOpts, arg0)
}

// CreateProposal is a paid mutator transaction binding the contract method 0x35facf78.
//
// Solidity: function createProposal(string _desc, uint256 _amount) returns()
func (_CourseVault *CourseVaultTransactor) CreateProposal(opts *bind.TransactOpts, _desc string, _amount *big.Int) (*types.Transaction, error) {
	return _CourseVault.contract.Transact(opts, "createProposal", _desc, _amount)
}

// CreateProposal is a paid mutator transaction binding the contract method 0x35facf78.
//
// Solidity: function createProposal(string _desc, uint256 _amount) returns()
func (_CourseVault *CourseVaultSession) CreateProposal(_desc string, _amount *big.Int) (*types.Transaction, error) {
	return _CourseVault.Contract.CreateProposal(&_CourseVault.TransactOpts, _desc, _amount)
}

// CreateProposal is a paid mutator transaction binding the contract method 0x35facf78.
//
// Solidity: function createProposal(string _desc, uint256 _amount) returns()
func (_CourseVault *CourseVaultTransactorSession) CreateProposal(_desc string, _amount *big.Int) (*types.Transaction, error) {
	return _CourseVault.Contract.CreateProposal(&_CourseVault.TransactOpts, _desc, _amount)
}

// Execute is a paid mutator transaction binding the contract method 0xfe0d94c1.
//
// Solidity: function execute(uint256 _pid) returns()
func (_CourseVault *CourseVaultTransactor) Execute(opts *bind.TransactOpts, _pid *big.Int) (*types.Transaction, error) {
	return _CourseVault.contract.Transact(opts, "execute", _pid)
}

// Execute is a paid mutator transaction binding the contract method 0xfe0d94c1.
//
// Solidity: function execute(uint256 _pid) returns()
func (_CourseVault *CourseVaultSession) Execute(_pid *big.Int) (*types.Transaction, error) {
	return _CourseVault.Contract.Execute(&_CourseVault.TransactOpts, _pid)
}

// Execute is a paid mutator transaction binding the contract method 0xfe0d94c1.
//
// Solidity: function execute(uint256 _pid) returns()
func (_CourseVault *CourseVaultTransactorSession) Execute(_pid *big.Int) (*types.Transaction, error) {
	return _CourseVault.Contract.Execute(&_CourseVault.TransactOpts, _pid)
}

// Vote is a paid mutator transaction binding the contract method 0x0121b93f.
//
// Solidity: function vote(uint256 _pid) returns()
func (_CourseVault *CourseVaultTransactor) Vote(opts *bind.TransactOpts, _pid *big.Int) (*types.Transaction, error) {
	return _CourseVault.contract.Transact(opts, "vote", _pid)
}

// Vote is a paid mutator transaction binding the contract method 0x0121b93f.
//
// Solidity: function vote(uint256 _pid) returns()
func (_CourseVault *CourseVaultSession) Vote(_pid *big.Int) (*types.Transaction, error) {
	return _CourseVault.Contract.Vote(&_CourseVault.TransactOpts, _pid)
}

// Vote is a paid mutator transaction binding the contract method 0x0121b93f.
//
// Solidity: function vote(uint256 _pid) returns()
func (_CourseVault *CourseVaultTransactorSession) Vote(_pid *big.Int) (*types.Transaction, error) {
	return _CourseVault.Contract.Vote(&_CourseVault.TransactOpts, _pid)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_CourseVault *CourseVaultTransactor) Receive(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _CourseVault.contract.RawTransact(opts, nil) // calldata is disallowed for receive function
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_CourseVault *CourseVaultSession) Receive() (*types.Transaction, error) {
	return _CourseVault.Contract.Receive(&_CourseVault.TransactOpts)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_CourseVault *CourseVaultTransactorSession) Receive() (*types.Transaction, error) {
	return _CourseVault.Contract.Receive(&_CourseVault.TransactOpts)
}
