/**
 *Submitted for verification at BscScan.com on 2025-10-02
*/

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol


// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// File: @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol


// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity >=0.6.2;


/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

// File: @openzeppelin/contracts/utils/Context.sol


// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: 22.sol


pragma solidity ^0.8.20;




contract MakeMeRichCrowdAi is Ownable {
    IERC20 public token;
    uint8 public tokenDecimals;
    uint256 private AIPool;

    uint256 public kMin = 10;
    uint256 public kMax = 75;
    uint256 public absoluteMin;

    uint256 public minBetResetTime = 24 hours; // админ-настраиваемое время сброса minBet
    address public feeRecipient;
    uint256 public feePercent;
    uint256 public maxPenalty = 20;

    uint256 public totalDeposits;
    uint256 public activePlayers;
    uint256 public chanceDivider = 75;
    uint256 public penaltyHistoryLength = 3;
    bool public maskWinChance;
    uint256 public cooldownDuration = 60; // секунды

    mapping(address => uint256) internal lastPlayTime;

    struct Player {
        uint256 balance;
        uint256 lastPlay;
        uint256 maxWinBet24h;
        uint256 maxWinTs;
        uint256[3] lastBets;
    }

    mapping(address => Player) private players;
    mapping(address => bool) private isPlayer;
    address[] private playerList;

    // ==================== EVENTS ====================
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount, uint256 fee);
    event Played(
        address indexed user,
        bool win,
        uint256 bet,
        uint256 riskCoefficient,
        uint256 winChance,
        uint256 systemLiquidity
    );
    event AIPoolFunded(uint256 amount);
    event AIPoolWithdrawn(uint256 amount);
    event MaskWinChanceSet(bool enabled);
    event CooldownUpdated(uint256 newCooldown);
    event MinBetResetTimeUpdated(uint256 newTime);

    // ==================== CONSTRUCTOR ====================
    constructor(address _token, address _feeRecipient, uint256 _feePercent) Ownable(msg.sender) {
        token = IERC20(_token);
        tokenDecimals = IERC20Metadata(_token).decimals();
        absoluteMin = 1 * (10 ** tokenDecimals);
        feeRecipient = _feeRecipient;
        feePercent = _feePercent;
    }

    // ==================== USER METHODS ====================
    function deposit(uint256 amount) external {
        require(amount > 0, "Nothing to deposit");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        Player storage p = players[msg.sender];
        bool isNew = p.balance == 0;
        p.balance += amount;

        if (!isPlayer[msg.sender]) {
            isPlayer[msg.sender] = true;
            playerList.push(msg.sender);
        }

        if (isNew) activePlayers += 1;
        totalDeposits += amount;

        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        Player storage p = players[msg.sender];
        require(amount <= p.balance, "Not enough balance");

        uint256 fee = (amount * feePercent) / 10000;
        uint256 payout = amount - fee;
        bool fullWithdraw = p.balance == amount;

        p.balance -= amount;
        if (fullWithdraw) activePlayers -= 1;
        totalDeposits -= amount;

        if (fee > 0 && feeRecipient != address(0)) {
            require(token.transfer(feeRecipient, fee), "Fee transfer failed");
        }
        require(token.transfer(msg.sender, payout), "Transfer failed");

        emit Withdraw(msg.sender, payout, fee);
    }

    function withdrawAll() external {
        Player storage p = players[msg.sender];
        uint256 amount = p.balance;
        require(amount > 0, "No balance");

        p.balance = 0;
        uint256 fee = (amount * feePercent) / 10000;
        uint256 payout = amount - fee;

        activePlayers -= 1;
        totalDeposits -= amount;

        if (fee > 0 && feeRecipient != address(0)) {
            require(token.transfer(feeRecipient, fee), "Fee transfer failed");
        }
        require(token.transfer(msg.sender, payout), "Transfer failed");

        emit Withdraw(msg.sender, payout, fee);
    }

    function makeMeRich() external {
        Player storage p = players[msg.sender];
        require(p.balance > 0, "No balance");
        require(block.timestamp >= lastPlayTime[msg.sender] + cooldownDuration, "Cooldown active");

        // ---------- minBet расчёт ----------
        if (block.timestamp > p.maxWinTs + minBetResetTime) {
            p.maxWinBet24h = 0;
        }

        uint256 minBet = p.maxWinBet24h > 0 ? p.maxWinBet24h / 2 : absoluteMin;
        if (minBet < absoluteMin) minBet = absoluteMin;

        require(p.balance >= minBet, "Balance below min bet");

        uint256 bet = p.balance;
        uint256 systemLiquidity = totalDeposits + AIPool;

        uint256 kUsed = kMin;
        if (systemLiquidity > 0) {
            uint256 ratio = (systemLiquidity * 1e18) / (systemLiquidity + bet);
            kUsed = kMin + ((kMax - kMin) * ratio) / 1e18;
        }

        uint256 penalty = _computeRiskPenalty(p, bet);
        if (kUsed > penalty) kUsed -= penalty;
        else kUsed = 0;
        if (kUsed > kMax) kUsed = kMax;

        uint256 winChance = _calculateWinChance(bet, kUsed);
        bool win = false;
        if (AIPool >= bet * 2) {
            win = random() % 100 < winChance;
        } else {
            kUsed = 0;
            win = false;
        }

        p.lastPlay = block.timestamp;
        lastPlayTime[msg.sender] = block.timestamp;

        if (win) {
            uint256 prize = bet;
            if (AIPool >= prize) {
                AIPool -= prize;
                p.balance += prize;
                totalDeposits += prize;
            } else {
                p.balance += AIPool;
                totalDeposits += AIPool;
                AIPool = 0;
            }

            if (block.timestamp - p.maxWinTs > minBetResetTime) {
                p.maxWinBet24h = prize;
                p.maxWinTs = block.timestamp;
            } else if (prize > p.maxWinBet24h) {
                p.maxWinBet24h = prize;
            }
        } else {
            // проигрыш → уменьшаем minBet
            if (p.maxWinBet24h > 0) {
                uint256 newMin = p.maxWinBet24h / 2;
                if (newMin < absoluteMin) newMin = absoluteMin;
                p.maxWinBet24h = newMin;
                p.maxWinTs = block.timestamp;
            }
            AIPool += bet;
            totalDeposits -= bet;
            p.balance = 0;
            activePlayers -= 1;
        }

        p.lastBets[2] = p.lastBets[1];
        p.lastBets[1] = p.lastBets[0];
        p.lastBets[0] = bet;

        emit Played(msg.sender, win, bet, kUsed, winChance, systemLiquidity);
    }

    // ==================== READ ====================
    function getAIData() external view returns (
        uint256 playerBalance,
        uint256 totalPool_,
        uint256 numberOfPlayers,
        uint256 minBet,
        uint256 riskCoefficient,
        uint256 winChance,
        uint256 nextAvailableTime
    ) {
        Player storage p = players[msg.sender];
        playerBalance = p.balance;
        totalPool_ = totalDeposits + AIPool;
        numberOfPlayers = activePlayers;

        minBet = p.maxWinBet24h > 0 ? p.maxWinBet24h / 2 : absoluteMin;
        if (minBet < absoluteMin) minBet = absoluteMin;

        uint256 kUsed = kMin;
        if (totalPool_ > 0) {
            uint256 ratio = (totalPool_ * 1e18) / (totalPool_ + playerBalance);
            kUsed = kMin + ((kMax - kMin) * ratio) / 1e18;
        }

        uint256 penalty = _computeRiskPenalty(p, playerBalance);
        if (kUsed > penalty) kUsed -= penalty;
        else kUsed = 0;
        if (kUsed > kMax) kUsed = kMax;
        riskCoefficient = kUsed;

        winChance = maskWinChance ? 100 : _calculateWinChance(playerBalance, kUsed);

        nextAvailableTime = 0;
        if (lastPlayTime[msg.sender] + cooldownDuration > block.timestamp) {
            nextAvailableTime = lastPlayTime[msg.sender] + cooldownDuration;
        }
    }

    // ==================== ADMIN ====================
    function setMinBetResetTime(uint256 newTime) external onlyOwner {
        require(newTime >= 1 hours, "Too small");
        minBetResetTime = newTime;
        emit MinBetResetTimeUpdated(newTime);
    }

    function setMaskWinChance(bool enabled) external onlyOwner {
        maskWinChance = enabled;
        emit MaskWinChanceSet(enabled);
    }

    function setCooldownDuration(uint256 _seconds) external onlyOwner {
        cooldownDuration = _seconds;
        emit CooldownUpdated(_seconds);
    }

    function setChanceDivider(uint256 divider_) external onlyOwner {
        require(divider_ > 0, "Must be > 0");
        chanceDivider = divider_;
    }

    function withdrawAIPool() external onlyOwner {
        uint256 amount = AIPool;
        AIPool = 0;
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit AIPoolWithdrawn(amount);
    }

    function fundAIPool(uint256 amount) external onlyOwner {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        AIPool += amount;
        emit AIPoolFunded(amount);
    }

    function setTOKEN(address _token) external onlyOwner {
        token = IERC20(_token);
        tokenDecimals = IERC20Metadata(_token).decimals();
        absoluteMin = 1 * (10 ** tokenDecimals);
    }

    function setRiskCoefficients(uint256 _kMin, uint256 _kMax) external onlyOwner {
        require(_kMin <= _kMax, "kMin must be <= kMax");
        kMin = _kMin;
        kMax = _kMax;
    }

    function setAbsoluteMin(uint256 _absoluteMin) external onlyOwner {
        absoluteMin = _absoluteMin;
    }

    function setFee(address _recipient, uint256 _feePercent) external onlyOwner {
        feeRecipient = _recipient;
        feePercent = _feePercent;
    }

    function setMaxPenalty(uint256 _maxPenalty) external onlyOwner {
        maxPenalty = _maxPenalty;
    }

    // ==================== INTERNAL ====================
    function _computeRiskPenalty(Player storage p, uint256 bet) internal view returns (uint256 penalty) {
        penalty = 0;
        if (block.timestamp - p.maxWinTs <= 24 hours && bet < p.maxWinBet24h * 2) {
            penalty = ((p.maxWinBet24h * 2 - bet) * 100) / (p.maxWinBet24h * 2);
            if (penalty > maxPenalty) penalty = maxPenalty;
        }
    }

    function _calculateWinChance(uint256 playerBalance, uint256 riskCoefficient) internal view returns (uint256) {
        if (playerBalance == 0) return 0;
        uint256 chance = (riskCoefficient * 100) / chanceDivider;
        if (chance > 100) chance = 100;
        return chance;
    }

    function random() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));
    }
}