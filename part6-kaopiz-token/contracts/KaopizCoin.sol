// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title KaopizCoin
 * @dev ERC20 Token với tính năng mint, burn và pause
 */
contract KaopizCoin is ERC20, ERC20Burnable, Ownable, Pausable {
    // Events
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 tỷ token
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10 ** 18; // 100 triệu token

    /**
     * @dev Constructor
     * @param initialOwner Địa chỉ owner ban đầu
     */
    constructor(
        address initialOwner
    ) ERC20("KaopizCoin", "KPC") Ownable(initialOwner) {
        // Mint initial supply cho owner
        _mint(initialOwner, INITIAL_SUPPLY);
        emit TokensMinted(initialOwner, INITIAL_SUPPLY, block.timestamp);
    }

    /**
     * @dev Mint token mới (chỉ owner)
     * @param to Địa chỉ nhận token
     * @param amount Số lượng token
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount, block.timestamp);
    }

    /**
     * @dev Burn token (bất kỳ ai có thể burn token của mình)
     * @param amount Số lượng token cần burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Burn token từ địa chỉ khác (cần approve trước)
     * @param account Địa chỉ cần burn token
     * @param amount Số lượng token
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount, block.timestamp);
    }

    /**
     * @dev Pause contract (chỉ owner)
     */
    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Unpause contract (chỉ owner)
     */
    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Override _update để thêm pausable logic
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Lấy thông tin chi tiết của token
     */
    function getTokenInfo()
        public
        view
        returns (
            string memory tokenName,
            string memory tokenSymbol,
            uint8 tokenDecimals,
            uint256 tokenTotalSupply,
            uint256 tokenMaxSupply,
            bool isPaused
        )
    {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            paused()
        );
    }
}
