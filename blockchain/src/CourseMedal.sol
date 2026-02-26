// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Votes} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CourseMedal is ERC721, EIP712, ERC721Votes, Ownable {
    uint256 private _nextTokenId;

    constructor() 
        ERC721("CourseMedal", "CM") 
        EIP712("CourseMedal", "1") 
        Ownable(msg.sender) 
    {}

    // 老师为学生铸造勋章。
    // 在 DAO 逻辑中，铸造时必须同时执行 _delegate，否则学生没有初始投票权。
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _delegate(to, to); // 💡自动授权自己，开启投票权快照
    }

    // --- 重写冲突函数 ---
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Votes) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Votes) {
        super._increaseBalance(account, value);
    }
}