const crypto = require("crypto");
const cookie = require("cookie");
const User = require('../models/User');
const { verifyToken } = require("../utils/jwt");

function shuffleArrayCrypto(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getCookie(cookies, name, defaultValue, parseJson = false) {
    const cookieVal = cookies[name];
    if (!cookieVal) return defaultValue;
    try {
        return parseJson ? JSON.parse(cookieVal) : cookieVal;
    } catch (error) {
        console.error(`Failed to parse cookie "${name}":`, error);
        return defaultValue;
    }
}

function getCustomTimeString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function initSocketListeners(io) {
    io.on("connection", async (socket) => {
        const rawCookies = cookie.parse(socket.handshake.headers.cookie || "");
        const token = rawCookies.token;
        const balanceToken = rawCookies.RequiredBalanceToken;

        if (!token || !balanceToken) {
            return socket.emit("errorMsg", "🚫 Missing authentication token.");
        }

        let userId, requiredBalance = 0;
        try {
            const verifiedToken = verifyToken(token);
            const verifiedBalanceToken = verifyToken(balanceToken);
            userId = verifiedToken.id;
            requiredBalance = parseFloat(verifiedBalanceToken.requiredBalance) || 0;
        } catch (error) {
            return socket.emit("errorMsg", "🚫 Invalid or expired token.");
        }

        const selectedCarts = getCookie(rawCookies, "SelectedCarts", [], true);
        const winningAmount = getCookie(rawCookies, "WinningAmount", 0, false);
        const betBirr = parseFloat(getCookie(rawCookies, "BetBirr", 0, false));

        try {
            const user = await User.findById(userId);
            if (!user) {
                return socket.emit("errorMsg", "🚫 User not found.");
            }

            let balanceDeducted = false;
            let gameStarted = false;
            let gameIndex = null;

            socket.on("sendNumbers", async () => {
                if (gameStarted) {
                    const numbers = shuffleArrayCrypto([...Array(75).keys()].map(n => n + 1));
                    socket.emit("displayNumbers", numbers);
                    return;
                }

                if (!balanceDeducted) {
                    if (user.balance < requiredBalance) {
                        return socket.emit("errorMsg", "💸 Insufficient balance.");
                    }

                    const time = getCustomTimeString();
                    user.balance -= requiredBalance;

                    const newGame = {
                        gameStart: time,
                        gameEnd: time,
                        betBirr,
                        pickedCards: selectedCarts,
                        onCalls: [],
                        winnerCards: [],
                        luckypassedCards: [],
                        dersh: winningAmount,
                        commission: requiredBalance || 0,
                        by: user.username,
                        shopname: user.shopname || user.name,
                        time,
                        index: user.games.length,
                    };

                    user.games.push(newGame);
                    await user.save();

                    balanceDeducted = true;
                    gameStarted = true;
                    gameIndex = newGame.index;

                    const numbers = shuffleArrayCrypto([...Array(75).keys()].map(n => n + 1));
                    socket.emit("displayNumbers", numbers);
                }
            });

            let isSaving = false;  // Lock to prevent parallel saves

socket.on("chake", async ({ cart, winner, luckyPassed }) => {
    try {
        // Early exit if a save is already in progress
        if (isSaving) {
            return socket.emit("errorMsg", "⚠️ Save in progress. Please wait.");
        }

        isSaving = true;  // Set the lock

        if (!cart || typeof cart !== "string") {
            return socket.emit("errorMsg", "⚠️ Invalid cart format.");
        }

        if (gameIndex === null || !user.games || !user.games[gameIndex]) {
            return socket.emit("errorMsg", "⚠️ Game not initialized.");
        }

        const currentGame = user.games[gameIndex];
        currentGame.onCalls = currentGame.onCalls || [];

        // Update onCalls
        if (!currentGame.onCalls.includes(cart)) {
            currentGame.onCalls.push(cart);
        }

        // Update winnerCards only if winner is true
        if (winner && !currentGame.winnerCards.includes(cart)) {
            currentGame.winnerCards.push(cart);
        }

        // Update luckypassedCards only if luckyPassed is true
        if (luckyPassed && !currentGame.luckypassedCards.includes(cart)) {
            currentGame.luckypassedCards.push(cart);
        }

        // Update the gameEnd time
        currentGame.gameEnd = getCustomTimeString();
        user.markModified("games");
        await user.save();
        socket.emit("successMsg", "✅ Game data updated.");
    } catch (err) {
        socket.emit("errorMsg", "⚠️ Failed to update game data.");
    } finally {
        isSaving = false;  // Release the lock
    }
});

        } catch (error) {
            socket.emit("errorMsg", "⚠️ An unexpected error occurred.");
        }
    });
}

module.exports = initSocketListeners;