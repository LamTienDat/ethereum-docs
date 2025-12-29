// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleERC20
 * @dev Simple ERC20 smart contract for learning about transfer, approve, transferFrom
 * 
 * Purpose: Educational - Illustrates basic concepts of ERC20
 * Not for production use!
 */
contract SimpleERC20 {
    // ============ State Variables ============
    
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    // Mapping stores balance of each address
    mapping(address => uint256) public balanceOf;
    
    // Mapping stores allowance: owner => spender => amount
    // allowance[owner][spender] = amount that spender is allowed to spend from owner
    mapping(address => mapping(address => uint256)) public allowance;
    
    // ============ Events ============
    
    /**
     * @dev Emitted when transfer is successful
     * @param from Sender address
     * @param to Recipient address
     * @param value Amount of tokens
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /**
     * @dev Emitted when approve is successful
     * @param owner Token owner
     * @param spender Address allowed to spend
     * @param value Amount allowed to spend
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // ============ Constructor ============
    
    /**
     * @dev Initialize token with basic information
     * @param _name Token name (e.g., "TL Coin")
     * @param _symbol Symbol (e.g., "TLC")
     * @param _decimals Number of decimals (usually 18)
     * @param _initialSupply Initial token supply (will be minted to deployer)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        
        // Mint entire supply to deployer
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
        
        emit Transfer(address(0), msg.sender, _initialSupply);
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Transfer tokens from msg.sender to another address
     * @param to Recipient address
     * @param amount Amount of tokens
     * @return success True if successful
     * 
     * Flow:
     * 1. Check msg.sender balance
     * 2. Deduct tokens from msg.sender
     * 3. Add tokens to recipient
     * 4. Emit Transfer event
     */
    function transfer(address to, uint256 amount) public returns (bool success) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        // Checks-Effects-Interactions pattern
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Allow spender to spend tokens from msg.sender
     * @param spender Address allowed to spend
     * @param amount Amount of tokens allowed to spend
     * @return success True if successful
     * 
     * Use case:
     * - User approves DEX contract
     * - User approves payment gateway
     * - User approves staking contract
     * 
     * ⚠️ Note: Should set allowance to 0 before setting new value
     * to avoid front-running attack
     */
    function approve(address spender, uint256 amount) public returns (bool success) {
        require(spender != address(0), "Cannot approve zero address");
        
        allowance[msg.sender][spender] = amount;
        
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Transfer tokens from one address to another
     * Only works if msg.sender has been approved
     * @param from Sender address (has approved msg.sender)
     * @param to Recipient address
     * @param amount Amount of tokens
     * @return success True if successful
     * 
     * Flow:
     * 1. Check allowance[from][msg.sender] >= amount
     * 2. Check balanceOf[from] >= amount
     * 3. Deduct allowance
     * 4. Deduct tokens from sender
     * 5. Add tokens to recipient
     * 6. Emit Transfer event
     * 
     * Use case:
     * - DEX contract withdraws tokens from user for swap
     * - Payment gateway automatically deducts funds
     * - Staking contract takes tokens to stake
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool success) {
        require(from != address(0), "Cannot transfer from zero address");
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        // Checks-Effects-Interactions pattern
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ============ Helper Functions ============
    
    /**
     * @dev Mint additional tokens (for demo only, production should have access control)
     * @param to Address to receive new tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public {
        require(to != address(0), "Cannot mint to zero address");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @dev Burn tokens from msg.sender
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance to burn");
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }
}

