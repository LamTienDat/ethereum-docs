// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleERC20
 * @dev Smart contract ERC20 đơn giản để học về transfer, approve, transferFrom
 * 
 * Mục đích: Giáo dục - Minh họa các khái niệm cơ bản của ERC20
 * Không dùng cho production!
 */
contract SimpleERC20 {
    // ============ State Variables ============
    
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    // Mapping lưu số dư của mỗi địa chỉ
    mapping(address => uint256) public balanceOf;
    
    // Mapping lưu allowance: owner => spender => amount
    // allowance[owner][spender] = số tiền mà spender được phép tiêu từ owner
    mapping(address => mapping(address => uint256)) public allowance;
    
    // ============ Events ============
    
    /**
     * @dev Emit khi có transfer thành công
     * @param from Địa chỉ gửi
     * @param to Địa chỉ nhận
     * @param value Số lượng token
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /**
     * @dev Emit khi có approve thành công
     * @param owner Chủ sở hữu token
     * @param spender Địa chỉ được phép tiêu
     * @param value Số lượng được phép tiêu
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // ============ Constructor ============
    
    /**
     * @dev Khởi tạo token với thông tin cơ bản
     * @param _name Tên token (vd: "Kaopiz Coin")
     * @param _symbol Symbol (vd: "KPC")
     * @param _decimals Số chữ số thập phân (thường là 18)
     * @param _initialSupply Số lượng token ban đầu (sẽ mint cho deployer)
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
        
        // Mint toàn bộ supply cho người deploy
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
        
        emit Transfer(address(0), msg.sender, _initialSupply);
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Chuyển token từ msg.sender đến địa chỉ khác
     * @param to Địa chỉ nhận
     * @param amount Số lượng token
     * @return success True nếu thành công
     * 
     * Flow:
     * 1. Kiểm tra số dư của msg.sender
     * 2. Trừ tiền từ msg.sender
     * 3. Cộng tiền cho to
     * 4. Emit event Transfer
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
     * @dev Cho phép spender được quyền tiêu token của msg.sender
     * @param spender Địa chỉ được phép tiêu
     * @param amount Số lượng token được phép tiêu
     * @return success True nếu thành công
     * 
     * Use case:
     * - User approve cho DEX contract
     * - User approve cho payment gateway
     * - User approve cho staking contract
     * 
     * ⚠️ Lưu ý: Nên set allowance về 0 trước khi set giá trị mới
     * để tránh front-running attack
     */
    function approve(address spender, uint256 amount) public returns (bool success) {
        require(spender != address(0), "Cannot approve zero address");
        
        allowance[msg.sender][spender] = amount;
        
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Chuyển token từ địa chỉ from đến địa chỉ to
     * Chỉ hoạt động nếu msg.sender đã được approve
     * @param from Địa chỉ gửi (đã approve cho msg.sender)
     * @param to Địa chỉ nhận
     * @param amount Số lượng token
     * @return success True nếu thành công
     * 
     * Flow:
     * 1. Kiểm tra allowance[from][msg.sender] >= amount
     * 2. Kiểm tra balanceOf[from] >= amount
     * 3. Trừ allowance
     * 4. Trừ tiền từ from
     * 5. Cộng tiền cho to
     * 6. Emit event Transfer
     * 
     * Use case:
     * - DEX contract rút tiền từ user để swap
     * - Payment gateway tự động trừ tiền
     * - Staking contract lấy token để stake
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
     * @dev Mint thêm token (chỉ để demo, production nên có access control)
     * @param to Địa chỉ nhận token mới
     * @param amount Số lượng token mint
     */
    function mint(address to, uint256 amount) public {
        require(to != address(0), "Cannot mint to zero address");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @dev Burn token của msg.sender
     * @param amount Số lượng token burn
     */
    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance to burn");
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
    }
}

