// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.20;

// ================================================================
//  LOOKA WIN — Loterie décentralisée, immuable, autonome
//  Aucun owner. Aucun admin. Aucun backend humain.
//  Le code est la loi.
//
//  @custom:security-contact security@looka.win
//  @custom:invariant Aucune fonction ne peut modifier les constants
//  @custom:invariant Aucune fonction ne peut modifier les immutables
//  @custom:invariant Aucun proxy. Aucun upgrade. Aucun selfdestruct.
//  @custom:invariant Les fonds appartiennent aux joueurs et aux gagnants.
// ================================================================

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract LookaWin is ReentrancyGuard, VRFConsumerBaseV2Plus, AutomationCompatibleInterface {

    // ────────────────────────────────────────────────────────────
    // IMMUTABLES — Figés au déploiement, gravés dans le bytecode
    // ────────────────────────────────────────────────────────────

    IERC20  public immutable USDT;
    address public immutable TREASURY;

    IVRFCoordinatorV2Plus public immutable VRF_COORDINATOR;
    bytes32 public immutable KEY_HASH;
    uint256 public immutable SUBSCRIPTION_ID;

    // ────────────────────────────────────────────────────────────
    // CONSTANTS — Jamais modifiables
    // ────────────────────────────────────────────────────────────

    // Prix et seuils
    uint256 public constant TICKET_PRICE          = 2_000_000_000_000_000_000; // 2 USDT (18 décimales)
    uint256 public constant MIN_PARTICIPANTS       = 50;
    uint256 public constant MIN_PAYOUT_REFERRAL   = 3_000_000;  // 3 USDT
    uint256 public constant MIN_PAYOUT_PROTOCOL      = 5_000_000;  // 5 USDT

    // Distribution en basis points (sur 10 000)
    uint256 public constant BP_HOURLY             = 8800;  // 88.00%
    uint256 public constant BP_DAILY              =  300;  //  3.00%
    uint256 public constant BP_WEEKLY             =  200;  //  2.00%
    uint256 public constant BP_MONTHLY            =  100;  //  1.00%
    uint256 public constant BP_REFERRAL           =  300;  //  3.00%
    // Protocole = reste : 5.50% avec parrain / 6.00% sans parrain

    // Intervalles de tirage
    uint256 public constant INTERVAL_HOURLY       = 1 hours;
    uint256 public constant INTERVAL_DAILY        = 1 days;
    uint256 public constant INTERVAL_WEEKLY       = 7 days;
    uint256 public constant INTERVAL_MONTHLY      = 30 days;

    // Transfert protocole à 03:13 AM GMT
    // Fenêtre : secondes écoulées depuis minuit UTC entre 11580 (03:13:00) et 11639 (03:13:59)
    uint256 public constant PROTOCOL_PAYOUT_START    = 11_580;  // 03:13:00 GMT en secondes
    uint256 public constant PROTOCOL_PAYOUT_END      = 11_639;  // 03:13:59 GMT en secondes

    // Chainlink VRF
    uint32  public constant CALLBACK_GAS_LIMIT    = 400_000;
    uint16  public constant REQUEST_CONFIRMATIONS = 3;
    uint32  public constant NUM_WORDS             = 1;

    // Retry transfert échoué
    uint256 public constant RETRY_INTERVAL        = 1 minutes;
    uint8   public constant MAX_RETRIES           = 5;

    // ────────────────────────────────────────────────────────────
    // TYPES
    // ────────────────────────────────────────────────────────────

    enum DrawType { NONE, HOURLY, DAILY, WEEKLY, MONTHLY, PROTOCOL }

    struct PendingDraw {
        DrawType  drawType;
        address[] ticketsSnapshot;
        uint256   jackpotSnapshot;
        address   winner;          // Stocké dès la désignation VRF
        uint256   timestamp;
        uint8     retries;
    }

    // ────────────────────────────────────────────────────────────
    // STATE
    // ────────────────────────────────────────────────────────────

    uint256 public roundId;

    // Jackpots accumulés
    uint256 public jackpotHourly;
    uint256 public jackpotDaily;
    uint256 public jackpotWeekly;
    uint256 public jackpotMonthly;
    uint256 public protocolBalance;

    // 4 listes de tickets distinctes
    address[] public ticketsHourly;
    address[] public ticketsDaily;
    address[] public ticketsWeekly;
    address[] public ticketsMonthly;

    // Timestamps des derniers tirages
    uint256 public lastHourlyDraw;
    uint256 public lastDailyDraw;
    uint256 public lastWeeklyDraw;
    uint256 public lastMonthlyDraw;
    uint256 public lastProtocolPayout;  // Dernier jour du transfert protocole (en jours depuis epoch)

    // Tirages en attente de VRF ou en retry
    mapping(uint256 => PendingDraw) public pendingDraws;

    // Retry : requestId en attente de retry
    uint256[] public pendingRetries;
    mapping(uint256 => uint256) public nextRetryTime;

    // Parrainage
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public pendingReferral;
    mapping(address => uint256) public totalReferralEarned;

    // Gains en attente — gagnants dont le transfert a échoué 5 fois
    // Le montant reste disponible indéfiniment jusqu'au claim manuel
    mapping(address => uint256) public pendingWinners;

    // ────────────────────────────────────────────────────────────
    // EVENTS
    // ────────────────────────────────────────────────────────────

    event TicketPurchased(
        address indexed buyer,
        uint256 quantity,
        address indexed referrer
    );
    event ReferrerRegistered(
        address indexed player,
        address indexed referrer
    );
    event DrawRequested(
        uint256 indexed requestId,
        DrawType drawType
    );
    event DrawSkipped(
        DrawType drawType,
        uint256 timestamp
    );
    event WinnerPaid(
        address indexed winner,
        uint256 amount,
        DrawType drawType,
        uint256 roundId
    );
    event JackpotRolledOver(
        DrawType drawType,
        uint256 amount
    );
    event ReferralPaid(
        address indexed referrer,
        uint256 amount
    );
    event ProtocolPaid(
        address indexed treasury,
        uint256 amount,
        uint256 timestamp
    );
    event TransferRetry(
        address indexed winner,
        uint256 amount,
        uint256 indexed requestId,
        uint8 attempt
    );
    event TransferFailed(
        address indexed winner,
        uint256 amount,
        uint256 indexed requestId
    );
    event WinnerPending(
        address indexed winner,
        uint256 amount,
        DrawType drawType
    );

    // ────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ────────────────────────────────────────────────────────────

    constructor(
        address _usdt,
        address _treasury,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(_usdt     != address(0), "USDT invalide");
        require(_treasury != address(0), "Treasury invalide");

        USDT            = IERC20(_usdt);
        TREASURY        = _treasury;
        VRF_COORDINATOR = IVRFCoordinatorV2Plus(_vrfCoordinator);
        KEY_HASH        = _keyHash;
        SUBSCRIPTION_ID = _subscriptionId;

        uint256 t       = block.timestamp;
        lastHourlyDraw  = t;
        lastDailyDraw   = t;
        lastWeeklyDraw  = t;
        lastMonthlyDraw = t;
        lastProtocolPayout = t / 1 days; // Numéro du jour courant
    }

    // ────────────────────────────────────────────────────────────
    // ACHAT DE TICKETS
    // ────────────────────────────────────────────────────────────

    function buyTickets(uint256 quantity, address referrer)
        external
        nonReentrant
    {
        require(quantity >= 1, "Minimum 1 ticket");

        uint256 totalCost = TICKET_PRICE * quantity;
        require(
            USDT.transferFrom(msg.sender, address(this), totalCost),
            "Transfert USDT echoue"
        );

        // Enregistrement parrain une seule fois à vie
        if (
            referrer != address(0) &&
            referrer != msg.sender &&
            referrerOf[msg.sender] == address(0)
        ) {
            referrerOf[msg.sender] = referrer;
            emit ReferrerRegistered(msg.sender, referrer);
        }

        address parrain = referrerOf[msg.sender];

        // Ajout dans les 4 listes une seule fois par achat (peu importe quantity)
        // Chaque ticket = une entrée dans chaque liste
        for (uint256 i = 0; i < quantity; i++) {
            ticketsHourly.push(msg.sender);
            ticketsDaily.push(msg.sender);
            ticketsWeekly.push(msg.sender);
            ticketsMonthly.push(msg.sender);
            _distributeTicket(TICKET_PRICE, parrain);
        }

        emit TicketPurchased(msg.sender, quantity, parrain);
    }

    function _distributeTicket(uint256 amount, address parrain) internal {
        uint256 toHourly  = (amount * BP_HOURLY)  / 10_000;
        uint256 toDaily   = (amount * BP_DAILY)   / 10_000;
        uint256 toWeekly  = (amount * BP_WEEKLY)  / 10_000;
        uint256 toMonthly = (amount * BP_MONTHLY) / 10_000;

        uint256 distributed = toHourly + toDaily + toWeekly + toMonthly;

        // Parrainage si parrain enregistré
        if (parrain != address(0)) {
            uint256 toReferral = (amount * BP_REFERRAL) / 10_000;
            pendingReferral[parrain] += toReferral;
            distributed += toReferral;

            // Versement automatique dès que le seuil est atteint
            if (pendingReferral[parrain] >= MIN_PAYOUT_REFERRAL) {
                uint256 refAmount = pendingReferral[parrain];
                pendingReferral[parrain] = 0;
                bool refSuccess = USDT.transfer(parrain, refAmount);
                if (!refSuccess) {
                    pendingReferral[parrain] = refAmount;
                } else {
                    emit ReferralPaid(parrain, refAmount);
                }
            }
        }

        // Protocole = reste (jamais calculé explicitement)
        uint256 toProtocol = amount - distributed;

        jackpotHourly  += toHourly;
        jackpotDaily   += toDaily;
        jackpotWeekly  += toWeekly;
        jackpotMonthly += toMonthly;
        protocolBalance += toProtocol;
    }

    // ────────────────────────────────────────────────────────────
    // PARRAINAGE — Retrait manuel uniquement
    // ────────────────────────────────────────────────────────────

    function claimReferral() external nonReentrant {
        require(
            pendingReferral[msg.sender] >= MIN_PAYOUT_REFERRAL,
            "Solde insuffisant (minimum 3 USDT)"
        );
        uint256 amount = pendingReferral[msg.sender];
        pendingReferral[msg.sender] = 0;
        totalReferralEarned[msg.sender] += amount;
        require(USDT.transfer(msg.sender, amount), "Transfert parrain echoue");
        emit ReferralPaid(msg.sender, amount);
    }

    // ────────────────────────────────────────────────────────────
    // CHAINLINK AUTOMATION — File d'attente (Queue)
    // ────────────────────────────────────────────────────────────

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // 1. Vérifier si retry en attente
        for (uint256 i = 0; i < pendingRetries.length; i++) {
            uint256 reqId = pendingRetries[i];
            if (
                pendingDraws[reqId].drawType != DrawType.NONE &&
                block.timestamp >= nextRetryTime[reqId]
            ) {
                return (true, abi.encode(uint8(99), reqId));
            }
        }

        // 2. Construire la queue des actions dues
        uint8[] memory queue = new uint8[](5);
        uint8 count = 0;

        // HOURLY
        if (block.timestamp >= lastHourlyDraw + INTERVAL_HOURLY) {
            queue[count] = 1;
            count++;
        }
        // DAILY
        if (block.timestamp >= lastDailyDraw + INTERVAL_DAILY) {
            queue[count] = 2;
            count++;
        }
        // WEEKLY
        if (block.timestamp >= lastWeeklyDraw + INTERVAL_WEEKLY) {
            queue[count] = 3;
            count++;
        }
        // MONTHLY
        if (block.timestamp >= lastMonthlyDraw + INTERVAL_MONTHLY) {
            queue[count] = 4;
            count++;
        }
        // HOUSE — fenêtre 03:13:00 à 03:13:59 GMT, une fois par jour
        uint256 todaySeconds = block.timestamp % 1 days;
        uint256 todayIndex   = block.timestamp / 1 days;
        if (
            todaySeconds >= PROTOCOL_PAYOUT_START &&
            todaySeconds <= PROTOCOL_PAYOUT_END   &&
            todayIndex > lastProtocolPayout        &&
            protocolBalance >= MIN_PAYOUT_PROTOCOL
        ) {
            queue[count] = 5;
            count++;
        }

        if (count == 0) return (false, "");

        // Retourner seulement les actions dues
        uint8[] memory trimmed = new uint8[](count);
        for (uint8 i = 0; i < count; i++) {
            trimmed[i] = queue[i];
        }

        return (true, abi.encode(uint8(1), trimmed));
    }

    function performUpkeep(bytes calldata performData) external override {
        (uint8 mode) = abi.decode(performData, (uint8));

        // Mode retry
        if (mode == 99) {
            (, uint256 reqId) = abi.decode(performData, (uint8, uint256));
            _retryTransfer(reqId);
            return;
        }

        // Mode normal — dépiler la première action
        (, uint8[] memory queue) = abi.decode(performData, (uint8, uint8[]));
        require(queue.length > 0, "Queue vide");

        uint8 action = queue[0];

        if (action == 1) _executeDraw(DrawType.HOURLY);
        else if (action == 2) _executeDraw(DrawType.DAILY);
        else if (action == 3) _executeDraw(DrawType.WEEKLY);
        else if (action == 4) _executeDraw(DrawType.MONTHLY);
        else if (action == 5) _payProtocol();
    }

    // ────────────────────────────────────────────────────────────
    // TIRAGES — Exécution
    // ────────────────────────────────────────────────────────────

    function _executeDraw(DrawType drawType) internal {
        address[] storage ticketList = _getTicketList(drawType);
        uint256 jackpot;

        if (drawType == DrawType.HOURLY) {
            require(
                block.timestamp >= lastHourlyDraw + INTERVAL_HOURLY,
                "Trop tot"
            );
            lastHourlyDraw = block.timestamp;

            if (ticketsHourly.length < MIN_PARTICIPANTS) {
                emit DrawSkipped(DrawType.HOURLY, block.timestamp);
                return;
            }
            jackpot       = jackpotHourly;
            jackpotHourly = 0;
            roundId++;

        } else if (drawType == DrawType.DAILY) {
            require(
                block.timestamp >= lastDailyDraw + INTERVAL_DAILY,
                "Trop tot"
            );
            lastDailyDraw = block.timestamp;

            if (ticketsDaily.length == 0 || jackpotDaily == 0) {
                // Jackpot s'accumule tel quel — pas de modification
                emit JackpotRolledOver(DrawType.DAILY, jackpotDaily);
                return;
            }
            jackpot      = jackpotDaily;
            jackpotDaily = 0;

        } else if (drawType == DrawType.WEEKLY) {
            require(
                block.timestamp >= lastWeeklyDraw + INTERVAL_WEEKLY,
                "Trop tot"
            );
            lastWeeklyDraw = block.timestamp;

            if (ticketsWeekly.length == 0 || jackpotWeekly == 0) {
                emit JackpotRolledOver(DrawType.WEEKLY, jackpotWeekly);
                return;
            }
            jackpot       = jackpotWeekly;
            jackpotWeekly = 0;

        } else if (drawType == DrawType.MONTHLY) {
            require(
                block.timestamp >= lastMonthlyDraw + INTERVAL_MONTHLY,
                "Trop tot"
            );
            lastMonthlyDraw = block.timestamp;

            if (ticketsMonthly.length == 0 || jackpotMonthly == 0) {
                emit JackpotRolledOver(DrawType.MONTHLY, jackpotMonthly);
                return;
            }
            jackpot        = jackpotMonthly;
            jackpotMonthly = 0;
        }

        // Snapshot immédiat avant remise à zéro
        address[] memory snapshot = ticketList;

        // Remise à zéro de la liste uniquement après snapshot
        _clearTicketList(drawType);

        // Demande VRF
        uint256 requestId = VRF_COORDINATOR.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash:              KEY_HASH,
                subId:                SUBSCRIPTION_ID,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit:     CALLBACK_GAS_LIMIT,
                numWords:             NUM_WORDS,
                extraArgs:            VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({ nativePayment: false })
                )
            })
        );

        pendingDraws[requestId] = PendingDraw({
            drawType       : drawType,
            ticketsSnapshot: snapshot,
            jackpotSnapshot: jackpot,
            winner         : address(0), // Sera rempli dans fulfillRandomWords
            timestamp      : block.timestamp,
            retries        : 0
        });

        emit DrawRequested(requestId, drawType);
    }

    // ────────────────────────────────────────────────────────────
    // CHAINLINK VRF CALLBACK
    // ────────────────────────────────────────────────────────────

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        PendingDraw storage draw = pendingDraws[requestId];
        require(draw.drawType != DrawType.NONE, "Tirage inconnu");

        uint256 winnerIndex = randomWords[0] % draw.ticketsSnapshot.length;
        address winner      = draw.ticketsSnapshot[winnerIndex];
        uint256 amount      = draw.jackpotSnapshot;
        DrawType dt         = draw.drawType;

        // Stocker le gagnant désigné dans la struct pour les retries
        draw.winner = winner;

        bool success = _safeTransfer(winner, amount);

        if (success) {
            emit WinnerPaid(winner, amount, dt, roundId);
            delete pendingDraws[requestId];
        } else {
            // Conserver PendingDraw pour retry
            draw.retries         = 1;
            nextRetryTime[requestId] = block.timestamp + RETRY_INTERVAL;
            pendingRetries.push(requestId);
            emit TransferRetry(winner, amount, requestId, 1);
        }
    }

    // ────────────────────────────────────────────────────────────
    // RETRY — Tentative de retransfert
    // ────────────────────────────────────────────────────────────

    function _retryTransfer(uint256 requestId) internal {
        PendingDraw storage draw = pendingDraws[requestId];
        require(draw.drawType != DrawType.NONE, "Tirage inconnu");
        require(
            block.timestamp >= nextRetryTime[requestId],
            "Retry trop tot"
        );

        // Utiliser le gagnant stocké lors du callback VRF
        address winner = draw.winner;
        uint256 amount = draw.jackpotSnapshot;
        DrawType dt    = draw.drawType;

        draw.retries++;

        bool success = _safeTransfer(winner, amount);

        if (success) {
            emit WinnerPaid(winner, amount, dt, roundId);
            _removePendingRetry(requestId);
            delete pendingDraws[requestId];
            delete nextRetryTime[requestId];

        } else if (draw.retries >= MAX_RETRIES) {
            // Après 5 échecs : le gain appartient toujours au gagnant
            // Stocké dans pendingWinners — réclamable à vie via claimWin()
            pendingWinners[winner] += amount;
            emit TransferFailed(winner, amount, requestId);
            emit WinnerPending(winner, amount, dt);
            _removePendingRetry(requestId);
            delete pendingDraws[requestId];
            delete nextRetryTime[requestId];

        } else {
            nextRetryTime[requestId] = block.timestamp + RETRY_INTERVAL;
            emit TransferRetry(winner, amount, requestId, draw.retries);
        }
    }

    function _removePendingRetry(uint256 requestId) internal {
        for (uint256 i = 0; i < pendingRetries.length; i++) {
            if (pendingRetries[i] == requestId) {
                pendingRetries[i] = pendingRetries[pendingRetries.length - 1];
                pendingRetries.pop();
                break;
            }
        }
    }

    // ────────────────────────────────────────────────────────────
    // CLAIM WIN — Réclamation manuelle si transfert automatique échoué
    // Disponible indéfiniment pour le gagnant légitime
    // ────────────────────────────────────────────────────────────

    function claimWin() external nonReentrant {
        uint256 amount = pendingWinners[msg.sender];
        require(amount > 0, "Aucun gain en attente");
        pendingWinners[msg.sender] = 0;
        require(USDT.transfer(msg.sender, amount), "Transfert claimWin echoue");
        emit WinnerPaid(msg.sender, amount, DrawType.NONE, roundId);
    }

    // ────────────────────────────────────────────────────────────
    // VIREMENT MAISON — 03:13 AM GMT
    // ────────────────────────────────────────────────────────────

    function _payProtocol() internal {
        uint256 todaySeconds = block.timestamp % 1 days;
        uint256 todayIndex   = block.timestamp / 1 days;

        require(
            todaySeconds >= PROTOCOL_PAYOUT_START &&
            todaySeconds <= PROTOCOL_PAYOUT_END,
            "Hors fenetre 03:13 GMT"
        );
        require(todayIndex > lastProtocolPayout, "Deja vire aujourd'hui");
        require(protocolBalance >= MIN_PAYOUT_PROTOCOL, "Solde insuffisant");

        uint256 amount = protocolBalance;
        protocolBalance   = 0;
        lastProtocolPayout = todayIndex;

        require(
            USDT.transfer(TREASURY, amount),
            "Virement TREASURY echoue"
        );

        emit ProtocolPaid(TREASURY, amount, block.timestamp);
    }

    // ────────────────────────────────────────────────────────────
    // HELPERS INTERNES
    // ────────────────────────────────────────────────────────────

    function _safeTransfer(address to, uint256 amount)
        internal
        returns (bool)
    {
        (bool ok) = USDT.transfer(to, amount);
        return ok;
    }

    function _getTicketList(DrawType drawType)
        internal
        view
        returns (address[] storage)
    {
        if (drawType == DrawType.HOURLY)  return ticketsHourly;
        if (drawType == DrawType.DAILY)   return ticketsDaily;
        if (drawType == DrawType.WEEKLY)  return ticketsWeekly;
        if (drawType == DrawType.MONTHLY) return ticketsMonthly;
        revert("DrawType invalide");
    }

    function _clearTicketList(DrawType drawType) internal {
        if (drawType == DrawType.HOURLY)       delete ticketsHourly;
        else if (drawType == DrawType.DAILY)   delete ticketsDaily;
        else if (drawType == DrawType.WEEKLY)  delete ticketsWeekly;
        else if (drawType == DrawType.MONTHLY) delete ticketsMonthly;
    }

    // ────────────────────────────────────────────────────────────
    // FONCTIONS DE LECTURE PUBLIQUES
    // ────────────────────────────────────────────────────────────

    function getCurrentTicketCount() external view returns (uint256) {
        return ticketsHourly.length;
    }

    function getCurrentHourlyPrize() external view returns (uint256) {
        return jackpotHourly;
    }

    function getJackpots()
        external
        view
        returns (uint256 daily, uint256 weekly, uint256 monthly)
    {
        return (jackpotDaily, jackpotWeekly, jackpotMonthly);
    }

    function getReferralPending(address referrer)
        external
        view
        returns (uint256)
    {
        return pendingReferral[referrer];
    }

    function getContractBalance() external view returns (uint256) {
        return USDT.balanceOf(address(this));
    }

    function getPendingWin(address winner) external view returns (uint256) {
        return pendingWinners[winner];
    }

    function getNextHourlyDraw() external view returns (uint256) {
        return lastHourlyDraw + INTERVAL_HOURLY;
    }

    function getNextProtocolPayout() external view returns (uint256) {
        // Prochain 03:13 AM GMT
        uint256 todayBase = (block.timestamp / 1 days) * 1 days;
        uint256 todayWindow = todayBase + PROTOCOL_PAYOUT_START;
        if (block.timestamp >= todayWindow) {
            return todayWindow + 1 days;
        }
        return todayWindow;
    }

    function getTicketsForAddress(address player)
        external
        view
        returns (uint256 hourly, uint256 daily, uint256 weekly, uint256 monthly)
    {
        for (uint256 i = 0; i < ticketsHourly.length; i++)
            if (ticketsHourly[i] == player) hourly++;
        for (uint256 i = 0; i < ticketsDaily.length; i++)
            if (ticketsDaily[i] == player) daily++;
        for (uint256 i = 0; i < ticketsWeekly.length; i++)
            if (ticketsWeekly[i] == player) weekly++;
        for (uint256 i = 0; i < ticketsMonthly.length; i++)
            if (ticketsMonthly[i] == player) monthly++;
    }
}
