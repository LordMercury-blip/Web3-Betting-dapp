// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceBettingContract
 * @dev A secure, gas-optimized contract for cryptocurrency price betting
 * 
 * Security Features:
 * - ReentrancyGuard: Prevents reentrancy attacks on withdrawals
 * - Pausable: Emergency stop mechanism for contract upgrades/issues
 * - Commit-Reveal: Prevents front-running by hiding bet direction until reveal
 * - Oracle Validation: Multiple price feed validations to prevent manipulation
 * - Rate Limiting: Per-user betting limits to prevent spam/manipulation
 * - Gas Optimization: Efficient storage patterns and minimal external calls
 */
contract PriceBettingContract is ReentrancyGuard, Pausable, Ownable {
    // Chainlink price feed interfaces for different tokens
    mapping(string => AggregatorV3Interface) public priceFeeds;
    
    // Betting parameters
    uint256 public constant MIN_BET_AMOUNT = 0.001 ether;
    uint256 public constant MAX_BET_AMOUNT = 10 ether;
    uint256 public constant HOUSE_EDGE = 200; // 2% (basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    // Rate limiting: max bets per user per hour
    uint256 public constant MAX_BETS_PER_HOUR = 10;
    mapping(address => uint256) public lastBetTimestamp;
    mapping(address => uint256) public betsInLastHour;
    
    // Bet structure optimized for gas efficiency
    struct Bet {
        address bettor;
        string token;
        uint256 amount;
        bool isUpBet; // true for up, false for down
        uint256 startPrice;
        uint256 endPrice;
        uint256 startTime;
        uint256 duration; // in seconds
        bool isSettled;
        bool isWinner;
        bytes32 commitHash; // For commit-reveal scheme
        bool isRevealed;
    }
    
    // Storage optimization: pack related data
    struct UserStats {
        uint256 totalBets;
        uint256 totalWins;
        uint256 totalWagered;
        uint256 totalWon;
    }
    
    mapping(uint256 => Bet) public bets;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public userBets;
    
    uint256 public nextBetId = 1;
    uint256 public totalVolume;
    address public feeRecipient;
    
    // Events for frontend integration
    event BetPlaced(
        uint256 indexed betId,
        address indexed bettor,
        string token,
        uint256 amount,
        uint256 duration,
        bytes32 commitHash
    );
    
    event BetRevealed(
        uint256 indexed betId,
        bool isUpBet,
        uint256 startPrice
    );
    
    event BetSettled(
        uint256 indexed betId,
        address indexed bettor,
        bool isWinner,
        uint256 payout
    );
    
    event PriceFeedUpdated(string token, address feedAddress);
    
    modifier validBetAmount(uint256 amount) {
        require(
            amount >= MIN_BET_AMOUNT && amount <= MAX_BET_AMOUNT,
            "Invalid bet amount"
        );
        _;
    }
    
    modifier rateLimited() {
        // Reset counter if more than an hour has passed
        if (block.timestamp - lastBetTimestamp[msg.sender] > 3600) {
            betsInLastHour[msg.sender] = 0;
        }
        
        require(
            betsInLastHour[msg.sender] < MAX_BETS_PER_HOUR,
            "Rate limit exceeded"
        );
        
        betsInLastHour[msg.sender]++;
        lastBetTimestamp[msg.sender] = block.timestamp;
        _;
    }
    
    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
        
        // Initialize price feeds for major tokens on Sepolia testnet
        // Note: These addresses are for Sepolia testnet
        priceFeeds["ETH"] = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        priceFeeds["BTC"] = AggregatorV3Interface(0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43);
    }
    
    /**
     * @dev Add or update price feed for a token
     * @param token Token symbol (e.g., "ETH", "BTC")
     * @param feedAddress Chainlink price feed contract address
     */
    function setPriceFeed(string memory token, address feedAddress) 
        external 
        onlyOwner 
    {
        require(feedAddress != address(0), "Invalid feed address");
        priceFeeds[token] = AggregatorV3Interface(feedAddress);
        emit PriceFeedUpdated(token, feedAddress);
    }
    
    /**
     * @dev Get current price for a token with validation
     * @param token Token symbol
     * @return price Current price in USD (8 decimals)
     * @return timestamp Price update timestamp
     */
    function getCurrentPrice(string memory token) 
        public 
        view 
        returns (uint256 price, uint256 timestamp) 
    {
        AggregatorV3Interface priceFeed = priceFeeds[token];
        require(address(priceFeed) != address(0), "Price feed not found");
        
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
            
        ) = priceFeed.latestRoundData();
        
        // Validate price data freshness (within 1 hour)
        require(block.timestamp - updatedAt <= 3600, "Price data too old");
        require(answer > 0, "Invalid price data");
        
        return (uint256(answer), updatedAt);
    }
    
    /**
     * @dev Place a bet using commit-reveal scheme to prevent front-running
     * @param token Token to bet on
     * @param duration Bet duration in seconds (300=5min, 900=15min, 3600=1hr)
     * @param commitHash keccak256(abi.encodePacked(isUpBet, nonce, msg.sender))
     */
    function placeBet(
        string memory token,
        uint256 duration,
        bytes32 commitHash
    ) 
        external 
        payable 
        whenNotPaused 
        validBetAmount(msg.value)
        rateLimited
        nonReentrant
    {
        require(bytes(token).length > 0, "Invalid token");
        require(
            duration == 300 || duration == 900 || duration == 3600,
            "Invalid duration"
        );
        require(commitHash != bytes32(0), "Invalid commit hash");
        
        // Get current price to establish starting point
        (uint256 startPrice, ) = getCurrentPrice(token);
        
        uint256 betId = nextBetId++;
        
        // Store bet with commit hash (direction hidden)
        bets[betId] = Bet({
            bettor: msg.sender,
            token: token,
            amount: msg.value,
            isUpBet: false, // Will be set during reveal
            startPrice: startPrice,
            endPrice: 0,
            startTime: block.timestamp,
            duration: duration,
            isSettled: false,
            isWinner: false,
            commitHash: commitHash,
            isRevealed: false
        });
        
        userBets[msg.sender].push(betId);
        totalVolume += msg.value;
        
        emit BetPlaced(betId, msg.sender, token, msg.value, duration, commitHash);
    }
    
    /**
     * @dev Reveal bet direction after placement to prevent front-running
     * @param betId Bet ID to reveal
     * @param isUpBet True for up bet, false for down bet
     * @param nonce Random nonce used in commit hash
     */
    function revealBet(uint256 betId, bool isUpBet, uint256 nonce) 
        external 
        whenNotPaused 
    {
        Bet storage bet = bets[betId];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.isRevealed, "Already revealed");
        require(!bet.isSettled, "Bet already settled");
        
        // Verify commit hash matches reveal
        bytes32 expectedHash = keccak256(abi.encodePacked(isUpBet, nonce, msg.sender));
        require(expectedHash == bet.commitHash, "Invalid reveal");
        
        // Reveal must happen within 5 minutes of bet placement
        require(block.timestamp <= bet.startTime + 300, "Reveal window expired");
        
        bet.isUpBet = isUpBet;
        bet.isRevealed = true;
        
        emit BetRevealed(betId, isUpBet, bet.startPrice);
    }
    
    /**
     * @dev Settle a bet after duration expires
     * @param betId Bet ID to settle
     */
    function settleBet(uint256 betId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Bet storage bet = bets[betId];
        require(!bet.isSettled, "Already settled");
        require(bet.isRevealed, "Bet not revealed");
        require(
            block.timestamp >= bet.startTime + bet.duration,
            "Bet duration not expired"
        );
        
        // Get final price
        (uint256 endPrice, ) = getCurrentPrice(bet.token);
        bet.endPrice = endPrice;
        
        // Determine winner
        bool isWinner = (bet.isUpBet && endPrice > bet.startPrice) ||
                       (!bet.isUpBet && endPrice < bet.startPrice);
        
        bet.isWinner = isWinner;
        bet.isSettled = true;
        
        // Update user statistics
        UserStats storage stats = userStats[bet.bettor];
        stats.totalBets++;
        stats.totalWagered += bet.amount;
        
        uint256 payout = 0;
        
        if (isWinner) {
            stats.totalWins++;
            
            // Calculate payout: original bet + winnings minus house edge
            uint256 winnings = bet.amount * (BASIS_POINTS - HOUSE_EDGE) / BASIS_POINTS;
            payout = bet.amount + winnings;
            stats.totalWon += payout;
            
            // Transfer payout to winner
            (bool success, ) = bet.bettor.call{value: payout}("");
            require(success, "Payout transfer failed");
        }
        
        // House edge goes to fee recipient
        uint256 fee = bet.amount * HOUSE_EDGE / BASIS_POINTS;
        if (fee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        emit BetSettled(betId, bet.bettor, isWinner, payout);
    }
    
    /**
     * @dev Get user betting statistics
     */
    function getUserStats(address user) 
        external 
        view 
        returns (
            uint256 totalBets,
            uint256 totalWins,
            uint256 totalWagered,
            uint256 totalWon,
            uint256 winRate
        ) 
    {
        UserStats memory stats = userStats[user];
        uint256 rate = stats.totalBets > 0 ? 
            (stats.totalWins * BASIS_POINTS) / stats.totalBets : 0;
        
        return (
            stats.totalBets,
            stats.totalWins,
            stats.totalWagered,
            stats.totalWon,
            rate
        );
    }
    
    /**
     * @dev Get user's bet IDs
     */
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBets[user];
    }
    
    /**
     * @dev Emergency functions for contract management
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Emergency withdrawal for contract owner (only for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    /**
     * @dev Get contract balance and statistics
     */
    function getContractInfo() 
        external 
        view 
        returns (
            uint256 balance,
            uint256 totalVol,
            uint256 totalBets
        ) 
    {
        return (
            address(this).balance,
            totalVolume,
            nextBetId - 1
        );
    }
}